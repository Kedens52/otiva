-- AdStatus: new workflow values
ALTER TYPE "AdStatus" ADD VALUE IF NOT EXISTS 'WAITING_PAYMENT';
ALTER TYPE "AdStatus" ADD VALUE IF NOT EXISTS 'PENDING_REVIEW';
ALTER TYPE "AdStatus" ADD VALUE IF NOT EXISTS 'NEEDS_CHANGES';
ALTER TYPE "AdStatus" ADD VALUE IF NOT EXISTS 'ARCHIVED';

-- CreateEnum
CREATE TYPE "AdPricingModel" AS ENUM ('FIXED', 'CPM', 'CPC');
CREATE TYPE "AdPaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- AlterTable AdCampaign
ALTER TABLE "AdCampaign" ADD COLUMN IF NOT EXISTS "ownerId" TEXT;
ALTER TABLE "AdCampaign" ADD COLUMN IF NOT EXISTS "companyName" TEXT;
ALTER TABLE "AdCampaign" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "AdCampaign" ADD COLUMN IF NOT EXISTS "pricingModel" "AdPricingModel" NOT NULL DEFAULT 'FIXED';
ALTER TABLE "AdCampaign" ADD COLUMN IF NOT EXISTS "spent" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AdCampaign" ADD COLUMN IF NOT EXISTS "moderationNote" TEXT;

CREATE INDEX IF NOT EXISTS "AdCampaign_ownerId_status_idx" ON "AdCampaign"("ownerId", "status");

ALTER TABLE "AdCampaign" ADD CONSTRAINT "AdCampaign_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable AdPayment
CREATE TABLE "AdPayment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "adCampaignId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RUB',
    "status" "AdPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "provider" TEXT NOT NULL DEFAULT 'internal',
    "providerPaymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "AdPayment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdPayment_userId_createdAt_idx" ON "AdPayment"("userId", "createdAt" DESC);
CREATE INDEX "AdPayment_adCampaignId_idx" ON "AdPayment"("adCampaignId");
CREATE INDEX "AdPayment_status_idx" ON "AdPayment"("status");

ALTER TABLE "AdPayment" ADD CONSTRAINT "AdPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdPayment" ADD CONSTRAINT "AdPayment_adCampaignId_fkey" FOREIGN KEY ("adCampaignId") REFERENCES "AdCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable AdCampaignChangeLog
CREATE TABLE "AdCampaignChangeLog" (
    "id" TEXT NOT NULL,
    "adCampaignId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdCampaignChangeLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdCampaignChangeLog_adCampaignId_createdAt_idx" ON "AdCampaignChangeLog"("adCampaignId", "createdAt" DESC);

ALTER TABLE "AdCampaignChangeLog" ADD CONSTRAINT "AdCampaignChangeLog_adCampaignId_fkey" FOREIGN KEY ("adCampaignId") REFERENCES "AdCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdCampaignChangeLog" ADD CONSTRAINT "AdCampaignChangeLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
