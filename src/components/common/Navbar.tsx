import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Bell, Heart, AlertCircle, Menu, X, User, LogOut, Settings, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Button } from './Button';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, profile, isDemoUser, logout, loginAsDemo } = useAuth();
  const { unreadCount } = useNotifications();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 transition-all">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left Section: Logo & Mobile menu toggle */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-teal-700 to-teal-500 text-white flex items-center justify-center shadow-md shadow-teal-600/20 group-hover:scale-105 transition-transform">
              <Heart className="w-5 h-5 fill-rosepink-200 text-teal-700" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-slate-900 group-hover:text-teal-700 transition-colors">
                  HerCare
                </span>
                {isDemoUser && (
                  <span className="bg-rosepink-100 text-rosepink-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rosepink-200">
                    DEMO
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide hidden sm:block">
                A Women Emergency Health Care
              </p>
            </div>
          </Link>
        </div>

        {/* Right Section: Emergency Quick Action, Notifications, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              {/* Emergency Quick Trigger */}
              <Link to="/emergency-card">
                <Button
                  variant="danger"
                  size="sm"
                  className="font-bold shadow-sm shadow-red-500/20 text-xs px-3 sm:px-4"
                >
                  <AlertCircle className="w-4 h-4 animate-pulse" />
                  <span className="hidden sm:inline">Emergency</span> SOS
                </Button>
              </Link>

              {/* Notification Bell */}
              <Link
                to="/notifications"
                className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-teal-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center border border-teal-200">
                    {profile?.full_name?.charAt(0) || 'H'}
                  </div>
                  <span className="text-xs font-semibold text-slate-700 hidden md:block max-w-[120px] truncate">
                    {profile?.full_name || 'My Profile'}
                  </span>
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {profile?.full_name || 'Patient'}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {user.email}
                      </p>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        <span>Personal Health Profile</span>
                      </Link>

                      <Link
                        to="/settings"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Settings className="w-4 h-4 text-slate-400" />
                        <span>Privacy & Settings</span>
                      </Link>

                      {!isDemoUser && (
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            loginAsDemo();
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-teal-700 hover:bg-teal-50 transition-colors text-left font-medium"
                        >
                          <Sparkles className="w-4 h-4 text-teal-600" />
                          <span>Switch to Demo Account</span>
                        </button>
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors text-left font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={loginAsDemo}
                className="text-teal-700 font-semibold"
              >
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span className="hidden sm:inline">Try Demo</span>
              </Button>

              <Link to="/login">
                <Button variant="outline" size="sm">
                  Log In
                </Button>
              </Link>

              <Link to="/signup">
                <Button variant="primary" size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
