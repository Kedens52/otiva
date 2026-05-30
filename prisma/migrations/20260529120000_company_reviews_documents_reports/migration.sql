-- Company documents & reviews
CREATE TYPE "CompanyDocumentType" AS ENUM ('CERTIFICATE', 'LICENSE', 'PRICE_LIST', 'PRESENTATION', 'OTHER');
CREATE TYPE "CompanyReviewStatus" AS ENUM ('PENDING', 'PUBLISHED', 'HIDDEN');

CREATE TABLE IF NOT EXISTS "CompanyDocument" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "docType" "CompanyDocumentType" NOT NULL DEFAULT 'OTHER',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CompanyDocument_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CompanyDocument_companyId_isPublic_idx" ON "CompanyDocument"("companyId", "isPublic");

ALTER TABLE "CompanyDocument" ADD CONSTRAINT "CompanyDocument_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "CompanyReview" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "status" "CompanyReviewStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CompanyReview_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CompanyReview_companyId_authorId_key" ON "CompanyReview"("companyId", "authorId");
CREATE INDEX IF NOT EXISTS "CompanyReview_companyId_status_idx" ON "CompanyReview"("companyId", "status");

ALTER TABLE "CompanyReview" ADD CONSTRAINT "CompanyReview_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompanyReview" ADD CONSTRAINT "CompanyReview_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- B2B reports
ALTER TABLE "Report" ADD COLUMN IF NOT EXISTS "companyId" TEXT;
ALTER TABLE "Report" ADD COLUMN IF NOT EXISTS "businessListingId" TEXT;

CREATE INDEX IF NOT EXISTS "Report_companyId_idx" ON "Report"("companyId");
CREATE INDEX IF NOT EXISTS "Report_businessListingId_idx" ON "Report"("businessListingId");

ALTER TABLE "Report" ADD CONSTRAINT "Report_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Report" ADD CONSTRAINT "Report_businessListingId_fkey"
  FOREIGN KEY ("businessListingId") REFERENCES "BusinessListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
