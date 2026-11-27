-- Security audit 2026-11-27. Idempotent – safe to run more than once.
-- 1) Row-level security on every table (defense in depth): the app connects as the table owner, which is not
--    affected; Supabase's public API roles (anon / authenticated) get no rows at all, even if a key ever leaks.
ALTER TABLE IF EXISTS "affiliates" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE IF EXISTS "affiliate_clicks" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE IF EXISTS "affiliate_commissions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE IF EXISTS "affiliate_payouts" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE IF EXISTS "celebrity_posts" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE IF EXISTS "contact_messages" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE IF EXISTS "marketing_consents" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE IF EXISTS "marketing_leads" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE IF EXISTS "service_orders" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE IF EXISTS "services" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE IF EXISTS "site_events" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE IF EXISTS "site_visits" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
-- 2) Indexes for foreign keys used in lookups (Supabase performance advisor).
CREATE INDEX IF NOT EXISTS "credit_ledger_user_idx" ON "credit_ledger" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "share_links_report_idx" ON "share_links" ("report_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_messages_user_idx" ON "contact_messages" ("user_id");
