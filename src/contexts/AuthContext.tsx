import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { dataService } from '../services/dataService';
import { UserProfile } from '../types';
import { DEMO_USER_ID, INITIAL_DEMO_PROFILE } from '../services/mockData';

interface LocalUserRecord {
  id: string;
  email: string;
  password?: string;
  fullName: string;
}

interface AuthContextType {
  user: { id: string; email: string } | null;
  profile: UserProfile | null;
  loading: boolean;
  isDemoUser: boolean;
  login: (email: string, password?: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  loginAsDemo: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACTIVE_USER_KEY = 'hercare_active_user';
const LOGGED_OUT_KEY = 'hercare_user_logged_out';
const LOCAL_ACCOUNTS_KEY = 'hercare_registered_accounts';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoUser, setIsDemoUser] = useState(false);

  const loadProfile = async (userId: string) => {
    try {
      const p = await dataService.getProfile(userId);
      setProfile(p);
    } catch (e) {
      console.warn('Could not load profile:', e);
    }
  };

  useEffect(() => {
    // 1. If user explicitly logged out, keep logged out state
    const isLoggedOut = localStorage.getItem(LOGGED_OUT_KEY) === 'true';
    if (isLoggedOut) {
      setUser(null);
      setProfile(null);
      setIsDemoUser(false);
      setLoading(false);
      return;
    }

    // 2. Check for active local/demo user session
    const activeSessionStr = localStorage.getItem(ACTIVE_USER_KEY);
    if (activeSessionStr) {
      try {
        const active = JSON.parse(activeSessionStr);
        if (active?.id && active?.email) {
          setUser({ id: active.id, email: active.email });
          setIsDemoUser(Boolean(active.isDemo));
          loadProfile(active.id).finally(() => setLoading(false));
          return;
        }
      } catch (e) {
        console.warn('Error reading active session:', e);
      }
    }

    // 3. Check Supabase Auth
    if (isSupabaseConfigured() && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const u = { id: session.user.id, email: session.user.email || '' };
          setUser(u);
          setIsDemoUser(false);
          localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify({ ...u, isDemo: false }));
          loadProfile(session.user.id).finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const u = { id: session.user.id, email: session.user.email || '' };
          setUser(u);
          setIsDemoUser(false);
          localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify({ ...u, isDemo: false }));
          loadProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
          localStorage.removeItem(ACTIVE_USER_KEY);
        }
        setLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // First visit default to demo so visitor can explore immediately
      setUser({ id: DEMO_USER_ID, email: INITIAL_DEMO_PROFILE.email });
      setIsDemoUser(true);
      localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify({ id: DEMO_USER_ID, email: INITIAL_DEMO_PROFILE.email, isDemo: true }));
      loadProfile(DEMO_USER_ID).finally(() => setLoading(false));
    }
  }, []);

  const login = async (email: string, password?: string) => {
    setLoading(true);
    localStorage.removeItem(LOGGED_OUT_KEY);

    try {
      // 1. Direct Demo Request
      if (email === 'demo@hercare.org' || (!password && !isSupabaseConfigured())) {
        loginAsDemo();
        return;
      }

      // 2. Supabase Cloud Login
      if (isSupabaseConfigured() && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password || '',
        });
        if (error) throw error;
        if (data.user) {
          const u = { id: data.user.id, email: data.user.email || email };
          setUser(u);
          setIsDemoUser(false);
          localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify({ ...u, isDemo: false }));
          await loadProfile(data.user.id);
        }
        return;
      }

      // 3. Local / Offline Account Lookup
      const accounts: LocalUserRecord[] = JSON.parse(localStorage.getItem(LOCAL_ACCOUNTS_KEY) || '[]');
      const matched = accounts.find(a => a.email.toLowerCase() === email.trim().toLowerCase());

      if (matched) {
        if (password && matched.password && matched.password !== password) {
          throw new Error('Incorrect password. Please verify your credentials.');
        }
        const u = { id: matched.id, email: matched.email };
        setUser(u);
        setIsDemoUser(false);
        localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify({ ...u, isDemo: false }));
        await loadProfile(matched.id);
      } else {
        // If not found in local registered accounts, offer clear guidance
        throw new Error(`Account "${email}" not found. Please click "Sign up here" below to create a new account, or click "Launch Demo".`);
      }
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    setLoading(true);
    localStorage.removeItem(LOGGED_OUT_KEY);

    try {
      const cleanEmail = email.trim();

      if (isSupabaseConfigured() && supabase) {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        if (data.user) {
          await dataService.updateProfile({
            id: data.user.id,
            email: cleanEmail,
            full_name: fullName,
            blood_group: 'Unknown',
            phone_number: '',
            date_of_birth: '',
          });
          const u = { id: data.user.id, email: cleanEmail };
          setUser(u);
          setIsDemoUser(false);
          localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify({ ...u, isDemo: false }));
          await loadProfile(data.user.id);
        }
      } else {
        // Local Registration Store
        const accounts: LocalUserRecord[] = JSON.parse(localStorage.getItem(LOCAL_ACCOUNTS_KEY) || '[]');
        const existing = accounts.find(a => a.email.toLowerCase() === cleanEmail.toLowerCase());
        if (existing) {
          throw new Error('An account with this email address already exists. Please sign in instead.');
        }

        const newId = 'user-' + Date.now();
        const newAccount: LocalUserRecord = {
          id: newId,
          email: cleanEmail,
          password,
          fullName,
        };
        accounts.push(newAccount);
        localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));

        // Create independent fresh personal profile for this user
        const newProfile: UserProfile = {
          id: newId,
          email: cleanEmail,
          full_name: fullName,
          blood_group: 'Unknown',
          phone_number: '',
          date_of_birth: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        await dataService.updateProfile(newProfile);

        const u = { id: newId, email: cleanEmail };
        setUser(u);
        setProfile(newProfile);
        setIsDemoUser(false);
        localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify({ ...u, isDemo: false }));
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured() && supabase && !isDemoUser) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Sign out error:', e);
      }
    }
    localStorage.removeItem(ACTIVE_USER_KEY);
    localStorage.setItem(LOGGED_OUT_KEY, 'true');
    setUser(null);
    setProfile(null);
    setIsDemoUser(false);
  };

  const loginAsDemo = () => {
    localStorage.removeItem(LOGGED_OUT_KEY);
    const u = { id: DEMO_USER_ID, email: INITIAL_DEMO_PROFILE.email };
    localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify({ ...u, isDemo: true }));
    setUser(u);
    setIsDemoUser(true);
    loadProfile(DEMO_USER_ID);
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await loadProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isDemoUser,
        login,
        signUp,
        logout,
        loginAsDemo,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
