ALTER TABLE "users" ADD COLUMN "verification_token" varchar(255);
ALTER TABLE "users" ADD COLUMN "verification_token_expiry" timestamp;
