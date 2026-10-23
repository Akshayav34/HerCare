import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { sha256Hash, generateSecureToken } from '../lib/crypto';
import {
  UserProfile,
  MedicalHistoryItem,
  AllergyItem,
  MedicalRecord,
  Prescription,
  Medication,
  Appointment,
  Reminder,
  EmergencyContact,
  EmergencyCardConfig,
  EmergencyCardToken,
  EmergencyAccessLog,
  AppNotification,
  UserSettings,
  EmergencyCardViewData,
} from '../types';
import {
  DEMO_USER_ID,
  INITIAL_DEMO_PROFILE,
  INITIAL_DEMO_ALLERGIES,
  INITIAL_DEMO_HISTORY,
  INITIAL_DEMO_RECORDS,
  INITIAL_DEMO_PRESCRIPTIONS,
  INITIAL_DEMO_MEDICATIONS,
  INITIAL_DEMO_APPOINTMENTS,
  INITIAL_DEMO_REMINDERS,
  INITIAL_DEMO_CONTACTS,
  INITIAL_DEMO_CARD_CONFIG,
  INITIAL_DEMO_TOKENS,
  INITIAL_DEMO_NOTIFICATIONS,
  INITIAL_DEMO_SETTINGS,
  DEMO_SAMPLE_PLAIN_TOKEN,
  DEMO_SAMPLE_TOKEN_HASH,
  FICTIONAL_SAMPLE_EMERGENCY_CARD,
} from './mockData';

const STORAGE_KEYS = {
  PROFILE: 'hercare_profile',
  ALLERGIES: 'hercare_allergies',
  HISTORY: 'hercare_history',
  RECORDS: 'hercare_records',
  PRESCRIPTIONS: 'hercare_prescriptions',
  MEDICATIONS: 'hercare_medications',
  APPOINTMENTS: 'hercare_appointments',
  REMINDERS: 'hercare_reminders',
  CONTACTS: 'hercare_contacts',
  CARD_CONFIG: 'hercare_card_config',
  TOKENS: 'hercare_tokens',
  LOGS: 'hercare_access_logs',
  NOTIFICATIONS: 'hercare_notifications',
  SETTINGS: 'hercare_settings',
};

// Helper to initialize local demo store if empty
function initializeDemoStore() {
  if (!localStorage.getItem(STORAGE_KEYS.PROFILE)) {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(INITIAL_DEMO_PROFILE));
    localStorage.setItem(STORAGE_KEYS.ALLERGIES, JSON.stringify(INITIAL_DEMO_ALLERGIES));
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(INITIAL_DEMO_HISTORY));
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(INITIAL_DEMO_RECORDS));
    localStorage.setItem(STORAGE_KEYS.PRESCRIPTIONS, JSON.stringify(INITIAL_DEMO_PRESCRIPTIONS));
    localStorage.setItem(STORAGE_KEYS.MEDICATIONS, JSON.stringify(INITIAL_DEMO_MEDICATIONS));
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(INITIAL_DEMO_APPOINTMENTS));
    localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(INITIAL_DEMO_REMINDERS));
    localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(INITIAL_DEMO_CONTACTS));
    localStorage.setItem(STORAGE_KEYS.CARD_CONFIG, JSON.stringify(INITIAL_DEMO_CARD_CONFIG));
    localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_DEMO_NOTIFICATIONS));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_DEMO_SETTINGS));
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify([]));
  }

  // Always seed the demo tokens into the global lookup mapping
  try {
    const allTokens: Record<string, EmergencyCardToken> = JSON.parse(localStorage.getItem('hercare_all_tokens') || '{}');
    allTokens[DEMO_SAMPLE_PLAIN_TOKEN] = INITIAL_DEMO_TOKENS[0];
    allTokens[DEMO_SAMPLE_TOKEN_HASH] = INITIAL_DEMO_TOKENS[0];
    allTokens['d837f48037cf9d997636e0d37e6f8a42c3848bcf629d8e578dae398caecbe7bb'] = INITIAL_DEMO_TOKENS[0];
    localStorage.setItem('hercare_all_tokens', JSON.stringify(allTokens));
  } catch (e) {}
}

initializeDemoStore();

function getUserKey(baseKey: string, userId: string): string {
  return userId === DEMO_USER_ID ? baseKey : `${baseKey}_${userId}`;
}

