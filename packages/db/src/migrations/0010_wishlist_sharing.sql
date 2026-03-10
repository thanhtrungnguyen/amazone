-- Add sharing columns to wishlists table
ALTER TABLE "wishlists" ADD COLUMN "is_public" boolean NOT NULL DEFAULT false;
ALTER TABLE "wishlists" ADD COLUMN "share_token" varchar(64) UNIQUE;

-- Index for looking up wishlists by share token
CREATE INDEX "wishlists_share_token_idx" ON "wishlists" ("share_token");
