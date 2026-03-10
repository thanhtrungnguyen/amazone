CREATE TABLE IF NOT EXISTS "addresses" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "label" varchar(50) NOT NULL,
  "full_name" varchar(255) NOT NULL,
  "street_address" varchar(500) NOT NULL,
  "city" varchar(255) NOT NULL,
  "state" varchar(255),
  "zip_code" varchar(20) NOT NULL,
  "country" varchar(2) NOT NULL,
  "phone" varchar(30),
  "is_default" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "addresses_user_idx" ON "addresses" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "addresses_user_default_idx" ON "addresses" USING btree ("user_id", "is_default");
