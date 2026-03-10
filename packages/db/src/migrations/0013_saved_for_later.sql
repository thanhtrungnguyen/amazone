CREATE TABLE IF NOT EXISTS "saved_for_later" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "variant_id" uuid REFERENCES "product_variant_combinations"("id") ON DELETE SET NULL,
  "quantity" integer DEFAULT 1 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "saved_for_later_user_product_variant_idx" ON "saved_for_later" USING btree ("user_id", "product_id", "variant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "saved_for_later_user_idx" ON "saved_for_later" USING btree ("user_id");
