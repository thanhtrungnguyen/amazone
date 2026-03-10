CREATE TABLE IF NOT EXISTS "product_bundles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(200) NOT NULL,
  "slug" varchar(200) NOT NULL UNIQUE,
  "description" text,
  "discount_percent" integer DEFAULT 0 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "product_bundles_discount_range" CHECK ("discount_percent" >= 0 AND "discount_percent" <= 50)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_bundles_active_idx" ON "product_bundles" USING btree ("is_active");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "product_bundle_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "bundle_id" uuid NOT NULL REFERENCES "product_bundles"("id") ON DELETE CASCADE,
  "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "quantity" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_bundle_items_bundle_idx" ON "product_bundle_items" USING btree ("bundle_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_bundle_items_product_idx" ON "product_bundle_items" USING btree ("product_id");
