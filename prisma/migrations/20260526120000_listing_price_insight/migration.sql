-- CreateTable
CREATE TABLE "ListingPriceInsight" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "min" INTEGER,
    "max" INTEGER,
    "median" INTEGER,
    "p25" INTEGER,
    "p75" INTEGER,
    "sampleSize" INTEGER NOT NULL DEFAULT 0,
    "confidence" TEXT,
    "message" TEXT,
    "reason" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListingPriceInsight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ListingPriceInsight_listingId_key" ON "ListingPriceInsight"("listingId");

-- CreateIndex
CREATE INDEX "ListingPriceInsight_status_idx" ON "ListingPriceInsight"("status");

-- CreateIndex
CREATE INDEX "ListingPriceInsight_checkedAt_idx" ON "ListingPriceInsight"("checkedAt");

-- AddForeignKey
ALTER TABLE "ListingPriceInsight" ADD CONSTRAINT "ListingPriceInsight_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
