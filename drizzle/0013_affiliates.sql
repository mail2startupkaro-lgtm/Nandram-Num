-- Affiliate program (Admin → Affiliate Marketing, /affiliate-program, /account/affiliate).
-- Idempotent: the app also creates these tables on first use (lib/affiliate/store.ts), so running this again is safe.
CREATE TABLE IF NOT EXISTS "affiliates" ("id" text PRIMARY KEY DEFAULT gen_random_uuid()::text, "user_id" text NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE, "code" varchar(20) NOT NULL UNIQUE, "status" varchar(12) NOT NULL DEFAULT 'pending', "name" text, "phone" varchar(20), "channel" text, "audience" varchar(40), "promotion" text, "payout_method" varchar(10), "payout_enc" text, "commission_percent" integer, "admin_note" text, "approved_at" timestamp with time zone, "created_at" timestamp with time zone NOT NULL DEFAULT now(), "updated_at" timestamp with time zone NOT NULL DEFAULT now());
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "affiliate_clicks" ("id" text PRIMARY KEY DEFAULT gen_random_uuid()::text, "affiliate_id" text NOT NULL REFERENCES "affiliates"("id") ON DELETE CASCADE, "path" varchar(200), "created_at" timestamp with time zone NOT NULL DEFAULT now());
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "affiliate_clicks_aff_idx" ON "affiliate_clicks" ("affiliate_id", "created_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "affiliate_payouts" ("id" text PRIMARY KEY DEFAULT gen_random_uuid()::text, "affiliate_id" text NOT NULL REFERENCES "affiliates"("id") ON DELETE CASCADE, "currency" varchar(3) NOT NULL DEFAULT 'INR', "amount_paise" integer NOT NULL, "method" varchar(20), "reference" varchar(80), "note" text, "created_at" timestamp with time zone NOT NULL DEFAULT now());
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "affiliate_payouts_aff_idx" ON "affiliate_payouts" ("affiliate_id", "created_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "affiliate_commissions" ("id" text PRIMARY KEY DEFAULT gen_random_uuid()::text, "affiliate_id" text NOT NULL REFERENCES "affiliates"("id") ON DELETE CASCADE, "payment_id" text NOT NULL UNIQUE REFERENCES "payments"("id") ON DELETE CASCADE, "buyer_user_id" text, "plan_code" varchar(30) NOT NULL, "source" varchar(10) NOT NULL, "currency" varchar(3) NOT NULL DEFAULT 'INR', "sale_paise" integer NOT NULL, "rate_percent" integer NOT NULL, "commission_paise" integer NOT NULL, "status" varchar(12) NOT NULL DEFAULT 'awaiting', "earned_at" timestamp with time zone, "paid_at" timestamp with time zone, "payout_id" text, "created_at" timestamp with time zone NOT NULL DEFAULT now());
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "affiliate_commissions_aff_idx" ON "affiliate_commissions" ("affiliate_id", "status");
