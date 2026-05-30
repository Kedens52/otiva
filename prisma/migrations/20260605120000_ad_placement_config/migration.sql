-- CreateEnum
CREATE TYPE "AdPlacementKind" AS ENUM ('BANNER_SLOT', 'CAMPAIGN', 'SITE_STRIP');

-- CreateEnum
CREATE TYPE "AdPlacementDeviceScope" AS ENUM ('MOBILE', 'DESKTOP', 'ALL');

-- CreateTable
CREATE TABLE "AdPlacementConfig" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "kind" "AdPlacementKind" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "pages" TEXT,
    "whereOnPage" TEXT,
    "deviceScope" "AdPlacementDeviceScope" NOT NULL DEFAULT 'ALL',
    "designWidth" INTEGER,
    "designHeight" INTEGER,
    "displayWidth" INTEGER,
    "allowedFormats" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "maxFileBytes" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "maxActiveCreatives" INTEGER NOT NULL DEFAULT 3,
    "sortPriority" INTEGER NOT NULL DEFAULT 0,
    "pricePerMinute" INTEGER,
    "pricePerHour" INTEGER,
    "pricePerDay" INTEGER,
    "pricePerWeek" INTEGER,
    "fallbackTitle" TEXT,
    "fallbackSubtitle" TEXT,
    "fallbackCta" TEXT,
    "fallbackHref" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdPlacementConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdPlacementConfig_code_key" ON "AdPlacementConfig"("code");

-- CreateIndex
CREATE INDEX "AdPlacementConfig_kind_active_idx" ON "AdPlacementConfig"("kind", "active");

-- CreateIndex
CREATE INDEX "AdPlacementConfig_sortPriority_idx" ON "AdPlacementConfig"("sortPriority");
