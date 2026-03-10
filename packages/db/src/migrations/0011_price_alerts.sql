-- Create price_alerts table
CREATE TABLE IF NOT EXISTS "price_alerts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "target_price" integer NOT NULL,
  "is_active" boolean NOT NULL DEFAULT true,
  "triggered_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX "price_alerts_user_idx" ON "price_alerts" ("user_id");
CREATE INDEX "price_alerts_product_idx" ON "price_alerts" ("product_id");
CREATE INDEX "price_alerts_active_product_idx" ON "price_alerts" ("is_active", "product_id");
CREATE UNIQUE INDEX "price_alerts_user_product_idx" ON "price_alerts" ("user_id", "product_id");
