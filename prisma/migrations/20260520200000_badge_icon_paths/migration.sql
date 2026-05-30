-- Синхронизация путей иконок с public/badges/*.png
UPDATE "Badge" SET "icon" = '/badges/beginner.png' WHERE "code" = 'BEGINNER';
UPDATE "Badge" SET "icon" = '/badges/pervii.png' WHERE "code" = 'FIRST_STEP';
UPDATE "Badge" SET "icon" = '/badges/verified.png' WHERE "code" = 'VERIFIED';
UPDATE "Badge" SET "icon" = '/badges/active.png' WHERE "code" = 'ACTIVE';
UPDATE "Badge" SET "icon" = '/badges/trusted.png' WHERE "code" = 'TRUSTED';
UPDATE "Badge" SET "icon" = '/badges/safe-deal.png' WHERE "code" = 'SAFE_DEAL';
UPDATE "Badge" SET "icon" = '/badges/pro.png' WHERE "code" = 'PRO';
UPDATE "Badge" SET "icon" = '/badges/premium.png' WHERE "code" = 'PREMIUM';
