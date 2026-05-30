-- CreateEnum
CREATE TYPE "CookieConsentChoice" AS ENUM ('ANALYTICS_ACCEPTED', 'ESSENTIAL_ONLY');

-- CreateTable
CREATE TABLE "CookieConsentEvent" (
    "id" TEXT NOT NULL,
    "choice" "CookieConsentChoice" NOT NULL,
    "source" TEXT NOT NULL,
    "userId" TEXT,
    "visitorId" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CookieConsentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CookieConsentEvent_createdAt_idx" ON "CookieConsentEvent"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "CookieConsentEvent_choice_createdAt_idx" ON "CookieConsentEvent"("choice", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "CookieConsentEvent_userId_idx" ON "CookieConsentEvent"("userId");

-- AddForeignKey
ALTER TABLE "CookieConsentEvent" ADD CONSTRAINT "CookieConsentEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
