CREATE TABLE "ListingRankingSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "weights" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListingRankingSettings_pkey" PRIMARY KEY ("id")
);
