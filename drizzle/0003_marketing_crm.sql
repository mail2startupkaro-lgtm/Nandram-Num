-- ==============================================================================
-- SUPABASE MARKETING & CLIENT ACQUISITION CRM SCHEMA
-- ==============================================================================
-- Designed for:
--   1. Lead Capture (Free calculators, landing pages, lead magnets, PDFs)
--   2. Numerology-Specific Audience Segmentation (Moolank, Bhagyank, Core Concerns)
--   3. Multi-Channel Campaigns (WhatsApp, Email, SMS)
--   4. Legal DPDP Act 2023 & GDPR Compliance (Explicit Consent & Opt-out Tracking)
--   5. Bulletproof Row Level Security (RLS: Public Insert-Only, Zero Data Scraping)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
DO $$ BEGIN
  CREATE TYPE marketing_channel AS ENUM ('email', 'whatsapp', 'sms', 'push');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE consent_status AS ENUM ('opted_in', 'opted_out', 'bounced', 'unsubscribed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE lead_lifecycle_stage AS ENUM ('subscriber', 'lead', 'mql', 'sql', 'customer', 'churned');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE campaign_status AS ENUM ('draft', 'scheduled', 'running', 'completed', 'paused');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ==============================================================================
-- 3. MARKETING LEADS (Core Prospect & Customer Marketing Profile)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS marketing_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL, -- linked if lead converts to a registered account
  
  -- Personal Identifiers
  full_name TEXT NOT NULL,
  email VARCHAR(320),
  phone VARCHAR(20),                                    -- E.164 format (+91XXXXXXXXXX)
  dob DATE,                                             -- Crucial for Birthday & Personal Year marketing
  gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
  
  -- Demographics & Location
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100) DEFAULT 'India',
  language VARCHAR(10) DEFAULT 'en',                    -- en, hi, hinglish
  
  -- Numerology Profile (For Hyper-Targeted Segmentation)
  moolank SMALLINT CHECK (moolank BETWEEN 1 AND 9),
  bhagyank SMALLINT CHECK (bhagyank BETWEEN 1 AND 9),
  kua_number SMALLINT CHECK (kua_number BETWEEN 1 AND 9),
  primary_concern VARCHAR(50),                          -- career, business, money, marriage, love, health, legal
  
  -- Acquisition & Attribution Tracking
  lead_source VARCHAR(80) NOT NULL DEFAULT 'website',   -- calculator_dob, angel_number, free_pdf, meta_ad, google_ad
  lead_magnet VARCHAR(120),                             -- 2027_forecast_guide, lucky_mobile_guide
  lifecycle_stage lead_lifecycle_stage NOT NULL DEFAULT 'lead',
  
  -- UTM Marketing Attribution
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(150),
  utm_term VARCHAR(100),
  utm_content VARCHAR(100),
  referrer_url TEXT,
  
  -- Technical Audit Trail
  ip_address VARCHAR(64),
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique indexes on normalized email and phone (when provided)
CREATE UNIQUE INDEX IF NOT EXISTS marketing_leads_email_idx ON marketing_leads (LOWER(email)) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS marketing_leads_phone_idx ON marketing_leads (phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS marketing_leads_moolank_idx ON marketing_leads (moolank);
CREATE INDEX IF NOT EXISTS marketing_leads_bhagyank_idx ON marketing_leads (bhagyank);
CREATE INDEX IF NOT EXISTS marketing_leads_concern_idx ON marketing_leads (primary_concern);
CREATE INDEX IF NOT EXISTS marketing_leads_dob_idx ON marketing_leads (dob);
CREATE INDEX IF NOT EXISTS marketing_leads_stage_idx ON marketing_leads (lifecycle_stage);
CREATE INDEX IF NOT EXISTS marketing_leads_created_idx ON marketing_leads (created_at DESC);

-- ==============================================================================
-- 4. MARKETING CONSENTS (DPDP Act 2023 & GDPR Compliance Audit Trail)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS marketing_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES marketing_leads(id) ON DELETE CASCADE,
  
  channel marketing_channel NOT NULL,                   -- email, whatsapp, sms
  status consent_status NOT NULL DEFAULT 'opted_in',
  purpose VARCHAR(100) NOT NULL,                        -- festival_offers, annual_forecast, personal_consultation
  consent_text TEXT NOT NULL,                           -- exact text shown to user when clicking submit
  
  opted_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  opted_out_at TIMESTAMPTZ,
  opt_out_reason TEXT,
  
  ip_address VARCHAR(64),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS marketing_consents_lead_channel_idx ON marketing_consents (lead_id, channel, status);

-- ==============================================================================
-- 5. MARKETING TAGS & AUDIENCE SEGMENTS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS marketing_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'general',       -- numerology, intent, campaign, interest
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lead_tags (
  lead_id UUID NOT NULL REFERENCES marketing_leads(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES marketing_tags(id) ON DELETE CASCADE,
  tagged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (lead_id, tag_id)
);

CREATE INDEX IF NOT EXISTS lead_tags_tag_idx ON lead_tags (tag_id);

-- ==============================================================================
-- 6. CAMPAIGN DISPATCH & PERFORMANCE TRACKING
-- ==============================================================================
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(180) NOT NULL,
  channel marketing_channel NOT NULL,                   -- whatsapp, email, sms
  status campaign_status NOT NULL DEFAULT 'draft',
  
  target_criteria JSONB NOT NULL DEFAULT '{}'::jsonb,   -- e.g. {"moolank": [1,9], "concerns": ["career"]}
  template_name VARCHAR(120),                           -- WhatsApp Template Name or Email Template ID
  subject_or_title TEXT,
  content_preview TEXT,
  
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  
  total_targeted INTEGER NOT NULL DEFAULT 0,
  total_sent INTEGER NOT NULL DEFAULT 0,
  total_delivered INTEGER NOT NULL DEFAULT 0,
  total_opened INTEGER NOT NULL DEFAULT 0,
  total_clicked INTEGER NOT NULL DEFAULT 0,
  total_converted INTEGER NOT NULL DEFAULT 0,
  total_opt_outs INTEGER NOT NULL DEFAULT 0,
  
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 7. CLIENT BEHAVIOR & INTERACTION EVENT LOG
-- ==============================================================================
CREATE TABLE IF NOT EXISTS marketing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES marketing_leads(id) ON DELETE CASCADE,
  
  event_name VARCHAR(80) NOT NULL,                      -- free_reading_generated, pricing_viewed, checkout_abandoned, report_shared
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,        -- { "moolank": 7, "score": 82 }
  
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS marketing_events_lead_name_idx ON marketing_events (lead_id, event_name, occurred_at DESC);

-- ==============================================================================
-- 8. CONVENIENCE VIEWS FOR 1-CLICK CAMPAIGN EXPORTS
-- ==============================================================================

-- A. Active Opted-In WhatsApp Audience
CREATE OR REPLACE VIEW v_active_whatsapp_audience AS
SELECT 
  l.id,
  l.full_name,
  l.phone,
  l.dob,
  l.moolank,
  l.bhagyank,
  l.primary_concern,
  l.city,
  l.language,
  l.created_at
FROM marketing_leads l
WHERE l.phone IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM marketing_consents c
    WHERE c.lead_id = l.id
      AND c.channel = 'whatsapp'
      AND c.status = 'opted_in'
  );

-- B. Active Opted-In Email Audience
CREATE OR REPLACE VIEW v_active_email_audience AS
SELECT 
  l.id,
  l.full_name,
  l.email,
  l.dob,
  l.moolank,
  l.bhagyank,
  l.primary_concern,
  l.city,
  l.language,
  l.created_at
FROM marketing_leads l
WHERE l.email IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM marketing_consents c
    WHERE c.lead_id = l.id
      AND c.channel = 'email'
      AND c.status = 'opted_in'
  );

