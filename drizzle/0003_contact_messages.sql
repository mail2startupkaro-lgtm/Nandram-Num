CREATE TABLE IF NOT EXISTS "contact_messages" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"topic" varchar(30) NOT NULL,
	"service" varchar(40),
	"details_enc" text NOT NULL,
	"phone_last4" varchar(4),
	"language" varchar(10) DEFAULT 'en' NOT NULL,
	"status" varchar(20) DEFAULT 'new' NOT NULL,
	"admin_note" text,
	"user_id" text,
	"page" varchar(200),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contact_messages" ADD CONSTRAINT "contact_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_messages_status_idx" ON "contact_messages" USING btree ("status","created_at");