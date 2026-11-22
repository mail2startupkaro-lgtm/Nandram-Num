-- Celebrity Numerology blog posts (Admin → Report Generating → Celebrity numerology).
-- Idempotent: the app also creates this table on first use, so running this again is safe.
CREATE TABLE IF NOT EXISTS celebrity_posts (
  id bigserial PRIMARY KEY,
  slug varchar(140) NOT NULL UNIQUE,
  name varchar(120) NOT NULL,
  dob varchar(10) NOT NULL,
  status varchar(12) NOT NULL DEFAULT 'draft',
  post jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS celebrity_posts_status_idx ON celebrity_posts (status, published_at DESC);