export const dataService = {
  // PROFILES
  async getProfile(userId: string): Promise<UserProfile> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (!error && data) return data as UserProfile;
    }
    const key = getUserKey(STORAGE_KEYS.PROFILE, userId);
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);

    if (userId === DEMO_USER_ID) {
      return INITIAL_DEMO_PROFILE;
    }

    // Default skeleton for new local account
    return {
      id: userId,
      email: 'user@example.com',
      full_name: 'Patient',
      date_of_birth: '',
      blood_group: 'Unknown',
      phone_number: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  },

  async updateProfile(profile: Partial<UserProfile> & { id: string }): Promise<UserProfile> {
    const updated = {
      ...profile,
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('profiles').upsert(updated).select().single();
      if (error) throw new Error(error.message);
      return data as UserProfile;
    }

    const current = await this.getProfile(profile.id);
    const merged = { ...current, ...updated };
    const key = getUserKey(STORAGE_KEYS.PROFILE, profile.id);
    localStorage.setItem(key, JSON.stringify(merged));
    if (profile.id === DEMO_USER_ID) {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(merged));
    }
    return merged;
  },

  // MEDICAL HISTORY
  async getHistory(userId: string): Promise<MedicalHistoryItem[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('medical_history').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (!error && data) return data as MedicalHistoryItem[];
    }
    const key = getUserKey(STORAGE_KEYS.HISTORY, userId);
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
    return userId === DEMO_USER_ID ? INITIAL_DEMO_HISTORY : [];
  },

  async addHistory(item: Omit<MedicalHistoryItem, 'id' | 'created_at' | 'updated_at'>): Promise<MedicalHistoryItem> {
    const newItem: MedicalHistoryItem = {
      ...item,
      id: 'hist-' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('medical_history').insert(item).select().single();
      if (error) throw new Error(error.message);
      return data as MedicalHistoryItem;
    }

    const list = await this.getHistory(item.user_id);
    const updatedList = [newItem, ...list];
    const key = getUserKey(STORAGE_KEYS.HISTORY, item.user_id);
    localStorage.setItem(key, JSON.stringify(updatedList));
    return newItem;
  },

  async updateHistory(id: string, updates: Partial<MedicalHistoryItem>, userId: string = DEMO_USER_ID): Promise<MedicalHistoryItem> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('medical_history').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      return data as MedicalHistoryItem;
    }

    const key = getUserKey(STORAGE_KEYS.HISTORY, userId);
    const list = await this.getHistory(userId);
    const index = list.findIndex(i => i.id === id);
    if (index === -1) throw new Error('History entry not found');
    list[index] = { ...list[index], ...updates, updated_at: new Date().toISOString() };
    localStorage.setItem(key, JSON.stringify(list));
    return list[index];
  },

  async deleteHistory(id: string, userId: string = DEMO_USER_ID): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.from('medical_history').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return;
    }

    const key = getUserKey(STORAGE_KEYS.HISTORY, userId);
    const list = await this.getHistory(userId);
    const filtered = list.filter(i => i.id !== id);
    localStorage.setItem(key, JSON.stringify(filtered));
  },

  // ALLERGIES
  async getAllergies(userId: string): Promise<AllergyItem[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('allergies').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (!error && data) return data as AllergyItem[];
    }
    const key = getUserKey(STORAGE_KEYS.ALLERGIES, userId);
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
    return userId === DEMO_USER_ID ? INITIAL_DEMO_ALLERGIES : [];
  },

  async addAllergy(item: Omit<AllergyItem, 'id' | 'created_at' | 'updated_at'>): Promise<AllergyItem> {
    const newItem: AllergyItem = {
      ...item,
      id: 'alg-' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('allergies').insert(item).select().single();
      if (error) throw new Error(error.message);
      return data as AllergyItem;
    }

    const list = await this.getAllergies(item.user_id);
    const updatedList = [newItem, ...list];
    const key = getUserKey(STORAGE_KEYS.ALLERGIES, item.user_id);
    localStorage.setItem(key, JSON.stringify(updatedList));
    return newItem;
  },

  async updateAllergy(id: string, updates: Partial<AllergyItem>, userId: string = DEMO_USER_ID): Promise<AllergyItem> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('allergies').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      return data as AllergyItem;
    }

    const key = getUserKey(STORAGE_KEYS.ALLERGIES, userId);
    const list = await this.getAllergies(userId);
    const index = list.findIndex(a => a.id === id);
    if (index === -1) throw new Error('Allergy entry not found');
    list[index] = { ...list[index], ...updates, updated_at: new Date().toISOString() };
    localStorage.setItem(key, JSON.stringify(list));
    return list[index];
  },

  async deleteAllergy(id: string, userId: string = DEMO_USER_ID): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.from('allergies').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return;
    }

    const key = getUserKey(STORAGE_KEYS.ALLERGIES, userId);
    const list = await this.getAllergies(userId);
    const filtered = list.filter(a => a.id !== id);
    localStorage.setItem(key, JSON.stringify(filtered));
  },

  // MEDICAL RECORDS
  async getRecords(userId: string): Promise<MedicalRecord[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('medical_records').select('*').eq('user_id', userId).order('record_date', { ascending: false });
      if (!error && data) return data as MedicalRecord[];
    }
    const key = getUserKey(STORAGE_KEYS.RECORDS, userId);
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
    return userId === DEMO_USER_ID ? INITIAL_DEMO_RECORDS : [];
  },

  async addRecord(record: Omit<MedicalRecord, 'id' | 'created_at' | 'updated_at'>): Promise<MedicalRecord> {
    const newRecord: MedicalRecord = {
      ...record,
      id: 'rec-' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('medical_records').insert(record).select().single();
      if (error) throw new Error(error.message);
      return data as MedicalRecord;
    }

    const list = await this.getRecords(record.user_id);
    const updatedList = [newRecord, ...list];
    const key = getUserKey(STORAGE_KEYS.RECORDS, record.user_id);
    localStorage.setItem(key, JSON.stringify(updatedList));
    return newRecord;
  },

  async updateRecord(id: string, updates: Partial<MedicalRecord>, userId: string = DEMO_USER_ID): Promise<MedicalRecord> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('medical_records').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      return data as MedicalRecord;
    }

    const key = getUserKey(STORAGE_KEYS.RECORDS, userId);
    const list = await this.getRecords(userId);
    const index = list.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Record not found');
    list[index] = { ...list[index], ...updates, updated_at: new Date().toISOString() };
    localStorage.setItem(key, JSON.stringify(list));
    return list[index];
  },

  async deleteRecord(id: string, userId: string = DEMO_USER_ID): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.from('medical_records').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return;
    }

    const key = getUserKey(STORAGE_KEYS.RECORDS, userId);
    const list = await this.getRecords(userId);
    const filtered = list.filter(r => r.id !== id);
    localStorage.setItem(key, JSON.stringify(filtered));
  },

  // PRESCRIPTIONS
  async getPrescriptions(userId: string): Promise<Prescription[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('prescriptions').select('*').eq('user_id', userId).order('issue_date', { ascending: false });
      if (!error && data) return data as Prescription[];
    }
    const key = getUserKey(STORAGE_KEYS.PRESCRIPTIONS, userId);
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
    return userId === DEMO_USER_ID ? INITIAL_DEMO_PRESCRIPTIONS : [];
  },

  async addPrescription(p: Omit<Prescription, 'id' | 'created_at' | 'updated_at'>): Promise<Prescription> {
    const newP: Prescription = {
      ...p,
      id: 'rx-' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('prescriptions').insert(p).select().single();
      if (error) throw new Error(error.message);
      return data as Prescription;
    }

    const list = await this.getPrescriptions(p.user_id);
    const updatedList = [newP, ...list];
    const key = getUserKey(STORAGE_KEYS.PRESCRIPTIONS, p.user_id);
    localStorage.setItem(key, JSON.stringify(updatedList));
    return newP;
  },

  async deletePrescription(id: string, userId: string = DEMO_USER_ID): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.from('prescriptions').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return;
    }

    const key = getUserKey(STORAGE_KEYS.PRESCRIPTIONS, userId);
    const list = await this.getPrescriptions(userId);
    const filtered = list.filter(p => p.id !== id);
    localStorage.setItem(key, JSON.stringify(filtered));
  },

  // MEDICATIONS
  async getMedications(userId: string): Promise<Medication[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('medications').select('*').eq('user_id', userId).order('start_date', { ascending: false });
      if (!error && data) return data as Medication[];
    }
    const key = getUserKey(STORAGE_KEYS.MEDICATIONS, userId);
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
    return userId === DEMO_USER_ID ? INITIAL_DEMO_MEDICATIONS : [];
  },

  async addMedication(med: Omit<Medication, 'id' | 'created_at' | 'updated_at'>): Promise<Medication> {
    const newMed: Medication = {
      ...med,
      id: 'med-' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('medications').insert(med).select().single();
      if (error) throw new Error(error.message);
      return data as Medication;
    }

    const list = await this.getMedications(med.user_id);
    const updatedList = [newMed, ...list];
    const key = getUserKey(STORAGE_KEYS.MEDICATIONS, med.user_id);
    localStorage.setItem(key, JSON.stringify(updatedList));
    return newMed;
  },

  async updateMedication(id: string, updates: Partial<Medication>, userId: string = DEMO_USER_ID): Promise<Medication> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('medications').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      return data as Medication;
    }

    const key = getUserKey(STORAGE_KEYS.MEDICATIONS, userId);
    const list = await this.getMedications(userId);
    const index = list.findIndex(m => m.id === id);
    if (index === -1) throw new Error('Medication not found');
    list[index] = { ...list[index], ...updates, updated_at: new Date().toISOString() };
    localStorage.setItem(key, JSON.stringify(list));
    return list[index];
  },

  async deleteMedication(id: string, userId: string = DEMO_USER_ID): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.from('medications').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return;
    }

    const key = getUserKey(STORAGE_KEYS.MEDICATIONS, userId);
    const list = await this.getMedications(userId);
    const filtered = list.filter(m => m.id !== id);
    localStorage.setItem(key, JSON.stringify(filtered));
  },

  // APPOINTMENTS
  async getAppointments(userId: string): Promise<Appointment[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('appointments').select('*').eq('user_id', userId).order('appointment_date', { ascending: true });
      if (!error && data) return data as Appointment[];
    }
    const key = getUserKey(STORAGE_KEYS.APPOINTMENTS, userId);
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
    return userId === DEMO_USER_ID ? INITIAL_DEMO_APPOINTMENTS : [];
  },

  async addAppointment(apt: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>): Promise<Appointment> {
    const newApt: Appointment = {
      ...apt,
      id: 'apt-' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('appointments').insert(apt).select().single();
      if (error) throw new Error(error.message);
      return data as Appointment;
    }

    const list = await this.getAppointments(apt.user_id);
    const updatedList = [...list, newApt];
    const key = getUserKey(STORAGE_KEYS.APPOINTMENTS, apt.user_id);
    localStorage.setItem(key, JSON.stringify(updatedList));
    return newApt;
  },

  async updateAppointment(id: string, updates: Partial<Appointment>, userId: string = DEMO_USER_ID): Promise<Appointment> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('appointments').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      return data as Appointment;
    }

    const key = getUserKey(STORAGE_KEYS.APPOINTMENTS, userId);
    const list = await this.getAppointments(userId);
    const index = list.findIndex(a => a.id === id);
    if (index === -1) throw new Error('Appointment not found');
    list[index] = { ...list[index], ...updates, updated_at: new Date().toISOString() };
    localStorage.setItem(key, JSON.stringify(list));
    return list[index];
  },

  async deleteAppointment(id: string, userId: string = DEMO_USER_ID): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return;
    }

    const key = getUserKey(STORAGE_KEYS.APPOINTMENTS, userId);
    const list = await this.getAppointments(userId);
    const filtered = list.filter(a => a.id !== id);
    localStorage.setItem(key, JSON.stringify(filtered));
  },

  // REMINDERS
  async getReminders(userId: string): Promise<Reminder[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('reminders').select('*').eq('user_id', userId).order('scheduled_time', { ascending: true });
      if (!error && data) return data as Reminder[];
    }
    const key = getUserKey(STORAGE_KEYS.REMINDERS, userId);
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
    return userId === DEMO_USER_ID ? INITIAL_DEMO_REMINDERS : [];
  },

  async addReminder(rem: Omit<Reminder, 'id' | 'created_at' | 'updated_at'>): Promise<Reminder> {
    const newRem: Reminder = {
      ...rem,
      id: 'rem-' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('reminders').insert(rem).select().single();
      if (error) throw new Error(error.message);
      return data as Reminder;
    }

    const list = await this.getReminders(rem.user_id);
    const updatedList = [...list, newRem];
    const key = getUserKey(STORAGE_KEYS.REMINDERS, rem.user_id);
    localStorage.setItem(key, JSON.stringify(updatedList));
    return newRem;
  },

  async updateReminder(id: string, updates: Partial<Reminder>, userId: string = DEMO_USER_ID): Promise<Reminder> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('reminders').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      return data as Reminder;
    }

    const key = getUserKey(STORAGE_KEYS.REMINDERS, userId);
    const list = await this.getReminders(userId);
    const index = list.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Reminder not found');
    list[index] = { ...list[index], ...updates, updated_at: new Date().toISOString() };
    localStorage.setItem(key, JSON.stringify(list));
    return list[index];
  },

  async deleteReminder(id: string, userId: string = DEMO_USER_ID): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.from('reminders').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return;
    }

    const key = getUserKey(STORAGE_KEYS.REMINDERS, userId);
    const list = await this.getReminders(userId);
    const filtered = list.filter(r => r.id !== id);
    localStorage.setItem(key, JSON.stringify(filtered));
  },

  // EMERGENCY CONTACTS
  async getContacts(userId: string): Promise<EmergencyContact[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('emergency_contacts').select('*').eq('user_id', userId).order('priority_order', { ascending: true });
      if (!error && data) return data as EmergencyContact[];
    }
    const key = getUserKey(STORAGE_KEYS.CONTACTS, userId);
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
    return userId === DEMO_USER_ID ? INITIAL_DEMO_CONTACTS : [];
  },

  async addContact(c: Omit<EmergencyContact, 'id' | 'created_at' | 'updated_at'>): Promise<EmergencyContact> {
    const newC: EmergencyContact = {
      ...c,
      id: 'cnt-' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('emergency_contacts').insert(c).select().single();
      if (error) throw new Error(error.message);
      return data as EmergencyContact;
    }

    const list = await this.getContacts(c.user_id);
    const updatedList = [...list, newC];
    const key = getUserKey(STORAGE_KEYS.CONTACTS, c.user_id);
    localStorage.setItem(key, JSON.stringify(updatedList));
    return newC;
  },

  async updateContact(id: string, updates: Partial<EmergencyContact>, userId: string = DEMO_USER_ID): Promise<EmergencyContact> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('emergency_contacts').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      return data as EmergencyContact;
    }

    const key = getUserKey(STORAGE_KEYS.CONTACTS, userId);
    const list = await this.getContacts(userId);
    const index = list.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Contact not found');
    list[index] = { ...list[index], ...updates, updated_at: new Date().toISOString() };
    localStorage.setItem(key, JSON.stringify(list));
    return list[index];
  },

  async deleteContact(id: string, userId: string = DEMO_USER_ID): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.from('emergency_contacts').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return;
    }

    const key = getUserKey(STORAGE_KEYS.CONTACTS, userId);
    const list = await this.getContacts(userId);
    const filtered = list.filter(c => c.id !== id);
    localStorage.setItem(key, JSON.stringify(filtered));
  },

  // EMERGENCY CARD CONFIGURATION
  async getCardConfig(userId: string): Promise<EmergencyCardConfig> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('emergency_cards').select('*').eq('user_id', userId).single();
      if (!error && data) return data as EmergencyCardConfig;
    }
    const key = getUserKey(STORAGE_KEYS.CARD_CONFIG, userId);
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
    return userId === DEMO_USER_ID ? INITIAL_DEMO_CARD_CONFIG : {
      id: 'cfg-' + userId,
      user_id: userId,
      share_name: true,
      share_blood_group: true,
      share_allergies: true,
      share_conditions: true,
      share_medications: true,
      share_primary_contact: true,
      share_secondary_contact: false,
      emergency_notes: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  },

  async updateCardConfig(config: Partial<EmergencyCardConfig> & { user_id: string }): Promise<EmergencyCardConfig> {
    const updated = {
      ...config,
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.from('emergency_cards').upsert(updated).select().single();
        if (!error && data) return data as EmergencyCardConfig;
      } catch (err) {
        console.warn('Supabase updateCardConfig error, falling back to local store:', err);
      }
    }

    const current = await this.getCardConfig(config.user_id);
    const merged = { ...current, ...updated };
    const key = getUserKey(STORAGE_KEYS.CARD_CONFIG, config.user_id);
    localStorage.setItem(key, JSON.stringify(merged));
    return merged as EmergencyCardConfig;
  },

  // EMERGENCY QR TOKENS
  async getTokens(userId: string): Promise<EmergencyCardToken[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.from('emergency_card_tokens').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        if (!error && data) return data as EmergencyCardToken[];
      } catch (err) {
        console.warn('Supabase getTokens error, falling back to local store:', err);
      }
    }
    const key = getUserKey(STORAGE_KEYS.TOKENS, userId);
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
    return [];
  },

  async createEmergencyToken(
    userId: string,
    durationHours: number = 24 * 30,
    label: string = 'Emergency Health Card QR'
  ): Promise<{ tokenRecord: EmergencyCardToken; plainToken: string }> {
    const plainToken = generateSecureToken(32);
    const tokenHash = await sha256Hash(plainToken);
    const expiresAt = new Date(Date.now() + durationHours * 3600000).toISOString();

    const record: EmergencyCardToken = {
      id: 'tok-' + Date.now(),
      user_id: userId,
      token_hash: tokenHash,
      label,
      expires_at: expiresAt,
      is_revoked: false,
      created_at: new Date().toISOString(),
      plain_token: plainToken,
    };

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.from('emergency_card_tokens').insert({
          user_id: userId,
          token_hash: tokenHash,
          label,
          expires_at: expiresAt,
          is_revoked: false,
        }).select().single();

        if (!error && data) {
          const remoteRecord = { ...(data as EmergencyCardToken), plain_token: plainToken };
          localStorage.setItem(`hercare_plain_token_${userId}`, plainToken);
          const allTokens: Record<string, EmergencyCardToken> = JSON.parse(localStorage.getItem('hercare_all_tokens') || '{}');
          allTokens[tokenHash] = remoteRecord;
          allTokens[plainToken] = remoteRecord;
          localStorage.setItem('hercare_all_tokens', JSON.stringify(allTokens));
          return { tokenRecord: remoteRecord, plainToken };
        }
      } catch (err) {
        console.warn('Supabase createEmergencyToken error, falling back to local store:', err);
      }
    }

    // Local Storage persistent store
    const currentTokens = await this.getTokens(userId);
    const updated = [record, ...currentTokens.filter(t => t.id !== record.id)];
    const key = getUserKey(STORAGE_KEYS.TOKENS, userId);
    localStorage.setItem(key, JSON.stringify(updated));

    // Store plain_token locally for patient's QR display
    localStorage.setItem(`hercare_plain_token_${userId}`, plainToken);

    // Keep global lookup mapping for public token resolution in local mode
    const allTokens: Record<string, EmergencyCardToken> = JSON.parse(localStorage.getItem('hercare_all_tokens') || '{}');
    allTokens[tokenHash] = record;
    allTokens[plainToken] = record;
    localStorage.setItem('hercare_all_tokens', JSON.stringify(allTokens));

    return { tokenRecord: record, plainToken };
  },

  async revokeEmergencyToken(tokenId: string, reason: string = 'User revoked access', userId: string = DEMO_USER_ID): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase.rpc('revoke_emergency_token', {
          p_token_id: tokenId,
          p_reason: reason,
        });
        if (!error) {
          localStorage.removeItem(`hercare_plain_token_${userId}`);
          return;
        }
      } catch (err) {
        console.warn('Supabase revokeEmergencyToken error, falling back to local store:', err);
      }
    }

    const key = getUserKey(STORAGE_KEYS.TOKENS, userId);
    const tokens = await this.getTokens(userId);
    const target = tokens.find(t => t.id === tokenId);
    if (target) {
      target.is_revoked = true;
      target.revoked_at = new Date().toISOString();
      target.revocation_reason = reason;
      localStorage.setItem(key, JSON.stringify(tokens));

      const allTokens: Record<string, EmergencyCardToken> = JSON.parse(localStorage.getItem('hercare_all_tokens') || '{}');
      if (allTokens[target.token_hash]) allTokens[target.token_hash].is_revoked = true;
      if (target.plain_token && allTokens[target.plain_token]) allTokens[target.plain_token].is_revoked = true;
      localStorage.setItem('hercare_all_tokens', JSON.stringify(allTokens));
    }
    localStorage.removeItem(`hercare_plain_token_${userId}`);
  },

  async getAccessLogs(userId: string): Promise<EmergencyAccessLog[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('emergency_access_logs').select('*').eq('user_id', userId).order('accessed_at', { ascending: false });
      if (!error && data) return data as EmergencyAccessLog[];
    }
    const key = getUserKey(STORAGE_KEYS.LOGS, userId);
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  },

  async resolveEmergencyToken(plainToken: string): Promise<EmergencyCardViewData> {
    if (!plainToken) {
      return {
        success: false,
        error: 'INVALID_TOKEN',
        message: 'No emergency token provided in URL.',
      };
    }

    const cleanToken = decodeURIComponent(plainToken || '').trim().replace(/^.*\/emergency\//, '');
    const tokenHash = await sha256Hash(cleanToken);

    // 1. ISOLATED FICTIONAL SAMPLE DEMO RESOLUTION (Requirements 1 & 2)
    // The fixed demo token accesses ONLY the hardcoded fictional sample record, NEVER any real user profile.
    if (cleanToken === DEMO_SAMPLE_PLAIN_TOKEN || tokenHash === DEMO_SAMPLE_TOKEN_HASH) {
      return FICTIONAL_SAMPLE_EMERGENCY_CARD;
    }

    // 2. LIVE SUPABASE RPC VALIDATION (Requirements 6, 7, 8 & 9)
    // When Supabase is configured, all real tokens are validated strictly by the database RPC function.
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.rpc('get_emergency_card_by_token', {
        p_token_hash: tokenHash,
        p_ip_summary: 'web-viewer',
        p_agent_summary: typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 50) : 'Web Client',
      });

      if (error) {
        return {
          success: false,
          error: 'RPC_ERROR',
          message: error.message || 'Database validation error occurred.',
        };
      }

      if (data) {
        // Enforces expiration, revocation, and server-side field restrictions without fallback (Requirement 9)
        return data as EmergencyCardViewData;
      }

      return {
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Emergency token not found or invalid.',
      };
    }

    // 3. UNCONFIGURED BACKEND RESTRICTION
    // Requirement 9: Do not use localStorage as the source of truth for live emergency cards.
    // In production, live emergency cards require Supabase backend validation.
    const isLocalDevSandbox = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO_MODE === 'true';
    if (!isLocalDevSandbox) {
      return {
        success: false,
        error: 'BACKEND_NOT_CONFIGURED',
        message: 'Live emergency cards require a connected Supabase database backend. Browser localStorage is not a source of truth for live responder access.',
      };
    }

    // Local Development Sandbox Only (Single-browser offline testing)
    const allTokens: Record<string, EmergencyCardToken> = JSON.parse(localStorage.getItem('hercare_all_tokens') || '{}');
    const matchedToken: EmergencyCardToken | undefined =
      allTokens[tokenHash] ||
      allTokens[cleanToken];

    if (!matchedToken) {
      // REQUIREMENT 9: Invalid real tokens MUST NOT fall back to sample card!
      return {
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Emergency token not found or invalid in local storage. Note: Browser localStorage is device-isolated; live cross-device scanning requires Supabase backend.',
      };
    }

    // Check if revoked (Requirement 7)
    if (matchedToken.is_revoked) {
      // Record access attempt without sensitive health data (Requirement 8)
      try {
        const logKey = getUserKey(STORAGE_KEYS.LOGS, matchedToken.user_id);
        const logs: EmergencyAccessLog[] = JSON.parse(localStorage.getItem(logKey) || '[]');
        logs.unshift({
          id: 'log-' + Date.now(),
          token_id: matchedToken.id,
          user_id: matchedToken.user_id,
          accessed_at: new Date().toISOString(),
          accessor_ip_hash: 'local-test-client',
          user_agent_summary: typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 50) : 'Local Client',
          status: 'revoked',
        });
        localStorage.setItem(logKey, JSON.stringify(logs));
      } catch (e) {}

      // REQUIREMENT 9: Revoked tokens CANNOT fall back to sample card!
      return {
        success: false,
        error: 'REVOKED_TOKEN',
        message: 'This emergency health card QR code has been revoked by the patient for security.',
      };
    }

    // Check if expired (Requirement 7)
    if (new Date(matchedToken.expires_at) < new Date()) {
      try {
        const logKey = getUserKey(STORAGE_KEYS.LOGS, matchedToken.user_id);
        const logs: EmergencyAccessLog[] = JSON.parse(localStorage.getItem(logKey) || '[]');
        logs.unshift({
          id: 'log-' + Date.now(),
          token_id: matchedToken.id,
          user_id: matchedToken.user_id,
          accessed_at: new Date().toISOString(),
          accessor_ip_hash: 'local-test-client',
          user_agent_summary: typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 50) : 'Local Client',
          status: 'expired',
        });
        localStorage.setItem(logKey, JSON.stringify(logs));
      } catch (e) {}

      // REQUIREMENT 9: Expired tokens CANNOT fall back to sample card!
      return {
        success: false,
        error: 'EXPIRED_TOKEN',
        message: 'This emergency health card QR code has expired.',
      };
    }

    // Record granted access event without storing sensitive medical details (Requirement 8)
    try {
      const logKey = getUserKey(STORAGE_KEYS.LOGS, matchedToken.user_id);
      const logs: EmergencyAccessLog[] = JSON.parse(localStorage.getItem(logKey) || '[]');
      logs.unshift({
        id: 'log-' + Date.now(),
        token_id: matchedToken.id,
        user_id: matchedToken.user_id,
        accessed_at: new Date().toISOString(),
        accessor_ip_hash: 'local-test-client',
        user_agent_summary: typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 50) : 'Local Client',
        status: 'granted',
      });
      localStorage.setItem(logKey, JSON.stringify(logs));
    } catch (e) {}

    // Compile permitted fields according to patient config (Requirement 7)
    const config = await this.getCardConfig(matchedToken.user_id);
    const profile = await this.getProfile(matchedToken.user_id);
    const allergies = await this.getAllergies(matchedToken.user_id);
    const history = await this.getHistory(matchedToken.user_id);
    const medications = await this.getMedications(matchedToken.user_id);
    const contacts = await this.getContacts(matchedToken.user_id);

    const primaryContact = contacts.find(c => c.is_primary) || contacts[0];

    const viewData: EmergencyCardViewData = {
      success: true,
      is_demo: false,
      last_updated: config.updated_at,
      emergency_notes: config.emergency_notes || '',
    };

    if (config.share_name) {
      viewData.full_name = profile.full_name || 'Patient';
    }

    if (config.share_blood_group) {
      viewData.blood_group = profile.blood_group || 'Unknown';
    }

    if (config.share_allergies) {
      viewData.allergies = allergies.map(a => ({
        allergen: a.allergen,
        severity: a.severity,
        reaction: a.reaction,
      }));
    }

    if (config.share_conditions) {
      viewData.conditions = history
        .filter(h => h.is_active)
        .map(h => ({
          title: h.title,
          category: h.category,
          description: h.description,
        }));
    }

    if (config.share_medications) {
      viewData.medications = medications
        .filter(m => m.is_active)
        .map(m => ({
          name: m.name,
          dosage: m.dosage,
          frequency: m.frequency,
          instructions: m.instructions,
        }));
    }

    if (config.share_primary_contact && primaryContact) {
      viewData.primary_contact = {
        name: primaryContact.name,
        relationship: primaryContact.relationship,
        phone_number: primaryContact.phone_number,
      };
    }

    return viewData;
  },

  // NOTIFICATIONS
  async getNotifications(userId: string): Promise<AppNotification[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (!error && data) return data as AppNotification[];
    }
    const key = getUserKey(STORAGE_KEYS.NOTIFICATIONS, userId);
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : (userId === DEMO_USER_ID ? INITIAL_DEMO_NOTIFICATIONS : []);
  },

  async markNotificationRead(id: string, userId: string = DEMO_USER_ID): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      return;
    }
    const key = getUserKey(STORAGE_KEYS.NOTIFICATIONS, userId);
    const list = await this.getNotifications(userId);
    const updated = list.map(n => n.id === id ? { ...n, is_read: true } : n);
    localStorage.setItem(key, JSON.stringify(updated));
  },

  async markAllNotificationsRead(userId: string): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId);
      return;
    }
    const key = getUserKey(STORAGE_KEYS.NOTIFICATIONS, userId);
    const list = await this.getNotifications(userId);
    const updated = list.map(n => ({ ...n, is_read: true }));
    localStorage.setItem(key, JSON.stringify(updated));
  },

  // SETTINGS
  async getSettings(userId: string): Promise<UserSettings> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('user_settings').select('*').eq('user_id', userId).single();
      if (!error && data) return data as UserSettings;
    }
    const key = getUserKey(STORAGE_KEYS.SETTINGS, userId);
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : INITIAL_DEMO_SETTINGS;
  },

  async updateSettings(settings: Partial<UserSettings> & { user_id: string }): Promise<UserSettings> {
    const updated = {
      ...settings,
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('user_settings').upsert(updated).select().single();
      if (error) throw new Error(error.message);
      return data as UserSettings;
    }

    const current = await this.getSettings(settings.user_id);
    const merged = { ...current, ...updated };
    const key = getUserKey(STORAGE_KEYS.SETTINGS, settings.user_id);
    localStorage.setItem(key, JSON.stringify(merged));
    return merged as UserSettings;
  },

  // EXPORT ALL DATA
  async exportUserData(userId: string): Promise<Record<string, unknown>> {
    const [profile, history, allergies, records, prescriptions, medications, appointments, reminders, contacts, cardConfig] = await Promise.all([
      this.getProfile(userId),
      this.getHistory(userId),
      this.getAllergies(userId),
      this.getRecords(userId),
      this.getPrescriptions(userId),
      this.getMedications(userId),
      this.getAppointments(userId),
      this.getReminders(userId),
      this.getContacts(userId),
      this.getCardConfig(userId),
    ]);

    return {
      exported_at: new Date().toISOString(),
      platform: 'HerCare Healthcare Platform',
      user: profile,
      medical_history: history,
      allergies,
      medical_records: records,
      prescriptions,
      medications,
      appointments,
      reminders,
      emergency_contacts: contacts,
      emergency_card_settings: cardConfig,
    };
  },

  // RESET / PURGE DATA
  async purgeAccountData(userId: string): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      await supabase.from('profiles').delete().eq('id', userId);
      return;
    }
    localStorage.removeItem(getUserKey(STORAGE_KEYS.PROFILE, userId));
    localStorage.removeItem(getUserKey(STORAGE_KEYS.RECORDS, userId));
    localStorage.removeItem(getUserKey(STORAGE_KEYS.ALLERGIES, userId));
    localStorage.removeItem(getUserKey(STORAGE_KEYS.HISTORY, userId));
    localStorage.removeItem(getUserKey(STORAGE_KEYS.MEDICATIONS, userId));
    localStorage.removeItem(getUserKey(STORAGE_KEYS.APPOINTMENTS, userId));
    localStorage.removeItem(getUserKey(STORAGE_KEYS.REMINDERS, userId));
    localStorage.removeItem(getUserKey(STORAGE_KEYS.CONTACTS, userId));
    localStorage.removeItem(getUserKey(STORAGE_KEYS.CARD_CONFIG, userId));
    localStorage.removeItem(getUserKey(STORAGE_KEYS.TOKENS, userId));
  }
};
