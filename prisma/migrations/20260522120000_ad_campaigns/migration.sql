-- CreateEnum
CREATE TYPE "AdPlacement" AS ENUM ('MOBILE_FEED_INLINE', 'DESKTOP_FEED_INLINE', 'CATEGORY_FEED_INLINE', 'SEARCH_FEED_INLINE', 'LISTING_PAGE_TOP', 'LISTING_PAGE_MIDDLE', 'LISTING_PAGE_BOTTOM', 'SELLER_PROFILE', 'HOME_RECOMMENDATIONS', 'SIDEBAR_DESKTOP');

-- CreateEnum
CREATE TYPE "AdType" AS ENUM ('NATIVE_CARD', 'BANNER', 'PROMOTED_LISTING', 'SERVICE_CARD', 'SHOP_CARD', 'EXTERNAL_AD');

-- CreateEnum
CREATE TYPE "AdStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'FINISHED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AdDevice" AS ENUM ('MOBILE', 'DESKTOP', 'TABLET', 'ALL');

-- CreateEnum
CREATE TYPE "AdEventType" AS ENUM ('IMPRESSION', 'CLICK', 'HIDE', 'REPORT');

-- CreateTable
CREATE TABLE "AdCampaign" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "targetUrl" TEXT NOT NULL,
    "ctaText" TEXT,
    "label" TEXT,
    "city" TEXT,
    "type" "AdType" NOT NULL DEFAULT 'NATIVE_CARD',
    "placements" "AdPlacement"[] DEFAULT ARRAY[]::"AdPlacement"[],
    "status" "AdStatus" NOT NULL DEFAULT 'DRAFT',
    "categoryIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "subcategoryIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "cityIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "regionIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "districtIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "device" "AdDevice" NOT NULL DEFAULT 'ALL',
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "budget" INTEGER,
    "dailyBudget" INTEGER,
    "maxImpressionsPerUserPerDay" INTEGER NOT NULL DEFAULT 10,
    "maxImpressionsPerSession" INTEGER NOT NULL DEFAULT 3,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdEvent" (
    "id" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "eventType" "AdEventType" NOT NULL,
    "placement" "AdPlacement",
    "categoryId" TEXT,
    "cityId" TEXT,
    "device" "AdDevice",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdCampaign_status_idx" ON "AdCampaign"("status");

-- CreateIndex
CREATE INDEX "AdCampaign_updatedAt_idx" ON "AdCampaign"("updatedAt" DESC);

-- CreateIndex
CREATE INDEX "AdEvent_adId_eventType_createdAt_idx" ON "AdEvent"("adId", "eventType", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AdEvent_adId_userId_eventType_createdAt_idx" ON "AdEvent"("adId", "userId", "eventType", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AdEvent_adId_sessionId_eventType_createdAt_idx" ON "AdEvent"("adId", "sessionId", "eventType", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AdEvent_sessionId_createdAt_idx" ON "AdEvent"("sessionId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "AdEvent" ADD CONSTRAINT "AdEvent_adId_fkey" FOREIGN KEY ("adId") REFERENCES "AdCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
