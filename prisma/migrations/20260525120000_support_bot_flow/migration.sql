DO $$
BEGIN
  ALTER TYPE "SupportWorkflowStatus" ADD VALUE IF NOT EXISTS 'WAITING_USER';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TYPE "SupportWorkflowStatus" ADD VALUE IF NOT EXISTS 'CLOSED';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Conversation"
  ADD COLUMN IF NOT EXISTS "supportTopic" TEXT,
  ADD COLUMN IF NOT EXISTS "supportSubtopic" TEXT,
  ADD COLUMN IF NOT EXISTS "supportListingId" TEXT,
  ADD COLUMN IF NOT EXISTS "supportAdCampaignId" TEXT,
  ADD COLUMN IF NOT EXISTS "supportPriority" TEXT DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS "supportBotState" JSONB;
