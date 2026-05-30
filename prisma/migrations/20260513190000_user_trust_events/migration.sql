-- Внутренний рейтинг: причины расчёта, мягкое ограничение аккаунта, журнал событий
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "trustReasons" JSONB;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "riskReasons" JSONB;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastTrustCalculatedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "accountRestricted" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "UserTrustEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "scoreDelta" INTEGER,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserTrustEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "UserTrustEvent_userId_createdAt_idx" ON "UserTrustEvent"("userId", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'UserTrustEvent_userId_fkey'
  ) THEN
    ALTER TABLE "UserTrustEvent" ADD CONSTRAINT "UserTrustEvent_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
