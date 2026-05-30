-- CreateEnum
CREATE TYPE "BadgeCode" AS ENUM ('BEGINNER', 'VERIFIED', 'ACTIVE', 'TRUSTED', 'PRO', 'SAFE_DEAL', 'PREMIUM');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "lastSeenAt" TIMESTAMP(3),
ADD COLUMN "premiumUntil" TIMESTAMP(3),
ADD COLUMN "safeDealEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "manuallyVerified" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Badge" (
    "id" TEXT NOT NULL,
    "code" "BadgeCode" NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBadge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "issuedBy" TEXT NOT NULL DEFAULT 'system',
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Badge_code_key" ON "Badge"("code");

-- CreateIndex
CREATE UNIQUE INDEX "UserBadge_userId_badgeId_key" ON "UserBadge"("userId", "badgeId");

-- CreateIndex
CREATE INDEX "UserBadge_userId_idx" ON "UserBadge"("userId");

-- CreateIndex
CREATE INDEX "UserBadge_badgeId_idx" ON "UserBadge"("badgeId");

-- CreateIndex
CREATE INDEX "UserBadge_expiresAt_idx" ON "UserBadge"("expiresAt");

-- CreateIndex
CREATE INDEX "User_premiumUntil_idx" ON "User"("premiumUntil");

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "Badge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed badges
INSERT INTO "Badge" ("id", "code", "title", "subtitle", "description", "icon", "priority", "isActive", "updatedAt") VALUES
('badge_beginner', 'BEGINNER', 'В начале пути', 'Вы недавно с нами', 'Пользователь недавно зарегистрировался на Нашло и только начинает пользоваться платформой.', '/badges/beginner.svg', 1, true, CURRENT_TIMESTAMP),
('badge_verified', 'VERIFIED', 'Проверен', 'Данные подтверждены', 'Пользователь подтвердил контактные данные.', '/badges/verified.svg', 10, true, CURRENT_TIMESTAMP),
('badge_active', 'ACTIVE', 'Активный', 'Быстро отвечает', 'Пользователь часто заходит на сайт, быстро отвечает и поддерживает объявления актуальными.', '/badges/active.svg', 20, true, CURRENT_TIMESTAMP),
('badge_trusted', 'TRUSTED', 'Надёжный', 'Хорошая история', 'У пользователя хорошая история, высокий рейтинг и нет жалоб.', '/badges/trusted.svg', 30, true, CURRENT_TIMESTAMP),
('badge_safe_deal', 'SAFE_DEAL', 'Безопасная сделка', 'Оплата защищена', 'Пользователь принимает оплату через безопасную сделку Нашло.', '/badges/safe-deal.svg', 35, true, CURRENT_TIMESTAMP),
('badge_pro', 'PRO', 'Профи', 'Проверенный специалист', 'Профиль прошёл дополнительную проверку Нашло.', '/badges/pro.svg', 40, true, CURRENT_TIMESTAMP),
('badge_premium', 'PREMIUM', 'Премиум', 'Усиленный профиль', 'У пользователя активен премиум-статус.', '/badges/premium.svg', 50, true, CURRENT_TIMESTAMP);
