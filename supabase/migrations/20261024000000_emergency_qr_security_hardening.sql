-- ============================================================================
-- HERCARE SECURITY HARDENING MIGRATION
-- Migration: 20261024000000_emergency_qr_security_hardening.sql
-- Purpose:
--   1. Fail-closed emergency sharing (NULL or missing consent never exposes data)
--   2. Enforces explicit card activation and field-level consent
--   3. Restricts emergency notes exposure strictly to explicit user consent
--   4. Fixed search_path (public, pg_temp) and schema qualification on SECURITY DEFINER functions
--   5. Consistent cryptographic SHA-256 token hashing inside trusted backend functions
--   6. Secondary emergency contact support only when explicitly authorized
--   7. Rate limiting on notifications and access logs to prevent abuse/flooding
--   8. Untrusted caller metadata sanitization (never treated as verified evidence)
--   9. Strict RLS and anonymous permission audit
-- ============================================================================

-- Ensure pgcrypto extension is available for secure random bytes
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. IDEMPOTENT TABLE SCHEMA ENHANCEMENTS
-- Add activation and explicit notes consent flags to public.emergency_cards if not present
ALTER TABLE public.emergency_cards
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS share_emergency_notes BOOLEAN NOT NULL DEFAULT false;

-- Normalize existing NULL values to fail closed (explicit FALSE)
UPDATE public.emergency_cards
SET share_name = COALESCE(share_name, false),
    share_blood_group = COALESCE(share_blood_group, false),
    share_allergies = COALESCE(share_allergies, false),
    share_conditions = COALESCE(share_conditions, false),
    share_medications = COALESCE(share_medications, false),
    share_primary_contact = COALESCE(share_primary_contact, false),
    share_secondary_contact = COALESCE(share_secondary_contact, false),
    share_emergency_notes = COALESCE(share_emergency_notes, false),
    is_active = COALESCE(is_active, true)
WHERE share_name IS NULL
   OR share_blood_group IS NULL
   OR share_allergies IS NULL
   OR share_conditions IS NULL
   OR share_medications IS NULL
   OR share_primary_contact IS NULL
   OR share_secondary_contact IS NULL
   OR share_emergency_notes IS NULL
   OR is_active IS NULL;

-- Performance index for high-speed bearer token lookup
CREATE INDEX IF NOT EXISTS idx_emergency_card_tokens_hash_status
ON public.emergency_card_tokens (token_hash, is_revoked, expires_at);

-- Performance index for access log rate limiting
CREATE INDEX IF NOT EXISTS idx_emergency_access_logs_rate_check
ON public.emergency_access_logs (token_id, status, accessed_at DESC);

-- Performance index for notification rate limiting
CREATE INDEX IF NOT EXISTS idx_notifications_rate_check
ON public.notifications (user_id, type, created_at DESC);


