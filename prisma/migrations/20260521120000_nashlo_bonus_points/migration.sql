-- Баллы Нашло
CREATE TYPE "BonusTransactionType" AS ENUM ('EARN', 'SPEND', 'ADJUST', 'REVERSAL');
CREATE TYPE "BonusTransactionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REVERSED');
CREATE TYPE "BonusReason" AS ENUM (
  'WELCOME',
  'PHONE_VERIFIED',
  'PROFILE_COMPLETE',
  'AVATAR_ADDED',
  'FIRST_QUALITY_LISTING',
  'QUALITY_LISTING',
  'SHARE_VK',
  'SHARE_MAX',
  'FAST_RESPONSE_DAY',
  'DEAL_COMPLETED',
  'REVIEW_LEFT',
  'POSITIVE_REVIEW_RECEIVED',
  'REFERRAL_REGISTERED',
  'REFERRAL_ACTIVE',
  'SPEND_BUMP',
  'SPEND_HIGHLIGHT',
  'SPEND_PROMO_DISCOUNT',
  'ADMIN_ADJUST',
  'REVERSAL'
);
CREATE TYPE "SharePlatform" AS ENUM ('VK', 'MAX');
CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED');

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bonusBalance" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bonusBlocked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "referralCode" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "User_referralCode_key" ON "User"("referralCode");

CREATE TABLE "BonusTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "BonusTransactionType" NOT NULL,
    "status" "BonusTransactionStatus" NOT NULL DEFAULT 'APPROVED',
    "reason" "BonusReason" NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "referenceKey" TEXT,
    "listingId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BonusTransaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BonusShareEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "platform" "SharePlatform" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BonusShareEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referredUserId" TEXT NOT NULL,
    "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "activatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BonusTransaction_userId_reason_referenceKey_key" ON "BonusTransaction"("userId", "reason", "referenceKey");
CREATE INDEX "BonusTransaction_userId_createdAt_idx" ON "BonusTransaction"("userId", "createdAt" DESC);
CREATE INDEX "BonusTransaction_status_idx" ON "BonusTransaction"("status");
CREATE INDEX "BonusTransaction_reason_idx" ON "BonusTransaction"("reason");

CREATE INDEX "BonusShareEvent_userId_createdAt_idx" ON "BonusShareEvent"("userId", "createdAt");
CREATE INDEX "BonusShareEvent_listingId_platform_idx" ON "BonusShareEvent"("listingId", "platform");

CREATE UNIQUE INDEX "Referral_referredUserId_key" ON "Referral"("referredUserId");
CREATE INDEX "Referral_referrerId_idx" ON "Referral"("referrerId");
CREATE INDEX "Referral_status_idx" ON "Referral"("status");

ALTER TABLE "BonusTransaction" ADD CONSTRAINT "BonusTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BonusShareEvent" ADD CONSTRAINT "BonusShareEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referredUserId_fkey" FOREIGN KEY ("referredUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
