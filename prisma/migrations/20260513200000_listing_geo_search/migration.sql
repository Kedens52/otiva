ALTER TABLE "Listing"
ADD COLUMN "district" TEXT,
ADD COLUMN "showExactAddress" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "Listing_district_idx" ON "Listing"("district");
