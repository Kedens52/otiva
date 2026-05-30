CREATE TABLE "SupportOperatorQuickReply" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdByStaffId" TEXT,
    "updatedByStaffId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportOperatorQuickReply_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SupportQuickReplyUsage" (
    "id" TEXT NOT NULL,
    "quickReplyId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "wasEdited" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportQuickReplyUsage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SupportOperatorQuickReply_category_active_sortOrder_idx" ON "SupportOperatorQuickReply"("category", "active", "sortOrder");
CREATE INDEX "SupportOperatorQuickReply_active_isFavorite_idx" ON "SupportOperatorQuickReply"("active", "isFavorite");
CREATE INDEX "SupportQuickReplyUsage_quickReplyId_createdAt_idx" ON "SupportQuickReplyUsage"("quickReplyId", "createdAt" DESC);
CREATE INDEX "SupportQuickReplyUsage_conversationId_createdAt_idx" ON "SupportQuickReplyUsage"("conversationId", "createdAt" DESC);
CREATE INDEX "SupportQuickReplyUsage_staffId_createdAt_idx" ON "SupportQuickReplyUsage"("staffId", "createdAt" DESC);

ALTER TABLE "SupportQuickReplyUsage" ADD CONSTRAINT "SupportQuickReplyUsage_quickReplyId_fkey" FOREIGN KEY ("quickReplyId") REFERENCES "SupportOperatorQuickReply"("id") ON DELETE CASCADE ON UPDATE CASCADE;
