ALTER TABLE "service_orders" ADD COLUMN IF NOT EXISTS "report_pdf_hi" text;--> statement-breakpoint
ALTER TABLE "service_orders" ADD COLUMN IF NOT EXISTS "report_file_name_hi" varchar(160);--> statement-breakpoint
ALTER TABLE "service_orders" ADD COLUMN IF NOT EXISTS "delivered_by" varchar(10);--> statement-breakpoint
ALTER TABLE "service_orders" ADD COLUMN IF NOT EXISTS "delivery_lock_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "service_orders" ADD COLUMN IF NOT EXISTS "delivery_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "service_orders" ADD COLUMN IF NOT EXISTS "delivery_error" text;--> statement-breakpoint
ALTER TABLE "service_orders" ADD COLUMN IF NOT EXISTS "notified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "service_orders" ADD COLUMN IF NOT EXISTS "notify_log" text;--> statement-breakpoint
UPDATE "service_orders" SET "report_pdf_hi" = "report_pdf", "report_file_name_hi" = "report_file_name", "report_pdf" = NULL, "report_file_name" = NULL WHERE "report_file_name" LIKE '%-hi.pdf' AND "report_pdf_hi" IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "service_orders_due_idx" ON "service_orders" ("status", "on_hold");
