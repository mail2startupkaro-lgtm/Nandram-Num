-- First-party visitor analytics (Admin → Visitor analytics). No IP addresses or personal data are stored:
-- visitors are counted by a random browser id, location comes from the hosting edge (country / region / city).
-- Idempotent: the app also creates these tables on first use, so running this again is safe.
CREATE TABLE IF NOT EXISTS site_visits (
  id bigserial PRIMARY KEY,
  visitor_id varchar(40) NOT NULL,
  session_id varchar(40) NOT NULL,
  user_id text,
  path varchar(300) NOT NULL,
  title varchar(200),
  referrer_host varchar(120),
  source varchar(80),
  medium varchar(60),
  campaign varchar(120),
  channel varchar(20) NOT NULL DEFAULT 'Direct',
  country varchar(2),
  region varchar(80),
  city varchar(80),
  device varchar(10),
  browser varchar(30),
  os varchar(30),
  lang varchar(12),
  tz varchar(60),
  screen_w smallint,
  is_new_visitor boolean NOT NULL DEFAULT false,
  is_entry boolean NOT NULL DEFAULT false,
  duration_ms integer NOT NULL DEFAULT 0,
  scroll_pct smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS site_visits_created_idx ON site_visits (created_at);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS site_visits_session_idx ON site_visits (session_id, created_at);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS site_visits_updated_idx ON site_visits (updated_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS site_events (
  id bigserial PRIMARY KEY,
  visitor_id varchar(40) NOT NULL,
  session_id varchar(40) NOT NULL,
  visit_id bigint,
  name varchar(40) NOT NULL,
  path varchar(300),
  label varchar(120),
  value numeric(12,2),
  country varchar(2),
  created_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS site_events_created_idx ON site_events (created_at);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS site_events_session_idx ON site_events (session_id);
