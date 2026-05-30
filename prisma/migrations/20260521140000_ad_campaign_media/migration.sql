-- CreateEnum
CREATE TYPE "AdMediaType" AS ENUM ('NONE', 'IMAGE', 'GIF', 'VIDEO');

-- AlterTable
ALTER TABLE "AdCampaign" ADD COLUMN IF NOT EXISTS "mediaType" "AdMediaType" NOT NULL DEFAULT 'NONE';
ALTER TABLE "AdCampaign" ADD COLUMN IF NOT EXISTS "mediaUrl" TEXT;
ALTER TABLE "AdCampaign" ADD COLUMN IF NOT EXISTS "mediaPosterUrl" TEXT;
ALTER TABLE "AdCampaign" ADD COLUMN IF NOT EXISTS "mediaAlt" TEXT;
ALTER TABLE "AdCampaign" ADD COLUMN IF NOT EXISTS "mediaWidth" INTEGER;
ALTER TABLE "AdCampaign" ADD COLUMN IF NOT EXISTS "mediaHeight" INTEGER;
ALTER TABLE "AdCampaign" ADD COLUMN IF NOT EXISTS "mediaDuration" INTEGER;
ALTER TABLE "AdCampaign" ADD COLUMN IF NOT EXISTS "mediaSize" INTEGER;
ALTER TABLE "AdCampaign" ADD COLUMN IF NOT EXISTS "mediaMimeType" TEXT;

-- Legacy imageUrl → media (только если media ещё не задано)
UPDATE "AdCampaign"
SET
  "mediaType" = 'IMAGE',
  "mediaUrl" = "imageUrl",
  "mediaMimeType" = 'image/jpeg'
WHERE "imageUrl" IS NOT NULL
  AND TRIM("imageUrl") <> ''
  AND ("mediaUrl" IS NULL OR TRIM("mediaUrl") = '')
  AND "mediaType" = 'NONE';

-- AdEventType: события медиа (для аналитики, опционально)
ALTER TYPE "AdEventType" ADD VALUE IF NOT EXISTS 'MEDIA_LOADED';
ALTER TYPE "AdEventType" ADD VALUE IF NOT EXISTS 'VIDEO_PLAY';
ALTER TYPE "AdEventType" ADD VALUE IF NOT EXISTS 'VIDEO_COMPLETE';
