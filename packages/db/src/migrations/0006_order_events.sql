CREATE TABLE IF NOT EXISTS "order_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "order_id" uuid NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
  "type" varchar(50) NOT NULL,
  "message" text NOT NULL,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_events_order_idx" ON "order_events" USING btree ("order_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_events_type_idx" ON "order_events" USING btree ("type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_events_created_idx" ON "order_events" USING btree ("created_at");
