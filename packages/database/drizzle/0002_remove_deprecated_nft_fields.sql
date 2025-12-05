-- Migration: Remove deprecated NFT fields
-- Date: 2025-11-16
-- Description: Removes zoraNftAddress, zoraUrl, and purchasePrice columns from content table

-- Drop deprecated NFT columns
ALTER TABLE "content" DROP COLUMN IF EXISTS "zora_nft_address";
ALTER TABLE "content" DROP COLUMN IF EXISTS "zora_url";
ALTER TABLE "content" DROP COLUMN IF EXISTS "purchase_price";

-- Drop deprecated purchase_count column (no longer tracking NFT purchases)
ALTER TABLE "content" DROP COLUMN IF EXISTS "purchase_count";
