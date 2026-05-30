-- CreateEnum
CREATE TYPE "ContentModerationSource" AS ENUM ('LISTING', 'WANT_TO_BUY', 'LISTING_UPLOAD');

-- CreateEnum
CREATE TYPE "ContentModerationSeverity" AS ENUM ('BLOCKED', 'FLAGGED');

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN "contentFingerprint" TEXT;

-- AlterTable
ALTER TABLE "WantToBuy" ADD COLUMN "contentFingerprint" TEXT;

-- CreateTable
CREATE TABLE "ContentModerationIncident" (
    "id" TEXT NOT NULL,
    "source" "ContentModerationSource" NOT NULL,
    "severity" "ContentModerationSeverity" NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" TEXT,
    "wantToBuyId" TEXT,
    "reasonCode" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "matchedRules" JSONB,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedAt" TIMESTAMP(3),
    "staffId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentModerationIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UploadedMediaFingerprint" (
    "id" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "blockReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UploadedMediaFingerprint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Listing_sellerId_contentFingerprint_idx" ON "Listing"("sellerId", "contentFingerprint");

-- CreateIndex
CREATE INDEX "Listing_contentFingerprint_idx" ON "Listing"("contentFingerprint");

-- CreateIndex
CREATE INDEX "WantToBuy_userId_contentFingerprint_idx" ON "WantToBuy"("userId", "contentFingerprint");

-- CreateIndex
CREATE INDEX "WantToBuy_contentFingerprint_idx" ON "WantToBuy"("contentFingerprint");

-- CreateIndex
CREATE INDEX "ContentModerationIncident_status_createdAt_idx" ON "ContentModerationIncident"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ContentModerationIncident_userId_createdAt_idx" ON "ContentModerationIncident"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ContentModerationIncident_listingId_idx" ON "ContentModerationIncident"("listingId");

-- CreateIndex
CREATE INDEX "ContentModerationIncident_wantToBuyId_idx" ON "ContentModerationIncident"("wantToBuyId");

-- CreateIndex
CREATE INDEX "UploadedMediaFingerprint_sha256_idx" ON "UploadedMediaFingerprint"("sha256");

-- CreateIndex
CREATE INDEX "UploadedMediaFingerprint_userId_createdAt_idx" ON "UploadedMediaFingerprint"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "UploadedMediaFingerprint_sha256_blocked_idx" ON "UploadedMediaFingerprint"("sha256", "blocked");

-- AddForeignKey
ALTER TABLE "ContentModerationIncident" ADD CONSTRAINT "ContentModerationIncident_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentModerationIncident" ADD CONSTRAINT "ContentModerationIncident_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentModerationIncident" ADD CONSTRAINT "ContentModerationIncident_wantToBuyId_fkey" FOREIGN KEY ("wantToBuyId") REFERENCES "WantToBuy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentModerationIncident" ADD CONSTRAINT "ContentModerationIncident_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadedMediaFingerprint" ADD CONSTRAINT "UploadedMediaFingerprint_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
