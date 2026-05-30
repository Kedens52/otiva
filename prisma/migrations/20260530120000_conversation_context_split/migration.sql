-- CreateEnum
CREATE TYPE "ConversationType" AS ENUM ('PERSONAL', 'BUSINESS', 'SUPPORT');
CREATE TYPE "ConversationContextType" AS ENUM ('LISTING', 'BUSINESS_LISTING', 'BUSINESS_REQUEST', 'BUSINESS_INQUIRY', 'SUPPORT_TICKET', 'DIRECT');
CREATE TYPE "MessageSenderType" AS ENUM ('USER', 'COMPANY', 'SUPPORT');

-- AlterTable Conversation
ALTER TABLE "Conversation" ADD COLUMN "conversationType" "ConversationType" NOT NULL DEFAULT 'PERSONAL';
ALTER TABLE "Conversation" ADD COLUMN "contextType" "ConversationContextType" NOT NULL DEFAULT 'DIRECT';
ALTER TABLE "Conversation" ADD COLUMN "companyId" TEXT;
ALTER TABLE "Conversation" ADD COLUMN "businessListingId" TEXT;
ALTER TABLE "Conversation" ADD COLUMN "businessRequestId" TEXT;
ALTER TABLE "Conversation" ADD COLUMN "businessInquiryId" TEXT;

-- AlterTable Message
ALTER TABLE "Message" ADD COLUMN "senderType" "MessageSenderType" NOT NULL DEFAULT 'USER';
ALTER TABLE "Message" ADD COLUMN "senderCompanyId" TEXT;

-- Migrate existing rows
UPDATE "Conversation" SET "conversationType" = 'SUPPORT', "contextType" = 'SUPPORT_TICKET' WHERE "isSupport" = true;
UPDATE "Conversation" SET "contextType" = 'LISTING' WHERE "listingId" IS NOT NULL AND "isSupport" = false;

-- Foreign keys
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_businessListingId_fkey" FOREIGN KEY ("businessListingId") REFERENCES "BusinessListing"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_businessRequestId_fkey" FOREIGN KEY ("businessRequestId") REFERENCES "BusinessRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_businessInquiryId_fkey" FOREIGN KEY ("businessInquiryId") REFERENCES "BusinessInquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Indexes
CREATE INDEX "Conversation_companyId_idx" ON "Conversation"("companyId");
CREATE INDEX "Conversation_businessListingId_idx" ON "Conversation"("businessListingId");
CREATE INDEX "Conversation_conversationType_idx" ON "Conversation"("conversationType");
CREATE UNIQUE INDEX "Conversation_businessInquiryId_key" ON "Conversation"("businessInquiryId");
CREATE INDEX "Message_senderCompanyId_idx" ON "Message"("senderCompanyId");