-- 2. HARDENED GET_EMERGENCY_CARD_BY_TOKEN FUNCTION
-- Validates bearer token (or pre-computed SHA-256 hash), enforces fail-closed consent,
-- logs events with rate-limiting, and returns only patient-authorized fields.
CREATE OR REPLACE FUNCTION public.get_emergency_card_by_token(
    p_token_hash TEXT,
    p_ip_summary TEXT DEFAULT NULL,
    p_agent_summary TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_clean_input TEXT;
    v_computed_hash TEXT;
    v_token_record RECORD;
    v_card_settings RECORD;
    v_profile RECORD;
    v_allergies JSONB;
    v_conditions JSONB;
    v_medications JSONB;
    v_primary_contact JSONB;
    v_secondary_contact JSONB;
    v_result JSONB;
    v_headers JSONB;
    v_real_ip TEXT;
    v_real_agent TEXT;
    v_safe_ip TEXT;
    v_safe_agent TEXT;
    v_has_consent BOOLEAN;
BEGIN
    -- 0. Input Sanitation & Validation
    IF p_token_hash IS NULL OR length(trim(p_token_hash)) = 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'INVALID_TOKEN',
            'message', 'Emergency token is required.'
        );
    END IF;

    v_clean_input := trim(p_token_hash);

    -- Compute SHA-256 hash internally in trusted backend (consistent hashing)
    v_computed_hash := encode(sha256(convert_to(v_clean_input, 'UTF8')), 'hex');

    -- Sanitized caller metadata handling:
    -- Extract real reverse-proxy HTTP headers if executed via Supabase PostgREST
    BEGIN
        v_headers := NULLIF(current_setting('request.headers', true), '')::JSONB;
    EXCEPTION WHEN OTHERS THEN
        v_headers := NULL;
    END;

    v_real_ip := COALESCE(
        v_headers ->> 'cf-connecting-ip',
        v_headers ->> 'x-real-ip',
        v_headers ->> 'x-forwarded-for'
    );
    v_real_agent := v_headers ->> 'user-agent';

    -- Anonymize and tag IP (Never treat client-supplied text as verified security evidence)
    IF v_real_ip IS NOT NULL AND length(trim(v_real_ip)) > 0 THEN
        v_safe_ip := 'server_ip_hash:' || substr(encode(sha256(convert_to(trim(v_real_ip), 'UTF8')), 'hex'), 1, 16);
    ELSIF p_ip_summary IS NOT NULL AND length(trim(p_ip_summary)) > 0 THEN
        v_safe_ip := 'unverified_client:' || substr(encode(sha256(convert_to(trim(p_ip_summary), 'UTF8')), 'hex'), 1, 16);
    ELSE
        v_safe_ip := 'unverified_client:anonymous';
    END IF;

    -- Sanitize and truncate user agent to 80 chars
    v_safe_agent := substr(regexp_replace(COALESCE(v_real_agent, p_agent_summary, 'Unknown Client'), '[^\x20-\x7E]', '', 'g'), 1, 80);

    -- 1. Fictional Sample Card Bypass (Demonstration Isolation)
    -- Fixed demo token: "demo-emergency-token-hercare-2026"
    -- Fixed demo SHA-256 hash: "866a0857593a1bfe19696fa1076b85f960a3de0c4330e6149ed9bd5820e2eb54"
    IF v_clean_input = '866a0857593a1bfe19696fa1076b85f960a3de0c4330e6149ed9bd5820e2eb54'
       OR v_computed_hash = '866a0857593a1bfe19696fa1076b85f960a3de0c4330e6149ed9bd5820e2eb54'
       OR v_clean_input = 'demo-emergency-token-hercare-2026'
    THEN
        RETURN jsonb_build_object(
            'success', true,
            'is_demo', true,
            'last_updated', '2026-10-23T00:00:00.000Z',
            'full_name', 'Maya Lin (Fictional Demonstration Card)',
            'blood_group', 'O+',
            'emergency_notes', 'CRITICAL: Severe Penicillin allergy (anaphylaxis). Patient carries rescue inhaler for asthma.',
            'allergies', jsonb_build_array(
                jsonb_build_object('allergen', 'Penicillin', 'severity', 'anaphylactic', 'reaction', 'Severe urticaria, wheezing'),
                jsonb_build_object('allergen', 'Peanuts & Tree Nuts', 'severity', 'moderate', 'reaction', 'Facial itching')
            ),
            'conditions', jsonb_build_array(
                jsonb_build_object('title', 'Polycystic Ovary Syndrome (PCOS)', 'category', 'reproductive_health', 'description', 'Monitored routine care')
            ),
            'medications', jsonb_build_array(
                jsonb_build_object('name', 'Albuterol Inhaler', 'dosage', '90mcg', 'frequency', '1-2 puffs PRN')
            ),
            'primary_contact', jsonb_build_object('name', 'David Lin', 'relationship', 'Spouse', 'phone_number', '+1 (555) 987-6543'),
            'secondary_contact', jsonb_build_object('name', 'Dr. Sarah Jenkins', 'relationship', 'Treating Physician', 'phone_number', '+1 (555) 654-3210')
        );
    END IF;

    -- 2. Token Lookup (Supports either pre-hashed token or raw token hashed in backend)
    SELECT * INTO v_token_record
    FROM public.emergency_card_tokens
    WHERE token_hash = v_clean_input
       OR token_hash = v_computed_hash;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'INVALID_TOKEN',
            'message', 'Emergency token not found or invalid.'
        );
    END IF;

    -- 3. Check Revocation (Strictly denies access without leaking patient data)
    IF v_token_record.is_revoked IS TRUE THEN
        -- Rate-limited access logging (max 1 revoked log entry per 1 minute per token)
        IF NOT EXISTS (
            SELECT 1 FROM public.emergency_access_logs
            WHERE token_id = v_token_record.id
              AND status = 'revoked'
              AND accessed_at > (NOW() - INTERVAL '1 minute')
        ) THEN
            INSERT INTO public.emergency_access_logs (token_id, user_id, accessor_ip_hash, user_agent_summary, status)
            VALUES (v_token_record.id, v_token_record.user_id, v_safe_ip, v_safe_agent, 'revoked');
        END IF;

        RETURN jsonb_build_object(
            'success', false,
            'error', 'REVOKED_TOKEN',
            'message', 'This emergency health card access has been revoked by the patient.'
        );
    END IF;

    -- 4. Check Expiration (Strictly denies access without leaking patient data)
    IF v_token_record.expires_at < NOW() THEN
        -- Rate-limited access logging (max 1 expired log entry per 1 minute per token)
        IF NOT EXISTS (
            SELECT 1 FROM public.emergency_access_logs
            WHERE token_id = v_token_record.id
              AND status = 'expired'
              AND accessed_at > (NOW() - INTERVAL '1 minute')
        ) THEN
            INSERT INTO public.emergency_access_logs (token_id, user_id, accessor_ip_hash, user_agent_summary, status)
            VALUES (v_token_record.id, v_token_record.user_id, v_safe_ip, v_safe_agent, 'expired');
        END IF;

        RETURN jsonb_build_object(
            'success', false,
            'error', 'EXPIRED_TOKEN',
            'message', 'This emergency health card QR token has expired.'
        );
    END IF;

    -- 5. Card Activation & Consent Settings Check (Fail-Closed)
    SELECT * INTO v_card_settings
    FROM public.emergency_cards
    WHERE user_id = v_token_record.user_id;

    -- Requirement 2: Must have an existing card record with explicit is_active = true
    IF NOT FOUND OR v_card_settings.is_active IS NOT TRUE THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'CARD_INACTIVE',
            'message', 'This emergency health card is currently inactive or unconfigured.'
        );
    END IF;

    -- Check if at least one field has explicit consent (Fail-closed)
    v_has_consent := (
        v_card_settings.share_name IS TRUE OR
        v_card_settings.share_blood_group IS TRUE OR
        v_card_settings.share_allergies IS TRUE OR
        v_card_settings.share_conditions IS TRUE OR
        v_card_settings.share_medications IS TRUE OR
        v_card_settings.share_primary_contact IS TRUE OR
        v_card_settings.share_secondary_contact IS TRUE OR
        (v_card_settings.share_emergency_notes IS TRUE AND v_card_settings.emergency_notes IS NOT NULL)
    );

    IF NOT v_has_consent THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'NO_CONSENTED_FIELDS',
            'message', 'No emergency medical fields have been authorized for sharing by the patient.'
        );
    END IF;

    -- 6. Rate-Limited Granted Access Logging (Abuse Prevention)
    -- Log at most once per token per 10 seconds to prevent denial-of-service log flooding
    IF NOT EXISTS (
        SELECT 1 FROM public.emergency_access_logs
        WHERE token_id = v_token_record.id
          AND status = 'granted'
          AND accessed_at > (NOW() - INTERVAL '10 seconds')
    ) THEN
        INSERT INTO public.emergency_access_logs (token_id, user_id, accessor_ip_hash, user_agent_summary, status)
        VALUES (v_token_record.id, v_token_record.user_id, v_safe_ip, v_safe_agent, 'granted');
    END IF;

    -- Rate-limited in-app notification: Maximum 1 alert per user per 15 minutes
    IF NOT EXISTS (
        SELECT 1 FROM public.notifications
        WHERE user_id = v_token_record.user_id
          AND type = 'emergency_access'
          AND created_at > (NOW() - INTERVAL '15 minutes')
    ) THEN
        INSERT INTO public.notifications (user_id, title, message, type)
        VALUES (
            v_token_record.user_id,
            'Emergency Card Accessed',
            'Your Emergency Health Card was just viewed via emergency QR link.',
            'emergency_access'
        );
    END IF;

    -- 7. Compile Patient-Approved Fields (Fail-Closed)
    SELECT * INTO v_profile
    FROM public.profiles
    WHERE id = v_token_record.user_id;

    v_result := jsonb_build_object(
        'success', true,
        'is_demo', false,
        'last_updated', v_card_settings.updated_at
    );

    -- Full Name (Fail closed: strictly requires share_name IS TRUE)
    IF v_card_settings.share_name IS TRUE AND v_profile.full_name IS NOT NULL THEN
        v_result := v_result || jsonb_build_object('full_name', v_profile.full_name);
    END IF;

    -- Blood Group (Fail closed: strictly requires share_blood_group IS TRUE)
    IF v_card_settings.share_blood_group IS TRUE AND v_profile.blood_group IS NOT NULL THEN
        v_result := v_result || jsonb_build_object('blood_group', v_profile.blood_group);
    END IF;

    -- Emergency Notes (Requirement 3: strictly requires share_emergency_notes IS TRUE)
    IF v_card_settings.share_emergency_notes IS TRUE
       AND v_card_settings.emergency_notes IS NOT NULL
       AND length(trim(v_card_settings.emergency_notes)) > 0
    THEN
        v_result := v_result || jsonb_build_object('emergency_notes', trim(v_card_settings.emergency_notes));
    END IF;

    -- Known Severe Allergies (Fail closed: strictly requires share_allergies IS TRUE)
    IF v_card_settings.share_allergies IS TRUE THEN
        SELECT jsonb_agg(jsonb_build_object(
            'allergen', allergen,
            'severity', severity,
            'reaction', reaction
        ))
        INTO v_allergies
        FROM public.allergies
        WHERE user_id = v_token_record.user_id;

        v_result := v_result || jsonb_build_object('allergies', COALESCE(v_allergies, '[]'::jsonb));
    END IF;

    -- Active Medical Conditions (Fail closed: strictly requires share_conditions IS TRUE)
    IF v_card_settings.share_conditions IS TRUE THEN
        SELECT jsonb_agg(jsonb_build_object(
            'title', title,
            'category', category,
            'description', description
        ))
        INTO v_conditions
        FROM public.medical_history
        WHERE user_id = v_token_record.user_id AND is_active = true;

        v_result := v_result || jsonb_build_object('conditions', COALESCE(v_conditions, '[]'::jsonb));
    END IF;

    -- Active Medications (Fail closed: strictly requires share_medications IS TRUE)
    IF v_card_settings.share_medications IS TRUE THEN
        SELECT jsonb_agg(jsonb_build_object(
            'name', name,
            'dosage', dosage,
            'frequency', frequency,
            'instructions', instructions
        ))
        INTO v_medications
        FROM public.medications
        WHERE user_id = v_token_record.user_id AND is_active = true;

        v_result := v_result || jsonb_build_object('medications', COALESCE(v_medications, '[]'::jsonb));
    END IF;

    -- Primary Emergency Contact (Fail closed: strictly requires share_primary_contact IS TRUE)
    IF v_card_settings.share_primary_contact IS TRUE THEN
        SELECT jsonb_build_object(
            'name', name,
            'relationship', relationship,
            'phone_number', phone_number
        )
        INTO v_primary_contact
        FROM public.emergency_contacts
        WHERE user_id = v_token_record.user_id
        ORDER BY is_primary DESC, priority_order ASC
        LIMIT 1;

        IF v_primary_contact IS NOT NULL THEN
            v_result := v_result || jsonb_build_object('primary_contact', v_primary_contact);
        END IF;
    END IF;

    -- Secondary Emergency Contact (Requirement 11: strictly requires share_secondary_contact IS TRUE)
    IF v_card_settings.share_secondary_contact IS TRUE THEN
        SELECT jsonb_build_object(
            'name', name,
            'relationship', relationship,
            'phone_number', phone_number
        )
        INTO v_secondary_contact
        FROM public.emergency_contacts
        WHERE user_id = v_token_record.user_id
          AND is_primary = false
        ORDER BY priority_order ASC, created_at ASC
        LIMIT 1;

        IF v_secondary_contact IS NOT NULL THEN
            v_result := v_result || jsonb_build_object('secondary_contact', v_secondary_contact);
        END IF;
    END IF;

    RETURN v_result;
