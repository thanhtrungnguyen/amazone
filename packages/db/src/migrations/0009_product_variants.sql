-- Product Variant Options
CREATE TABLE IF NOT EXISTS "product_variant_options" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "name" varchar(100) NOT NULL,
  "position" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "pvo_product_idx" ON "product_variant_options" USING btree ("product_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pvo_product_position_idx" ON "product_variant_options" USING btree ("product_id", "position");
--> statement-breakpoint

-- Product Variant Values
CREATE TABLE IF NOT EXISTS "product_variant_values" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "option_id" uuid NOT NULL REFERENCES "product_variant_options"("id") ON DELETE CASCADE,
  "value" varchar(255) NOT NULL,
  "position" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "pvv_option_idx" ON "product_variant_values" USING btree ("option_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pvv_option_position_idx" ON "product_variant_values" USING btree ("option_id", "position");
--> statement-breakpoint

-- Product Variants
CREATE TABLE IF NOT EXISTS "product_variants" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "sku" varchar(255) UNIQUE,
  "price_in_cents" integer,
  "stock" integer DEFAULT 0 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "pv_product_idx" ON "product_variants" USING btree ("product_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pv_sku_idx" ON "product_variants" USING btree ("sku");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pv_product_active_idx" ON "product_variants" USING btree ("product_id", "is_active");
--> statement-breakpoint

-- Product Variant Combinations
CREATE TABLE IF NOT EXISTS "product_variant_combinations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "variant_id" uuid NOT NULL REFERENCES "product_variants"("id") ON DELETE CASCADE,
  "option_id" uuid NOT NULL REFERENCES "product_variant_options"("id") ON DELETE CASCADE,
  "value_id" uuid NOT NULL REFERENCES "product_variant_values"("id") ON DELETE CASCADE
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "pvc_variant_idx" ON "product_variant_combinations" USING btree ("variant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pvc_option_value_idx" ON "product_variant_combinations" USING btree ("option_id", "value_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "pvc_variant_option_idx" ON "product_variant_combinations" USING btree ("variant_id", "option_id");
--> statement-breakpoint

-- Add variant_id to cart_items
ALTER TABLE "cart_items" ADD COLUMN "variant_id" uuid REFERENCES "product_variants"("id") ON DELETE SET NULL;
--> statement-breakpoint

-- Drop old unique index and create new one that includes variant_id
DROP INDEX IF EXISTS "cart_items_user_product_idx";
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "cart_items_user_product_variant_idx" ON "cart_items" USING btree ("user_id", "product_id", "variant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cart_items_variant_idx" ON "cart_items" USING btree ("variant_id");
