CREATE TABLE IF NOT EXISTS "site_errors" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"fingerprint" varchar(64) NOT NULL,
	"source" varchar(20) NOT NULL,
	"level" varchar(10) DEFAULT 'error' NOT NULL,
	"message" text NOT NULL,
	"stack" text,
	"route" varchar(300),
	"method" varchar(10),
	"status" integer,
	"count" integer DEFAULT 1 NOT NULL,
	"meta" jsonb,
	"first_seen" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	CONSTRAINT "site_errors_fingerprint_unique" UNIQUE("fingerprint")
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "site_errors_last_idx" ON "site_errors" ("last_seen");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "site_error_days" (
	"day" varchar(10) NOT NULL,
	"source" varchar(20) NOT NULL,
	"level" varchar(10) NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "site_error_days_day_source_level_pk" PRIMARY KEY("day","source","level")
);
