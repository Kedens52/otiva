-- Listing: модерация «на доработку», актуальность недвижимости
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "moderationReasonCode" TEXT;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "returnedForRevision" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "freshnessConfirmedAt" TIMESTAMP(3);

-- Review: модерация спорных отзывов
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "reviewModerationState" TEXT NOT NULL DEFAULT 'PUBLISHED';
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "disputedAt" TIMESTAMP(3);

-- User: внутренний trust/risk (цифры не показываем пользователю)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "trustTier" TEXT NOT NULL DEFAULT 'NORMAL';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "internalTrustScore" DOUBLE PRECISION NOT NULL DEFAULT 50;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "riskPenaltyScore" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avgResponseMinutes" INTEGER;

-- Report: жалоба на пользователя без объявления
ALTER TABLE "Report" ADD COLUMN IF NOT EXISTS "targetUserId" TEXT;
ALTER TABLE "Report" ADD COLUMN IF NOT EXISTS "reportCategory" TEXT;
ALTER TABLE "Report" ALTER COLUMN "listingId" DROP NOT NULL;

CREATE INDEX IF NOT EXISTS "Report_targetUserId_idx" ON "Report"("targetUserId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Report_targetUserId_fkey'
  ) THEN
    ALTER TABLE "Report" ADD CONSTRAINT "Report_targetUserId_fkey"
      FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
