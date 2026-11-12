ALTER TABLE "reports" ADD COLUMN "requested_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "deliver_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "released_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "on_hold" boolean DEFAULT false NOT NULL;