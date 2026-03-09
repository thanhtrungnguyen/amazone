CREATE TYPE "public"."discount_type" AS ENUM('percentage', 'fixed');

CREATE TABLE "coupons" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "code" varchar(50) NOT NULL,
  "discount_type" "discount_type" NOT NULL,
  "discount_value" integer NOT NULL,
  "min_order_cents" integer,
  "max_usages" integer,
  "usage_count" integer DEFAULT 0 NOT NULL,
  "expires_at" timestamp,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "coupons_code_unique" UNIQUE("code"),
  CONSTRAINT "coupons_discount_value_positive" CHECK ("discount_value" > 0),
  CONSTRAINT "coupons_percentage_range" CHECK ("discount_type" != 'percentage' OR "discount_value" <= 100)
);

CREATE TABLE "order_coupons" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "order_id" uuid NOT NULL,
  "coupon_id" uuid NOT NULL,
  "discount_cents" integer NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "order_coupons_order_id_unique" UNIQUE("order_id")
);

ALTER TABLE "order_coupons" ADD CONSTRAINT "order_coupons_order_id_orders_id_fk"
  FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "order_coupons" ADD CONSTRAINT "order_coupons_coupon_id_coupons_id_fk"
  FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

CREATE INDEX "coupons_code_idx" ON "coupons" USING btree ("code");
CREATE INDEX "coupons_active_idx" ON "coupons" USING btree ("is_active");
