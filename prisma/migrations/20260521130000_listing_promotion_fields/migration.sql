-- Поля продвижения объявлений (были в schema.prisma без миграции → 500 на /api/listings)
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "isPromoted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "promotedUntil" TIMESTAMP(3);
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "highlightedUntil" TIMESTAMP(3);
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "recommendedUntil" TIMESTAMP(3);
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "autoboostUntil" TIMESTAMP(3);
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "pinnedUntil" TIMESTAMP(3);
