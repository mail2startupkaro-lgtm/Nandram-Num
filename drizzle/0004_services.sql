CREATE TABLE "service_orders" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"payment_id" text NOT NULL,
	"user_id" text,
	"service_code" varchar(30) NOT NULL,
	"details_enc" text NOT NULL,
	"status" varchar(20) DEFAULT 'awaiting_payment' NOT NULL,
	"admin_note" text,
	"delivered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "service_orders_payment_id_unique" UNIQUE("payment_id")
);
--> statement-breakpoint
CREATE TABLE "services" (
	"code" varchar(30) PRIMARY KEY NOT NULL,
	"en" jsonb NOT NULL,
	"hi" jsonb NOT NULL,
	"price_paise" integer NOT NULL,
	"mrp_paise" integer,
	"price_confirmed" boolean DEFAULT false NOT NULL,
	"intake" jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "service_orders_status_idx" ON "service_orders" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "service_orders_user_idx" ON "service_orders" USING btree ("user_id");