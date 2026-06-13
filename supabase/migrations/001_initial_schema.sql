-- ============================================
-- AgeGate — Age-Verification Compliance SDK
-- Database Schema + RLS Policies
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. DEVELOPERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS developers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    app_name TEXT,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    plan_tier TEXT NOT NULL DEFAULT 'free' CHECK (plan_tier IN ('free', 'indie', 'pro', 'enterprise')),
    mau_limit INTEGER NOT NULL DEFAULT 1000,
    mau_current INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. COMPLIANCE CONFIGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS compliance_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    developer_id UUID NOT NULL REFERENCES developers(id) ON DELETE CASCADE,
    states_enabled TEXT[] NOT NULL DEFAULT '{}',
    minimum_age INTEGER NOT NULL DEFAULT 13,
    parental_consent_required BOOLEAN NOT NULL DEFAULT FALSE,
    data_retention_days INTEGER NOT NULL DEFAULT 365,
    consent_methods TEXT[] NOT NULL DEFAULT '{"email"}',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(developer_id)
);

-- ============================================
-- 3. VERIFICATION REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS verification_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    developer_id UUID NOT NULL REFERENCES developers(id) ON DELETE CASCADE,
    user_id_hash TEXT NOT NULL,
    declared_age INTEGER,
    detected_state TEXT,
    device_platform TEXT,
    result TEXT NOT NULL CHECK (result IN ('allowed', 'blocked', 'pending_consent')),
    requires_consent BOOLEAN NOT NULL DEFAULT FALSE,
    consent_method TEXT,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- ============================================
-- 4. CONSENT RECORDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS consent_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    developer_id UUID NOT NULL REFERENCES developers(id) ON DELETE CASCADE,
    user_id_hash TEXT NOT NULL,
    consent_method TEXT NOT NULL,
    consent_token TEXT NOT NULL UNIQUE,
    parent_email TEXT,
    parent_id_url TEXT,
    consent_status TEXT NOT NULL DEFAULT 'pending' CHECK (consent_status IN ('pending', 'verified', 'expired', 'revoked')),
    expires_at TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 5. API KEYS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    developer_id UUID NOT NULL REFERENCES developers(id) ON DELETE CASCADE,
    key_hash TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL DEFAULT 'Default Key',
    last_used_at TIMESTAMPTZ,
    requests_today INTEGER NOT NULL DEFAULT 0,
    requests_this_month INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_verification_requests_developer_id ON verification_requests(developer_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_created_at ON verification_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_verification_requests_user_id_hash ON verification_requests(user_id_hash);
CREATE INDEX IF NOT EXISTS idx_consent_records_developer_id ON consent_records(developer_id);
CREATE INDEX IF NOT EXISTS idx_consent_records_expires_at ON consent_records(expires_at);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_developer_id ON api_keys(developer_id);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Developers can only see their own row
CREATE POLICY "developers_self_access" ON developers
    FOR ALL USING (auth.uid() = id);

-- Compliance configs: developer owns their config
CREATE POLICY "compliance_configs_self_access" ON compliance_configs
    FOR ALL USING (developer_id = auth.uid());

-- Verification requests: developer owns their logs
CREATE POLICY "verification_requests_self_access" ON verification_requests
    FOR ALL USING (developer_id = auth.uid());

-- Consent records: developer owns their consent records
CREATE POLICY "consent_records_self_access" ON consent_records
    FOR ALL USING (developer_id = auth.uid());

-- API keys: developer owns their keys
CREATE POLICY "api_keys_self_access" ON api_keys
    FOR ALL USING (developer_id = auth.uid());

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER developers_updated_at BEFORE UPDATE ON developers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER compliance_configs_updated_at BEFORE UPDATE ON compliance_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Reset daily API counters (called by cron/edge function)
CREATE OR REPLACE FUNCTION reset_daily_api_counters()
RETURNS void AS $$
BEGIN
    UPDATE api_keys SET requests_today = 0 WHERE revoked_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Reset monthly API counters
CREATE OR REPLACE FUNCTION reset_monthly_api_counters()
RETURNS void AS $$
BEGIN
    UPDATE api_keys SET requests_this_month = 0 WHERE revoked_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Soft delete expired verification data (Texas compliance)
CREATE OR REPLACE FUNCTION soft_delete_expired_verifications()
RETURNS void AS $$
BEGIN
    UPDATE verification_requests
    SET deleted_at = NOW()
    WHERE deleted_at IS NULL
      AND id IN (
          SELECT vr.id FROM verification_requests vr
          JOIN consent_records cr ON vr.user_id_hash = cr.user_id_hash AND vr.developer_id = cr.developer_id
          WHERE cr.expires_at < NOW() AND cr.consent_status = 'expired'
      );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- DEFAULT COMPLIANCE CONFIG ON SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO developers (id, email, app_name, plan_tier, mau_limit, mau_current)
    VALUES (NEW.id, NEW.email, NULL, 'free', 1000, 0);

    INSERT INTO compliance_configs (developer_id, states_enabled, minimum_age, parental_consent_required, data_retention_days, consent_methods)
    VALUES (NEW.id, ARRAY['TX'], 13, TRUE, 365, ARRAY['email']);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users (run this after enabling the trigger in Supabase dashboard)
-- CREATE TRIGGER on_auth_user_created
--     AFTER INSERT ON auth.users
--     FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