-- C. Upcoming Birthday Leads (Next 14 Days) - Perfect for Birthday Forecast Campaigns!
CREATE OR REPLACE VIEW v_upcoming_birthday_leads AS
SELECT 
  l.id,
  l.full_name,
  l.phone,
  l.email,
  l.dob,
  l.moolank,
  l.bhagyank,
  (to_char(l.dob, 'MM-DD') = to_char(CURRENT_DATE, 'MM-DD')) AS is_birthday_today
FROM marketing_leads l
WHERE l.dob IS NOT NULL
  AND (
    to_char(l.dob, 'MM-DD') >= to_char(CURRENT_DATE, 'MM-DD')
    AND to_char(l.dob, 'MM-DD') <= to_char(CURRENT_DATE + INTERVAL '14 days', 'MM-DD')
  );

-- ==============================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES - BULLETPROOF SECURITY
-- ==============================================================================
ALTER TABLE marketing_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_events ENABLE ROW LEVEL SECURITY;

-- Anonymous / Public users (Visitors submitting lead forms):
-- CAN ONLY INSERT leads, consents and events.
-- STRICTLY CANNOT READ, UPDATE, OR DELETE any records (Stops competitor scraping / client data leakage!)
CREATE POLICY "Public anonymous can insert leads"
  ON marketing_leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public anonymous can insert consents"
  ON marketing_consents FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public anonymous can log marketing events"
  ON marketing_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Authenticated Super Admins & Backend Service Role:
-- Full access to manage, query, segment, and export marketing data.
CREATE POLICY "Admins have full access to marketing leads"
  ON marketing_leads FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::text
        AND users.role = 'super_admin'
    )
  );

CREATE POLICY "Admins have full access to marketing consents"
  ON marketing_consents FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::text
        AND users.role = 'super_admin'
    )
  );

CREATE POLICY "Admins have full access to marketing campaigns"
  ON marketing_campaigns FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::text
        AND users.role = 'super_admin'
    )
  );

-- ==============================================================================
-- 10. AUTOMATIC UPDATED_AT TRIGGER
-- ==============================================================================
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_marketing_leads ON marketing_leads;
CREATE TRIGGER set_timestamp_marketing_leads
BEFORE UPDATE ON marketing_leads
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_marketing_campaigns ON marketing_campaigns;
CREATE TRIGGER set_timestamp_marketing_campaigns
BEFORE UPDATE ON marketing_campaigns
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();
