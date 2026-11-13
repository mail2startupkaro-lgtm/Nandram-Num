-- Services funnel leads (free mini-reading / sample report unlock).
-- Same tables as the hand-run Supabase script 0003_marketing_crm.sql, created only if they do not exist yet,
-- so this is safe whether or not that script was already run on the database.
DO $$ BEGIN
  CREATE TYPE marketing_channel AS ENUM ('email', 'whatsapp', 'sms', 'push');
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE consent_status AS ENUM ('opted_in', 'opted_out', 'bounced', 'unsubscribed');
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE lead_lifecycle_stage AS ENUM ('subscriber', 'lead', 'mql', 'sql', 'customer', 'churned');
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS marketing_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email VARCHAR(320),
  phone VARCHAR(20),
  dob DATE,
  gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100) DEFAULT 'India',
  language VARCHAR(10) DEFAULT 'en',
  moolank SMALLINT CHECK (moolank BETWEEN 1 AND 9),
  bhagyank SMALLINT CHECK (bhagyank BETWEEN 1 AND 9),
  kua_number SMALLINT CHECK (kua_number BETWEEN 1 AND 9),
  primary_concern VARCHAR(50),
  lead_source VARCHAR(80) NOT NULL DEFAULT 'website',
  lead_magnet VARCHAR(120),
  lifecycle_stage lead_lifecycle_stage NOT NULL DEFAULT 'lead',
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(150),
  utm_term VARCHAR(100),
  utm_content VARCHAR(100),
  referrer_url TEXT,
  ip_address VARCHAR(64),
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS marketing_leads_email_idx ON marketing_leads (LOWER(email)) WHERE email IS NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS marketing_leads_phone_idx ON marketing_leads (phone) WHERE phone IS NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS marketing_leads_created_idx ON marketing_leads (created_at DESC);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS marketing_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES marketing_leads(id) ON DELETE CASCADE,
  channel marketing_channel NOT NULL,
  status consent_status NOT NULL DEFAULT 'opted_in',
  purpose VARCHAR(100) NOT NULL,
  consent_text TEXT NOT NULL,
  opted_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  opted_out_at TIMESTAMPTZ,
  opt_out_reason TEXT,
  ip_address VARCHAR(64),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS marketing_consents_lead_channel_idx ON marketing_consents (lead_id, channel, status);
