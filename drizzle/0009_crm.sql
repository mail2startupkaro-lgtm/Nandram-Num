-- CRM: pipeline stage, owner, value, follow-ups, timeline and tags on top of marketing_leads (0003 / 0008).
-- Idempotent: already applied to Supabase by hand on 2026-11-14; safe to run again.
ALTER TABLE marketing_leads ADD COLUMN IF NOT EXISTS crm_stage varchar(20) NOT NULL DEFAULT 'new';
--> statement-breakpoint
ALTER TABLE marketing_leads ADD COLUMN IF NOT EXISTS owner_id text REFERENCES users(id) ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE marketing_leads ADD COLUMN IF NOT EXISTS deal_value_paise integer;
--> statement-breakpoint
ALTER TABLE marketing_leads ADD COLUMN IF NOT EXISTS priority varchar(10) NOT NULL DEFAULT 'normal';
--> statement-breakpoint
ALTER TABLE marketing_leads ADD COLUMN IF NOT EXISTS next_follow_up_at timestamptz;
--> statement-breakpoint
ALTER TABLE marketing_leads ADD COLUMN IF NOT EXISTS last_contacted_at timestamptz;
--> statement-breakpoint
ALTER TABLE marketing_leads ADD COLUMN IF NOT EXISTS lost_reason text;
--> statement-breakpoint
ALTER TABLE marketing_leads ADD COLUMN IF NOT EXISTS notes text;
--> statement-breakpoint
ALTER TABLE marketing_leads ADD COLUMN IF NOT EXISTS stage_changed_at timestamptz NOT NULL DEFAULT now();
--> statement-breakpoint
UPDATE marketing_leads SET crm_stage = 'won' WHERE lifecycle_stage = 'customer' AND crm_stage = 'new';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS marketing_leads_crm_stage_idx ON marketing_leads (crm_stage, updated_at DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS marketing_leads_follow_up_idx ON marketing_leads (next_follow_up_at) WHERE next_follow_up_at IS NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS marketing_leads_user_idx ON marketing_leads (user_id);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS crm_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES marketing_leads(id) ON DELETE CASCADE,
  type varchar(20) NOT NULL,
  body text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by text REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS crm_activities_lead_idx ON crm_activities (lead_id, created_at DESC);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS crm_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES marketing_leads(id) ON DELETE CASCADE,
  title varchar(200) NOT NULL,
  due_at timestamptz NOT NULL,
  priority varchar(10) NOT NULL DEFAULT 'normal',
  done_at timestamptz,
  created_by text REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS crm_tasks_open_idx ON crm_tasks (due_at) WHERE done_at IS NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS crm_tasks_lead_idx ON crm_tasks (lead_id);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS marketing_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar(80) NOT NULL UNIQUE,
  name varchar(120) NOT NULL,
  category varchar(50) NOT NULL DEFAULT 'general',
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS lead_tags (
  lead_id uuid NOT NULL REFERENCES marketing_leads(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES marketing_tags(id) ON DELETE CASCADE,
  tagged_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (lead_id, tag_id)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS lead_tags_tag_idx ON lead_tags (tag_id);
--> statement-breakpoint
ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE crm_tasks ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE marketing_tags ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE lead_tags ENABLE ROW LEVEL SECURITY;
