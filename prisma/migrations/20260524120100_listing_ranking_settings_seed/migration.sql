INSERT INTO "ListingRankingSettings" ("id", "weights", "updatedAt")
VALUES ('default', '{}'::jsonb, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
