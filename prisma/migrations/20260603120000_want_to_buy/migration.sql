-- CreateEnum
CREATE TYPE "WantToBuyStatus" AS ENUM ('ACTIVE', 'CLOSED', 'EXPIRED', 'MODERATION', 'REJECTED');

-- CreateEnum
CREATE TYPE "WantToBuyCondition" AS ENUM ('NEW', 'USED', 'ANY');

-- CreateEnum
CREATE TYPE "WantToBuyOfferStatus" AS ENUM ('PENDING', 'VIEWED', 'ACCEPTED', 'DECLINED');

-- CreateTable
CREATE TABLE "WantToBuy" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "categoryId" TEXT NOT NULL,
    "priceMax" INTEGER,
    "city" TEXT,
    "condition" "WantToBuyCondition" NOT NULL DEFAULT 'ANY',
    "status" "WantToBuyStatus" NOT NULL DEFAULT 'MODERATION',
    "views" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "rejectionReason" TEXT,
    "moderationReasonCode" TEXT,
    "autoApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WantToBuy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WantToBuyOffer" (
    "id" TEXT NOT NULL,
    "wantToBuyId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "listingId" TEXT,
    "status" "WantToBuyOfferStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WantToBuyOffer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WantToBuy_userId_status_idx" ON "WantToBuy"("userId", "status");

-- CreateIndex
CREATE INDEX "WantToBuy_status_createdAt_idx" ON "WantToBuy"("status", "createdAt");

-- CreateIndex
CREATE INDEX "WantToBuy_categoryId_idx" ON "WantToBuy"("categoryId");

-- CreateIndex
CREATE INDEX "WantToBuy_city_idx" ON "WantToBuy"("city");

-- CreateIndex
CREATE INDEX "WantToBuy_expiresAt_idx" ON "WantToBuy"("expiresAt");

-- CreateIndex
CREATE INDEX "WantToBuy_priceMax_idx" ON "WantToBuy"("priceMax");

-- CreateIndex
CREATE INDEX "WantToBuyOffer_wantToBuyId_idx" ON "WantToBuyOffer"("wantToBuyId");

-- CreateIndex
CREATE INDEX "WantToBuyOffer_sellerId_idx" ON "WantToBuyOffer"("sellerId");

-- CreateIndex
CREATE INDEX "WantToBuyOffer_status_idx" ON "WantToBuyOffer"("status");

-- CreateIndex
CREATE INDEX "WantToBuyOffer_createdAt_idx" ON "WantToBuyOffer"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WantToBuyOffer_wantToBuyId_sellerId_key" ON "WantToBuyOffer"("wantToBuyId", "sellerId");

-- AddForeignKey
ALTER TABLE "WantToBuy" ADD CONSTRAINT "WantToBuy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WantToBuy" ADD CONSTRAINT "WantToBuy_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WantToBuyOffer" ADD CONSTRAINT "WantToBuyOffer_wantToBuyId_fkey" FOREIGN KEY ("wantToBuyId") REFERENCES "WantToBuy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WantToBuyOffer" ADD CONSTRAINT "WantToBuyOffer_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WantToBuyOffer" ADD CONSTRAINT "WantToBuyOffer_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;
