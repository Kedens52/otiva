-- Idempotent: safe after failed runs that left enum or partial columns.

DO $$
BEGIN
  CREATE TYPE "SupportWorkflowStatus" AS ENUM ('ACTIVE', 'WAITING_OPERATOR', 'RESOLVED_AUTO');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Conversation"
  ADD COLUMN IF NOT EXISTS "supportWorkflowStatus" "SupportWorkflowStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS "operatorNeeded" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "lastAutoReplyCatalogId" TEXT,
  ADD COLUMN IF NOT EXISTS "lastAutoReplyAction" TEXT;

CREATE INDEX IF NOT EXISTS "Conversation_supportWorkflowStatus_idx" ON "Conversation"("supportWorkflowStatus");

ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "supportPayload" JSONB;
