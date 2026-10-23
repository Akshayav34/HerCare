-- HerCare Database Schema & Security Policies
-- Created for HerCare — A Women Emergency Health Care Platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    date_of_birth DATE,
    blood_group TEXT CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown')),
    phone_number TEXT,
    emergency_phone TEXT,
    address TEXT,
    existing_conditions TEXT,
    allergies_summary TEXT,
    current_medications_summary TEXT,
    profile_photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. MEDICAL HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.medical_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('surgery', 'chronic_condition', 'family_history', 'reproductive_health', 'vaccination', 'other')),
    title TEXT NOT NULL,
    diagnosis_date DATE,
    description TEXT,
    treatment TEXT,
    physician_name TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. ALLERGIES TABLE
CREATE TABLE IF NOT EXISTS public.allergies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    allergen TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('medication', 'food', 'environmental', 'latex', 'insect', 'other')),
    severity TEXT NOT NULL CHECK (severity IN ('mild', 'moderate', 'severe', 'anaphylactic')),
    reaction TEXT,
    diagnosed_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. MEDICAL RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.medical_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    record_type TEXT NOT NULL CHECK (record_type IN ('lab_result', 'imaging_scan', 'prescription', 'doctor_note', 'discharge_summary', 'vaccine_record', 'other')),
    record_date DATE NOT NULL,
    doctor_name TEXT,
    clinic_or_hospital TEXT,
    notes TEXT,
    file_path TEXT,
    file_name TEXT,
    file_type TEXT,
    file_size_bytes BIGINT,
    is_confidential BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. PRESCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    prescribing_doctor TEXT NOT NULL,
    clinic_or_hospital TEXT,
    issue_date DATE NOT NULL,
    expiry_date DATE,
    diagnosis TEXT,
    notes TEXT,
    attachment_path TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. MEDICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    prescription_id UUID REFERENCES public.prescriptions(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    route TEXT DEFAULT 'oral',
    start_date DATE NOT NULL,
    end_date DATE,
    prescribing_doctor TEXT,
    purpose TEXT,
    instructions TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. APPOINTMENTS TABLE
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    doctor_name TEXT NOT NULL,
    specialty TEXT,
    clinic_or_hospital TEXT,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    purpose TEXT NOT NULL,
    location_address TEXT,
    telehealth_url TEXT,
    status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'completed', 'cancelled', 'rescheduled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. REMINDERS TABLE
CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    medication_id UUID REFERENCES public.medications(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    reminder_type TEXT NOT NULL CHECK (reminder_type IN ('medication', 'appointment', 'measurement', 'follow_up', 'other')),
    scheduled_time TIME NOT NULL,
    days_of_week INTEGER[] DEFAULT '{0,1,2,3,4,5,6}',
    is_enabled BOOLEAN DEFAULT true,
    last_completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 9. EMERGENCY CONTACTS TABLE
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    relationship TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    secondary_phone TEXT,
    email TEXT,
    is_primary BOOLEAN DEFAULT false,
    priority_order INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 10. EMERGENCY CARDS TABLE (User configured fields & consent)
CREATE TABLE IF NOT EXISTS public.emergency_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    share_name BOOLEAN DEFAULT true,
    share_blood_group BOOLEAN DEFAULT true,
    share_allergies BOOLEAN DEFAULT true,
    share_conditions BOOLEAN DEFAULT true,
    share_medications BOOLEAN DEFAULT true,
    share_primary_contact BOOLEAN DEFAULT true,
    share_secondary_contact BOOLEAN DEFAULT false,
    emergency_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 11. EMERGENCY CARD TOKENS TABLE (Opaque Bearer Token Hashes)
-- Security: Only SHA-256 hashes of tokens are stored in the database!
CREATE TABLE IF NOT EXISTS public.emergency_card_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    label TEXT DEFAULT 'Primary Emergency QR',
    expires_at TIMESTAMPTZ NOT NULL,
    is_revoked BOOLEAN DEFAULT false,
    revoked_at TIMESTAMPTZ,
    revocation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 12. EMERGENCY ACCESS LOGS TABLE (Data Minimization Audit)
CREATE TABLE IF NOT EXISTS public.emergency_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_id UUID REFERENCES public.emergency_card_tokens(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    accessed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    accessor_ip_hash TEXT,
    user_agent_summary TEXT,
    status TEXT NOT NULL CHECK (status IN ('granted', 'expired', 'revoked', 'invalid'))
);

-- 13. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('medication_due', 'appointment_reminder', 'emergency_access', 'system', 'security')),
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 14. USER SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    browser_notifications BOOLEAN DEFAULT true,
    sound_alerts BOOLEAN DEFAULT true,
    emergency_access_alerts BOOLEAN DEFAULT true,
    share_location_consent BOOLEAN DEFAULT false,
    dark_mode BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_medical_records_user_id ON public.medical_records(user_id);
CREATE INDEX IF NOT EXISTS idx_medical_history_user_id ON public.medical_history(user_id);
CREATE INDEX IF NOT EXISTS idx_allergies_user_id ON public.allergies(user_id);
CREATE INDEX IF NOT EXISTS idx_medications_user_id ON public.medications(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON public.reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id ON public.emergency_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_card_tokens_hash ON public.emergency_card_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_emergency_access_logs_user_id ON public.emergency_access_logs(user_id);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_card_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- POLICIES: AUTHENTICATED USER OWNS THEIR DATA
CREATE POLICY "Users can manage own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can manage own medical history" ON public.medical_history FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage own allergies" ON public.allergies FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage own records" ON public.medical_records FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage own prescriptions" ON public.prescriptions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage own medications" ON public.medications FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage own appointments" ON public.appointments FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage own reminders" ON public.reminders FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage own emergency contacts" ON public.emergency_contacts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage own emergency card" ON public.emergency_cards FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage own emergency tokens" ON public.emergency_card_tokens FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own access logs" ON public.emergency_access_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own notifications" ON public.notifications FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage own settings" ON public.user_settings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- SECURE RPC FUNCTION: VALIDATE BEARER EMERGENCY TOKEN & RETURN ONLY APPROVED FIELDS
-- Accessible to public/anon for emergency responders holding the bearer token
CREATE OR REPLACE FUNCTION public.get_emergency_card_by_token(
    p_token_hash TEXT,
    p_ip_summary TEXT DEFAULT NULL,
    p_agent_summary TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges to safely inspect token and fetch approved fields
AS $$
DECLARE
    v_token_record RECORD;
    v_profile RECORD;
    v_card_settings RECORD;
    v_allergies JSONB;
    v_conditions JSONB;
    v_medications JSONB;
    v_primary_contact JSONB;
    v_secondary_contact JSONB;
    v_result JSONB;
BEGIN
    -- 1. Find token
    SELECT * INTO v_token_record
    FROM public.emergency_card_tokens
    WHERE token_hash = p_token_hash;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'INVALID_TOKEN', 'message', 'Emergency token not found or invalid.');
    END IF;

    -- 2. Check if revoked
    IF v_token_record.is_revoked THEN
        INSERT INTO public.emergency_access_logs (token_id, user_id, accessor_ip_hash, user_agent_summary, status)
        VALUES (v_token_record.id, v_token_record.user_id, p_ip_summary, p_agent_summary, 'revoked');

        RETURN jsonb_build_object('success', false, 'error', 'REVOKED_TOKEN', 'message', 'This emergency health card access has been revoked by the patient.');
    END IF;

    -- 3. Check expiration
    IF v_token_record.expires_at < NOW() THEN
        INSERT INTO public.emergency_access_logs (token_id, user_id, accessor_ip_hash, user_agent_summary, status)
        VALUES (v_token_record.id, v_token_record.user_id, p_ip_summary, p_agent_summary, 'expired');

        RETURN jsonb_build_object('success', false, 'error', 'EXPIRED_TOKEN', 'message', 'This emergency health card QR token has expired.');
    END IF;

    -- 4. Valid access: log event
    INSERT INTO public.emergency_access_logs (token_id, user_id, accessor_ip_hash, user_agent_summary, status)
    VALUES (v_token_record.id, v_token_record.user_id, p_ip_summary, p_agent_summary, 'granted');

    -- Create in-app alert for user
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
        v_token_record.user_id,
        'Emergency Card Accessed',
        'Your Emergency Health Card was just viewed via QR link.',
        'emergency_access'
    );

    -- 5. Fetch user card settings
    SELECT * INTO v_card_settings
    FROM public.emergency_cards
    WHERE user_id = v_token_record.user_id;

    -- Fetch profile
    SELECT * INTO v_profile
    FROM public.profiles
    WHERE id = v_token_record.user_id;

    -- Compile conditionally shared fields
    v_result := jsonb_build_object(
        'success', true,
        'last_updated', COALESCE(v_card_settings.updated_at, NOW()),
        'emergency_notes', COALESCE(v_card_settings.emergency_notes, '')
    );

    IF COALESCE(v_card_settings.share_name, true) THEN
        v_result := v_result || jsonb_build_object('full_name', v_profile.full_name);
    END IF;

    IF COALESCE(v_card_settings.share_blood_group, true) THEN
        v_result := v_result || jsonb_build_object('blood_group', v_profile.blood_group);
    END IF;

    IF COALESCE(v_card_settings.share_allergies, true) THEN
        SELECT jsonb_agg(jsonb_build_object('allergen', allergen, 'severity', severity, 'reaction', reaction))
        INTO v_allergies
        FROM public.allergies
        WHERE user_id = v_token_record.user_id;
        v_result := v_result || jsonb_build_object('allergies', COALESCE(v_allergies, '[]'::jsonb));
    END IF;

    IF COALESCE(v_card_settings.share_conditions, true) THEN
        SELECT jsonb_agg(jsonb_build_object('title', title, 'category', category, 'description', description))
        INTO v_conditions
        FROM public.medical_history
        WHERE user_id = v_token_record.user_id AND is_active = true;
        v_result := v_result || jsonb_build_object('conditions', COALESCE(v_conditions, '[]'::jsonb));
    END IF;

    IF COALESCE(v_card_settings.share_medications, true) THEN
        SELECT jsonb_agg(jsonb_build_object('name', name, 'dosage', dosage, 'frequency', frequency, 'instructions', instructions))
        INTO v_medications
        FROM public.medications
        WHERE user_id = v_token_record.user_id AND is_active = true;
        v_result := v_result || jsonb_build_object('medications', COALESCE(v_medications, '[]'::jsonb));
    END IF;

    IF COALESCE(v_card_settings.share_primary_contact, true) THEN
        SELECT jsonb_build_object('name', name, 'relationship', relationship, 'phone_number', phone_number)
        INTO v_primary_contact
        FROM public.emergency_contacts
        WHERE user_id = v_token_record.user_id
        ORDER BY is_primary DESC, priority_order ASC
        LIMIT 1;
        v_result := v_result || jsonb_build_object('primary_contact', v_primary_contact);
    END IF;

    RETURN v_result;
END;
$$;

-- Revoke emergency token RPC
CREATE OR REPLACE FUNCTION public.revoke_emergency_token(p_token_id UUID, p_reason TEXT DEFAULT 'Revoked by user')
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.emergency_card_tokens
    SET is_revoked = true,
        revoked_at = NOW(),
        revocation_reason = p_reason
    WHERE id = p_token_id AND user_id = auth.uid();
    
    RETURN FOUND;
END;
$$;

-- Grant execution permissions on RPC functions
GRANT EXECUTE ON FUNCTION public.get_emergency_card_by_token(TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_emergency_token(UUID, TEXT) TO authenticated;

