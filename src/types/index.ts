// HerCare System Type Definitions

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Unknown';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  date_of_birth: string;
  blood_group: BloodGroup;
  phone_number: string;
  emergency_phone?: string;
  address?: string;
  existing_conditions?: string;
  allergies_summary?: string;
  current_medications_summary?: string;
  profile_photo_url?: string;
  created_at: string;
  updated_at: string;
}

export type HistoryCategory = 
  | 'surgery' 
  | 'chronic_condition' 
  | 'family_history' 
  | 'reproductive_health' 
  | 'vaccination' 
  | 'other';

export interface MedicalHistoryItem {
  id: string;
  user_id: string;
  category: HistoryCategory;
  title: string;
  diagnosis_date?: string;
  description?: string;
  treatment?: string;
  physician_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type AllergyCategory = 'medication' | 'food' | 'environmental' | 'latex' | 'insect' | 'other';
export type AllergySeverity = 'mild' | 'moderate' | 'severe' | 'anaphylactic';

export interface AllergyItem {
  id: string;
  user_id: string;
  allergen: string;
  category: AllergyCategory;
  severity: AllergySeverity;
  reaction?: string;
  diagnosed_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type RecordType = 
  | 'lab_result' 
  | 'imaging_scan' 
  | 'prescription' 
  | 'doctor_note' 
  | 'discharge_summary' 
  | 'vaccine_record' 
  | 'other';

export interface MedicalRecord {
  id: string;
  user_id: string;
  title: string;
  record_type: RecordType;
  record_date: string;
  doctor_name?: string;
  clinic_or_hospital?: string;
  notes?: string;
  file_path?: string;
  file_name?: string;
  file_type?: string;
  file_size_bytes?: number;
  is_confidential: boolean;
  created_at: string;
  updated_at: string;
}

export interface Prescription {
  id: string;
  user_id: string;
  prescribing_doctor: string;
  clinic_or_hospital?: string;
  issue_date: string;
  expiry_date?: string;
  diagnosis?: string;
  notes?: string;
  attachment_path?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Medication {
  id: string;
  user_id: string;
  prescription_id?: string;
  name: string;
  dosage: string;
  frequency: string;
  route: string; // e.g. oral, topical, injection
  start_date: string;
  end_date?: string;
  prescribing_doctor?: string;
  purpose?: string;
  instructions?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type AppointmentStatus = 'upcoming' | 'completed' | 'cancelled' | 'rescheduled';

export interface Appointment {
  id: string;
  user_id: string;
  doctor_name: string;
  specialty?: string;
  clinic_or_hospital?: string;
  appointment_date: string;
  appointment_time: string;
  purpose: string;
  location_address?: string;
  telehealth_url?: string;
  status: AppointmentStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type ReminderType = 'medication' | 'appointment' | 'measurement' | 'follow_up' | 'other';

export interface Reminder {
  id: string;
  user_id: string;
  medication_id?: string;
  title: string;
  reminder_type: ReminderType;
  scheduled_time: string; // HH:mm
  days_of_week: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  is_enabled: boolean;
  last_completed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface EmergencyContact {
  id: string;
  user_id: string;
  name: string;
  relationship: string;
  phone_number: string;
  secondary_phone?: string;
  email?: string;
  is_primary: boolean;
  priority_order: number;
  created_at: string;
  updated_at: string;
}

export interface EmergencyCardConfig {
  id: string;
  user_id: string;
  share_name: boolean;
  share_blood_group: boolean;
  share_allergies: boolean;
  share_conditions: boolean;
  share_medications: boolean;
  share_primary_contact: boolean;
  share_secondary_contact: boolean;
  share_emergency_notes?: boolean;
  is_active?: boolean;
  emergency_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface EmergencyCardToken {
  id: string;
  user_id: string;
  token_hash: string;
  label: string;
  expires_at: string;
  is_revoked: boolean;
  revoked_at?: string;
  revocation_reason?: string;
  created_at: string;
  plain_token?: string; // only presented to creator upon generation
}

export interface EmergencyAccessLog {
  id: string;
  token_id?: string;
  user_id: string;
  accessed_at: string;
  accessor_ip_hash?: string;
  user_agent_summary?: string;
  status: 'granted' | 'expired' | 'revoked' | 'invalid';
}

export type NotificationType = 
  | 'medication_due' 
  | 'appointment_reminder' 
  | 'emergency_access' 
  | 'system' 
  | 'security';

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  action_url?: string;
  created_at: string;
}

export interface UserSettings {
  user_id: string;
  browser_notifications: boolean;
  sound_alerts: boolean;
  emergency_access_alerts: boolean;
  share_location_consent: boolean;
  dark_mode: boolean;
  updated_at: string;
}

// Emergency Viewer response payload
export interface EmergencyCardViewData {
  success: boolean;
  error?: string;
  message?: string;
  is_demo?: boolean;
  last_updated?: string;
  emergency_notes?: string;
  full_name?: string;
  blood_group?: BloodGroup;
  allergies?: Array<{
    allergen: string;
    severity: AllergySeverity;
    reaction?: string;
  }>;
  conditions?: Array<{
    title: string;
    category: HistoryCategory;
    description?: string;
  }>;
  medications?: Array<{
    name: string;
    dosage: string;
    frequency: string;
    instructions?: string;
  }>;
  primary_contact?: {
    name: string;
    relationship: string;
    phone_number: string;
  };
  secondary_contact?: {
    name: string;
    relationship: string;
    phone_number: string;
  };
}

// Nearby Healthcare Place
export interface HealthcareFacility {
  id: string;
  name: string;
  type: 'hospital' | 'clinic' | 'pharmacy';
  address: string;
  phone?: string;
  distance_km?: number;
  latitude: number;
  longitude: number;
  emergency_available: boolean;
  opening_hours?: string;
  is_verified?: boolean;
}
