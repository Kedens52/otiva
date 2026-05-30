-- CreateEnum
CREATE TYPE "SiteVisitType" AS ENUM ('PAGE_VIEW', 'REGISTRATION');

-- CreateTable
CREATE TABLE "SiteVisit" (
    "id" TEXT NOT NULL,
    "type" "SiteVisitType" NOT NULL DEFAULT 'PAGE_VIEW',
    "path" TEXT NOT NULL,
    "referrer" TEXT,
    "userId" TEXT,
    "visitorId" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteVisit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SiteVisit_createdAt_idx" ON "SiteVisit"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "SiteVisit_path_createdAt_idx" ON "SiteVisit"("path", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "SiteVisit_visitorId_createdAt_idx" ON "SiteVisit"("visitorId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "SiteVisit_fingerprint_createdAt_idx" ON "SiteVisit"("fingerprint", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "SiteVisit_userId_createdAt_idx" ON "SiteVisit"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "SiteVisit_type_createdAt_idx" ON "SiteVisit"("type", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "SiteVisit" ADD CONSTRAINT "SiteVisit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
