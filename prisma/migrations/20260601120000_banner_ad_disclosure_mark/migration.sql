-- Пометка на баннере: «Реклама» или «Партнёр сервиса»
CREATE TYPE "BannerAdDisclosureMark" AS ENUM ('ad', 'partner');

ALTER TABLE "BannerSlotAd" ADD COLUMN "disclosureMark" "BannerAdDisclosureMark" NOT NULL DEFAULT 'ad';
