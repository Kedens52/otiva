-- AlterTable User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "publicSlug" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "User_publicSlug_key" ON "User"("publicSlug");

-- AlterTable Listing
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "slug" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Listing_slug_key" ON "Listing"("slug");

-- AlterTable Category
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "seoTitle" TEXT;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "seoDescription" TEXT;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "h1" TEXT;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "seoText" TEXT;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "canonicalUrl" TEXT;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "indexable" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "sitemapPriority" DOUBLE PRECISION NOT NULL DEFAULT 0.7;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "sitemapChangefreq" TEXT NOT NULL DEFAULT 'weekly';
CREATE INDEX IF NOT EXISTS "Category_indexable_idx" ON "Category"("indexable");

-- CreateTable SeoLanding
CREATE TABLE IF NOT EXISTS "SeoLanding" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "h1" TEXT,
    "seoText" TEXT,
    "canonicalUrl" TEXT,
    "indexable" BOOLEAN NOT NULL DEFAULT true,
    "categorySlug" TEXT,
    "internalCategorySlug" TEXT,
    "city" TEXT,
    "fixedParams" JSONB,
    "sitemapPriority" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "sitemapChangefreq" TEXT NOT NULL DEFAULT 'weekly',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeoLanding_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SeoLanding_slug_key" ON "SeoLanding"("slug");
CREATE INDEX IF NOT EXISTS "SeoLanding_indexable_idx" ON "SeoLanding"("indexable");
