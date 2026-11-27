ALTER TABLE "service_orders" ADD COLUMN IF NOT EXISTS "report_pdf" text;--> statement-breakpoint
ALTER TABLE "service_orders" ADD COLUMN IF NOT EXISTS "report_file_name" varchar(160);--> statement-breakpoint
ALTER TABLE "service_orders" ADD COLUMN IF NOT EXISTS "report_saved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "service_orders" ADD COLUMN IF NOT EXISTS "on_hold" boolean DEFAULT false NOT NULL;
