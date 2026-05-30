-- CreateEnum
CREATE TYPE "BannerSlotId" AS ENUM ('leaderboard', 'sidebarTop', 'sidebarTall');

-- CreateEnum
CREATE TYPE "BannerSlotAdStatus" AS ENUM ('draft', 'pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "BannerSlotAd" (
    "id" TEXT NOT NULL,
    "slot" "BannerSlotId" NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "cta" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "image" TEXT,
    "advertiser" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "startsAt" DATE NOT NULL,
    "endsAt" DATE NOT NULL,
    "erid" TEXT NOT NULL,
    "ordName" TEXT NOT NULL,
    "ownerEmail" TEXT,
    "ownerName" TEXT,
    "status" "BannerSlotAdStatus" NOT NULL DEFAULT 'draft',
    "moderationComment" TEXT,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "lastImpressionAt" TIMESTAMP(3),
    "lastClickAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BannerSlotAd_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BannerSlotAd_slot_active_idx" ON "BannerSlotAd"("slot", "active");

-- CreateIndex
CREATE INDEX "BannerSlotAd_updatedAt_idx" ON "BannerSlotAd"("updatedAt" DESC);
