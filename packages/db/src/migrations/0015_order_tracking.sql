ALTER TABLE "orders" ADD COLUMN "shipping_carrier" varchar(100);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "tracking_number" varchar(200);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "estimated_delivery" timestamp;
