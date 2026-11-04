CREATE TYPE "public"."otp_channel" AS ENUM('email', 'sms');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('created', 'paid', 'failed');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "app_settings" (
	"key" varchar(60) PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "brandings" (
	"user_id" text PRIMARY KEY NOT NULL,
	"brand_name" text NOT NULL,
	"expert_name" text NOT NULL,
	"expert_title" text,
	"contact_line" text,
	"website" text,
	"booking_url" text,
	"logo" text,
	"photo" text,
	"signature" text,
	"colours" jsonb,
	"default_theme" varchar(40),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "coupons" (
	"code" varchar(40) PRIMARY KEY NOT NULL,
	"percent_off" integer,
	"amount_off_paise" integer,
	"max_uses" integer,
	"used" integer DEFAULT 0 NOT NULL,
	"plan_codes" jsonb,
	"expires_at" timestamp with time zone,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "credit_ledger" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"user_id" text NOT NULL,
	"delta" integer NOT NULL,
	"reason" varchar(40) NOT NULL,
	"payment_id" text,
	"report_id" text,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invoice_counters" (
	"fy" varchar(9) PRIMARY KEY NOT NULL,
	"last" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "knowledge_entries" (
	"key" varchar(80) NOT NULL,
	"language" varchar(10) DEFAULT 'en' NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"updated_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "knowledge_entries_key_language_pk" PRIMARY KEY("key","language")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "otp_codes" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"channel" "otp_channel" NOT NULL,
	"identifier_hash" varchar(64) NOT NULL,
	"code_hash" varchar(64) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"consumed_at" timestamp with time zone,
	"ip" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payments" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"user_id" text NOT NULL,
	"plan_code" varchar(30) NOT NULL,
	"razorpay_order_id" varchar(60) NOT NULL,
	"razorpay_payment_id" varchar(60),
	"status" "payment_status" DEFAULT 'created' NOT NULL,
	"list_price_paise" integer NOT NULL,
	"discount_paise" integer DEFAULT 0 NOT NULL,
	"amount_paise" integer NOT NULL,
	"taxable_paise" integer NOT NULL,
	"cgst_paise" integer DEFAULT 0 NOT NULL,
	"sgst_paise" integer DEFAULT 0 NOT NULL,
	"igst_paise" integer DEFAULT 0 NOT NULL,
	"coupon_code" varchar(40),
	"billing_name" text,
	"billing_state" varchar(60),
	"gstin" varchar(15),
	"invoice_number" varchar(30),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"paid_at" timestamp with time zone,
	CONSTRAINT "payments_razorpay_order_id_unique" UNIQUE("razorpay_order_id"),
	CONSTRAINT "payments_razorpay_payment_id_unique" UNIQUE("razorpay_payment_id"),
	CONSTRAINT "payments_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "plans" (
	"code" varchar(30) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"price_paise" integer NOT NULL,
	"interval_days" integer,
	"credits" integer DEFAULT 0 NOT NULL,
	"features" jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscriptions" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"user_id" text NOT NULL,
	"plan_code" varchar(30) NOT NULL,
	"current_period_end" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "unlocked_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "google_sub" varchar(64);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "credits" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "billing_state" varchar(60);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone_verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_login_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "disabled_at" timestamp with time zone;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "brandings" ADD CONSTRAINT "brandings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "credit_ledger" ADD CONSTRAINT "credit_ledger_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "otp_identifier_idx" ON "otp_codes" USING btree ("identifier_hash","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payments_user_idx" ON "payments" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_google_sub_unique" UNIQUE("google_sub");