END;
$$;


-- 3. HARDENED REVOKE_EMERGENCY_TOKEN FUNCTION
-- Fixed search_path, schema qualification, and explicit authorization check
CREATE OR REPLACE FUNCTION public.revoke_emergency_token(
    p_token_id UUID,
    p_reason TEXT DEFAULT 'Revoked by patient'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN false;
    END IF;

    UPDATE public.emergency_card_tokens
    SET is_revoked = true,
        revoked_at = NOW(),
        revocation_reason = LEFT(COALESCE(p_reason, 'Revoked by patient'), 255)
    WHERE id = p_token_id AND user_id = auth.uid();

    RETURN FOUND;
END;
$$;


-- 4. TRUSTED BACKEND TOKEN CREATION FUNCTION (Optional for client use)
-- Generates 32 bytes of cryptographic randomness via pgcrypto, computes SHA-256 hash internally,
-- stores only the hash in the database, and returns the raw bearer token ONCE to the owner.
CREATE OR REPLACE FUNCTION public.create_emergency_token(
    p_duration_hours INT DEFAULT 720,
    p_label TEXT DEFAULT 'Emergency Health Card QR'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_raw_token TEXT;
    v_token_hash TEXT;
    v_expires_at TIMESTAMPTZ;
    v_token_id UUID;
    v_hours INT;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required to create emergency token';
    END IF;

    -- Validate lifespan (between 1 hour and 8760 hours / 1 year)
    v_hours := LEAST(GREATEST(COALESCE(p_duration_hours, 720), 1), 8760);

    -- 32 bytes of cryptographically secure random bytes = 64 hex characters (256-bit entropy)
    v_raw_token := encode(gen_random_bytes(32), 'hex');
    v_token_hash := encode(sha256(convert_to(v_raw_token, 'UTF8')), 'hex');
    v_expires_at := NOW() + (v_hours * INTERVAL '1 hour');

    INSERT INTO public.emergency_card_tokens (
        user_id,
        token_hash,
        label,
        expires_at,
        is_revoked
    )
    VALUES (
        auth.uid(),
        v_token_hash,
        LEFT(COALESCE(p_label, 'Emergency Health Card QR'), 100),
        v_expires_at,
        false
    )
    RETURNING id INTO v_token_id;

    -- Return token metadata with raw bearer token ONCE
    -- The raw token is NEVER persisted in PostgreSQL tables!
    RETURN jsonb_build_object(
        'id', v_token_id,
        'user_id', auth.uid(),
        'plain_token', v_raw_token,
        'token_hash', v_token_hash,
        'expires_at', v_expires_at,
        'label', p_label,
        'is_revoked', false
    );
END;
$$;


-- 5. PERMISSION AUDIT & ACCESS CONTROL
-- Revoke all direct table access from anonymous users
REVOKE ALL ON TABLE public.profiles FROM anon;
REVOKE ALL ON TABLE public.medical_history FROM anon;
REVOKE ALL ON TABLE public.allergies FROM anon;
REVOKE ALL ON TABLE public.medical_records FROM anon;
REVOKE ALL ON TABLE public.prescriptions FROM anon;
REVOKE ALL ON TABLE public.medications FROM anon;
REVOKE ALL ON TABLE public.appointments FROM anon;
REVOKE ALL ON TABLE public.reminders FROM anon;
REVOKE ALL ON TABLE public.emergency_contacts FROM anon;
REVOKE ALL ON TABLE public.emergency_cards FROM anon;
REVOKE ALL ON TABLE public.emergency_card_tokens FROM anon;
REVOKE ALL ON TABLE public.emergency_access_logs FROM anon;
REVOKE ALL ON TABLE public.notifications FROM anon;
REVOKE ALL ON TABLE public.user_settings FROM anon;

-- Ensure execution permissions are restricted strictly as intended
REVOKE ALL ON FUNCTION public.get_emergency_card_by_token(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_emergency_card_by_token(TEXT, TEXT, TEXT) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.revoke_emergency_token(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.revoke_emergency_token(UUID, TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.create_emergency_token(INT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_emergency_token(INT, TEXT) TO authenticated;
