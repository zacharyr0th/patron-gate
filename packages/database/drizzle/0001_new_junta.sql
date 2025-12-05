-- Add shelby_blob_url as nullable first
ALTER TABLE "content" ADD COLUMN "shelby_blob_url" text;--> statement-breakpoint

-- Backfill shelby_blob_url from shelby_cid for existing rows
UPDATE "content" SET "shelby_blob_url" = "shelby_cid" WHERE "shelby_blob_url" IS NULL;--> statement-breakpoint

-- Now make it NOT NULL
ALTER TABLE "content" ALTER COLUMN "shelby_blob_url" SET NOT NULL;--> statement-breakpoint

-- Add encryption fields
ALTER TABLE "content" ADD COLUMN "encrypted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "content" ADD COLUMN "data_to_encrypt_hash" text;--> statement-breakpoint
ALTER TABLE "content" ADD COLUMN "access_control_conditions" text;--> statement-breakpoint
ALTER TABLE "content" ADD COLUMN "required_tier_id" integer;