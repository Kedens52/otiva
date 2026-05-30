-- Index for category+status filters (homepage counts, category pages)
CREATE INDEX IF NOT EXISTS "Listing_categoryId_status_idx" ON "Listing"("categoryId", "status");
