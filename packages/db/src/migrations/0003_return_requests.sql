-- Add "return_requested" value to order_status enum
ALTER TYPE "public"."order_status" ADD VALUE 'return_requested';

-- Create return_status enum
CREATE TYPE "public"."return_status" AS ENUM('pending', 'approved', 'rejected', 'completed');

-- Create return_requests table
CREATE TABLE "return_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "order_id" uuid NOT NULL UNIQUE,
  "user_id" uuid NOT NULL,
  "reason" text NOT NULL,
  "status" "return_status" DEFAULT 'pending' NOT NULL,
  "admin_notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Foreign keys
ALTER TABLE "return_requests"
  ADD CONSTRAINT "return_requests_order_id_orders_id_fk"
  FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "return_requests"
  ADD CONSTRAINT "return_requests_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;

-- Indexes
CREATE INDEX "return_requests_order_idx" ON "return_requests" ("order_id");
CREATE INDEX "return_requests_user_idx" ON "return_requests" ("user_id");
CREATE INDEX "return_requests_status_idx" ON "return_requests" ("status");
