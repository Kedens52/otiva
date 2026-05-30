-- Company public profile fields
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "coverUrl" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "shortDescription" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "catalogEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "profileCompleteness" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "companyDeliveryRegions" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "paymentTerms" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "vatType" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "minOrderInfo" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "showPhonePublicly" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "showEmailPublicly" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "showWebsitePublicly" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "showRequisitesPublicly" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "showDocumentsPublicly" BOOLEAN NOT NULL DEFAULT false;

-- BusinessListing pricing & logistics
ALTER TABLE "BusinessListing" ADD COLUMN IF NOT EXISTS "priceFrom" INTEGER;
ALTER TABLE "BusinessListing" ADD COLUMN IF NOT EXISTS "priceTo" INTEGER;
ALTER TABLE "BusinessListing" ADD COLUMN IF NOT EXISTS "priceUnit" TEXT;
ALTER TABLE "BusinessListing" ADD COLUMN IF NOT EXISTS "wholesaleTiers" JSONB;
ALTER TABLE "BusinessListing" ADD COLUMN IF NOT EXISTS "availabilityStatus" TEXT;
ALTER TABLE "BusinessListing" ADD COLUMN IF NOT EXISTS "productionTime" TEXT;
ALTER TABLE "BusinessListing" ADD COLUMN IF NOT EXISTS "deliveryTime" TEXT;
ALTER TABLE "BusinessListing" ADD COLUMN IF NOT EXISTS "pickupAvailable" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "BusinessListing" ADD COLUMN IF NOT EXISTS "deliveryAvailable" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "BusinessListing" ADD COLUMN IF NOT EXISTS "paymentTerms" TEXT;
ALTER TABLE "BusinessListing" ADD COLUMN IF NOT EXISTS "vatType" TEXT;
ALTER TABLE "BusinessListing" ADD COLUMN IF NOT EXISTS "catalogCategoryId" TEXT;

-- Catalog categories
CREATE TABLE IF NOT EXISTS "BusinessCatalogCategory" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BusinessCatalogCategory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "BusinessCatalogCategory_companyId_slug_key" ON "BusinessCatalogCategory"("companyId", "slug");
CREATE INDEX IF NOT EXISTS "BusinessCatalogCategory_companyId_sortOrder_idx" ON "BusinessCatalogCategory"("companyId", "sortOrder");

ALTER TABLE "BusinessListing" ADD CONSTRAINT "BusinessListing_catalogCategoryId_fkey"
  FOREIGN KEY ("catalogCategoryId") REFERENCES "BusinessCatalogCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "BusinessListing_catalogCategoryId_idx" ON "BusinessListing"("catalogCategoryId");

-- Inquiries
CREATE TYPE "BusinessInquiryType" AS ENUM ('PRICE_REQUEST', 'COMMERCIAL_OFFER', 'WHOLESALE_REQUEST', 'PARTNERSHIP', 'CALLBACK');
CREATE TYPE "BusinessInquiryStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'ANSWERED', 'CLOSED', 'SPAM');

CREATE TABLE IF NOT EXISTS "BusinessInquiry" (
    "id" TEXT NOT NULL,
    "fromUserId" TEXT,
    "fromCompanyId" TEXT,
    "toCompanyId" TEXT NOT NULL,
    "businessListingId" TEXT,
    "type" "BusinessInquiryType" NOT NULL DEFAULT 'PRICE_REQUEST',
    "contactName" TEXT,
    "contactCompany" TEXT,
    "quantity" TEXT,
    "city" TEXT,
    "message" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "status" "BusinessInquiryStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BusinessInquiry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "BusinessInquiry_toCompanyId_status_idx" ON "BusinessInquiry"("toCompanyId", "status");
CREATE INDEX IF NOT EXISTS "BusinessInquiry_fromUserId_idx" ON "BusinessInquiry"("fromUserId");
CREATE INDEX IF NOT EXISTS "BusinessInquiry_createdAt_idx" ON "BusinessInquiry"("createdAt" DESC);

ALTER TABLE "BusinessInquiry" ADD CONSTRAINT "BusinessInquiry_fromUserId_fkey"
  FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BusinessInquiry" ADD CONSTRAINT "BusinessInquiry_toCompanyId_fkey"
  FOREIGN KEY ("toCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BusinessInquiry" ADD CONSTRAINT "BusinessInquiry_businessListingId_fkey"
  FOREIGN KEY ("businessListingId") REFERENCES "BusinessListing"("id") ON DELETE SET NULL ON UPDATE CASCADE;
