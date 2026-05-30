-- CreateEnum
CREATE TYPE "CompanyType" AS ENUM ('IP', 'LLC', 'SELF_EMPLOYED', 'COMPANY', 'OTHER');
CREATE TYPE "BusinessRole" AS ENUM ('SUPPLIER', 'BUYER', 'MANUFACTURER', 'DISTRIBUTOR', 'WHOLESALER', 'SERVICE_PROVIDER', 'INVESTOR', 'FRANCHISOR', 'BUSINESS_SELLER', 'BUSINESS_BUYER');
CREATE TYPE "CompanyVerificationStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'VERIFIED', 'REJECTED', 'BLOCKED');
CREATE TYPE "CompanyMemberRole" AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'SALES', 'SUPPORT', 'VIEWER');
CREATE TYPE "BusinessListingType" AS ENUM ('WHOLESALE_OFFER', 'SUPPLY', 'BUSINESS_FOR_SALE', 'FRANCHISE', 'EQUIPMENT', 'COMMERCIAL_REAL_ESTATE', 'SERVICE_FOR_BUSINESS', 'PROCUREMENT_REQUEST', 'PARTNERSHIP', 'INVESTMENT');
CREATE TYPE "BusinessListingStatus" AS ENUM ('DRAFT', 'PENDING', 'ACTIVE', 'REJECTED', 'PAUSED', 'ARCHIVED', 'BLOCKED');
CREATE TYPE "BusinessRequestStatus" AS ENUM ('DRAFT', 'PENDING', 'ACTIVE', 'CLOSED', 'ARCHIVED', 'BLOCKED');

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "inn" TEXT,
    "ogrn" TEXT,
    "kpp" TEXT,
    "companyType" "CompanyType" NOT NULL DEFAULT 'LLC',
    "businessRole" "BusinessRole" NOT NULL DEFAULT 'SUPPLIER',
    "industry" TEXT,
    "description" TEXT,
    "region" TEXT,
    "city" TEXT,
    "address" TEXT,
    "websiteUrl" TEXT,
    "vkUrl" TEXT,
    "maxUrl" TEXT,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "contactRole" TEXT,
    "verificationStatus" "CompanyVerificationStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "trustStatus" TEXT NOT NULL DEFAULT 'NORMAL',
    "rejectionReason" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "publicSlug" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CompanyMember" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "CompanyMemberRole" NOT NULL DEFAULT 'VIEWER',
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "CompanyMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BusinessListing" (
    "id" TEXT NOT NULL,
    "slug" TEXT,
    "companyId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "type" "BusinessListingType" NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" INTEGER NOT NULL DEFAULT 0,
    "priceType" TEXT NOT NULL DEFAULT 'FIXED',
    "minOrderQuantity" INTEGER,
    "wholesalePrice" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'RUB',
    "region" TEXT,
    "city" TEXT,
    "deliveryRegions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "documents" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "attributes" JSONB,
    "status" "BusinessListingStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "isPromoted" BOOLEAN NOT NULL DEFAULT false,
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessListing_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BusinessRequest" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "quantity" TEXT,
    "budgetFrom" INTEGER,
    "budgetTo" INTEGER,
    "region" TEXT,
    "city" TEXT,
    "deadline" TIMESTAMP(3),
    "status" "BusinessRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_publicSlug_key" ON "Company"("publicSlug");
CREATE INDEX "Company_ownerId_idx" ON "Company"("ownerId");
CREATE INDEX "Company_verificationStatus_idx" ON "Company"("verificationStatus");
CREATE INDEX "Company_inn_idx" ON "Company"("inn");
CREATE INDEX "Company_isPublic_verificationStatus_idx" ON "Company"("isPublic", "verificationStatus");

CREATE UNIQUE INDEX "CompanyMember_companyId_userId_key" ON "CompanyMember"("companyId", "userId");
CREATE INDEX "CompanyMember_userId_idx" ON "CompanyMember"("userId");

CREATE UNIQUE INDEX "BusinessListing_slug_key" ON "BusinessListing"("slug");
CREATE INDEX "BusinessListing_companyId_idx" ON "BusinessListing"("companyId");
CREATE INDEX "BusinessListing_ownerId_idx" ON "BusinessListing"("ownerId");
CREATE INDEX "BusinessListing_status_type_idx" ON "BusinessListing"("status", "type");
CREATE INDEX "BusinessListing_category_city_idx" ON "BusinessListing"("category", "city");
CREATE INDEX "BusinessListing_createdAt_idx" ON "BusinessListing"("createdAt" DESC);

CREATE INDEX "BusinessRequest_companyId_idx" ON "BusinessRequest"("companyId");
CREATE INDEX "BusinessRequest_status_idx" ON "BusinessRequest"("status");

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompanyMember" ADD CONSTRAINT "CompanyMember_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompanyMember" ADD CONSTRAINT "CompanyMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BusinessListing" ADD CONSTRAINT "BusinessListing_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BusinessRequest" ADD CONSTRAINT "BusinessRequest_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
