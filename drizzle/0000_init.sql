CREATE TYPE "public"."report_module" AS ENUM('dob', 'name', 'mobile', 'aadhaar', 'couple', 'complete');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('super_admin', 'expert', 'customer');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('draft', 'awaiting_review', 'final');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "client_profiles" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"owner_id" text NOT NULL,
	"display_name" text NOT NULL,
	"input_enc" text NOT NULL,
	"aadhaar_last4" varchar(4),
	"consent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reports" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"profile_id" text NOT NULL,
	"module" "report_module" NOT NULL,
	"version" integer NOT NULL,
	"status" "report_status" DEFAULT 'draft' NOT NULL,
	"input_hash" varchar(64) NOT NULL,
	"engine_version" varchar(20) NOT NULL,
	"as_of" varchar(10) NOT NULL,
	"result_enc" text NOT NULL,
	"narrative_enc" text,
	"theme" varchar(40) DEFAULT 'royal-gold-maroon' NOT NULL,
	"language" varchar(10) DEFAULT 'en' NOT NULL,
	"summary" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "share_links" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"report_id" text NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"password_hash" text,
	"expires_at" timestamp with time zone NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "share_links_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"email" varchar(320),
	"phone" varchar(20),
	"name" text,
	"role" "role" DEFAULT 'customer' NOT NULL,
	"expert_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "client_profiles" ADD CONSTRAINT "client_profiles_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reports" ADD CONSTRAINT "reports_profile_id_client_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."client_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "share_links" ADD CONSTRAINT "share_links_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "client_profiles_owner_idx" ON "client_profiles" USING btree ("owner_id","updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "reports_profile_module_version_uq" ON "reports" USING btree ("profile_id","module","version");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reports_input_hash_idx" ON "reports" USING btree ("input_hash");