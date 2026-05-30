-- Admin panel: staff accounts, sessions, audit, site banners, business CRM

DO $$ BEGIN
  CREATE TYPE "StaffRole" AS ENUM ('OWNER', 'ADMIN', 'MODERATOR', 'SUPPORT', 'BUSINESS_MANAGER', 'FINANCE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "StaffStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'REVOKED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "BusinessClientStatus" AS ENUM ('NEW', 'CONTACTED', 'NEGOTIATING', 'ACTIVE_CLIENT', 'PAUSED', 'LOST');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "BusinessDealStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'WON', 'LOST', 'ON_HOLD');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "StaffAccount" (
    "id" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "displayName" TEXT,
    "role" "StaffRole" NOT NULL,
    "status" "StaffStatus" NOT NULL DEFAULT 'ACTIVE',
    "codeHash" TEXT NOT NULL,
    "codeChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "lastLoginIp" TEXT,
    "lastUserAgent" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "StaffAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "StaffAccount_login_key" ON "StaffAccount"("login");
CREATE INDEX IF NOT EXISTS "StaffAccount_role_status_idx" ON "StaffAccount"("role", "status");
CREATE INDEX IF NOT EXISTS "StaffAccount_status_idx" ON "StaffAccount"("status");

CREATE TABLE IF NOT EXISTS "AdminSession" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AdminSession_tokenHash_key" ON "AdminSession"("tokenHash");
CREATE INDEX IF NOT EXISTS "AdminSession_staffId_idx" ON "AdminSession"("staffId");
CREATE INDEX IF NOT EXISTS "AdminSession_expiresAt_idx" ON "AdminSession"("expiresAt");
CREATE INDEX IF NOT EXISTS "AdminSession_lastUsedAt_idx" ON "AdminSession"("lastUsedAt");

CREATE TABLE IF NOT EXISTS "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "metadata" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AdminAuditLog_actorId_createdAt_idx" ON "AdminAuditLog"("actorId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "AdminAuditLog_action_createdAt_idx" ON "AdminAuditLog"("action", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt" DESC);

CREATE TABLE IF NOT EXISTS "SiteBanner" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "linkText" TEXT,
    "href" TEXT NOT NULL DEFAULT '/',
    "image" TEXT,
    "bgFrom" TEXT NOT NULL DEFAULT '#bbf7d0',
    "bgTo" TEXT NOT NULL DEFAULT '#bae6fd',
    "active" BOOLEAN NOT NULL DEFAULT false,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteBanner_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SiteBanner_active_idx" ON "SiteBanner"("active");
CREATE INDEX IF NOT EXISTS "SiteBanner_createdAt_idx" ON "SiteBanner"("createdAt");

CREATE TABLE IF NOT EXISTS "BusinessClient" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "inn" TEXT,
    "ogrn" TEXT,
    "category" TEXT,
    "contactName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "city" TEXT,
    "website" TEXT,
    "source" TEXT,
    "status" "BusinessClientStatus" NOT NULL DEFAULT 'NEW',
    "assignedManagerId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessClient_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "BusinessClient_assignedManagerId_idx" ON "BusinessClient"("assignedManagerId");
CREATE INDEX IF NOT EXISTS "BusinessClient_status_idx" ON "BusinessClient"("status");
CREATE INDEX IF NOT EXISTS "BusinessClient_createdAt_idx" ON "BusinessClient"("createdAt" DESC);

CREATE TABLE IF NOT EXISTS "BusinessDeal" (
    "id" TEXT NOT NULL,
    "businessClientId" TEXT NOT NULL,
    "managerId" TEXT,
    "title" TEXT NOT NULL,
    "status" "BusinessDealStatus" NOT NULL DEFAULT 'NEW',
    "amount" INTEGER,
    "packageName" TEXT,
    "nextContactAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessDeal_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "BusinessDeal_managerId_status_idx" ON "BusinessDeal"("managerId", "status");
CREATE INDEX IF NOT EXISTS "BusinessDeal_nextContactAt_idx" ON "BusinessDeal"("nextContactAt");
CREATE INDEX IF NOT EXISTS "BusinessDeal_businessClientId_idx" ON "BusinessDeal"("businessClientId");

CREATE TABLE IF NOT EXISTS "BusinessNote" (
    "id" TEXT NOT NULL,
    "businessClientId" TEXT NOT NULL,
    "authorId" TEXT,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessNote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "BusinessNote_businessClientId_createdAt_idx" ON "BusinessNote"("businessClientId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "BusinessNote_authorId_idx" ON "BusinessNote"("authorId");

ALTER TABLE "ModerationLog" ADD COLUMN IF NOT EXISTS "staffId" TEXT;
CREATE INDEX IF NOT EXISTS "ModerationLog_staffId_idx" ON "ModerationLog"("staffId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AdminSession_staffId_fkey') THEN
    ALTER TABLE "AdminSession" ADD CONSTRAINT "AdminSession_staffId_fkey"
      FOREIGN KEY ("staffId") REFERENCES "StaffAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AdminAuditLog_actorId_fkey') THEN
    ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_actorId_fkey"
      FOREIGN KEY ("actorId") REFERENCES "StaffAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BusinessClient_assignedManagerId_fkey') THEN
    ALTER TABLE "BusinessClient" ADD CONSTRAINT "BusinessClient_assignedManagerId_fkey"
      FOREIGN KEY ("assignedManagerId") REFERENCES "StaffAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BusinessDeal_businessClientId_fkey') THEN
    ALTER TABLE "BusinessDeal" ADD CONSTRAINT "BusinessDeal_businessClientId_fkey"
      FOREIGN KEY ("businessClientId") REFERENCES "BusinessClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BusinessDeal_managerId_fkey') THEN
    ALTER TABLE "BusinessDeal" ADD CONSTRAINT "BusinessDeal_managerId_fkey"
      FOREIGN KEY ("managerId") REFERENCES "StaffAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BusinessNote_businessClientId_fkey') THEN
    ALTER TABLE "BusinessNote" ADD CONSTRAINT "BusinessNote_businessClientId_fkey"
      FOREIGN KEY ("businessClientId") REFERENCES "BusinessClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BusinessNote_authorId_fkey') THEN
    ALTER TABLE "BusinessNote" ADD CONSTRAINT "BusinessNote_authorId_fkey"
      FOREIGN KEY ("authorId") REFERENCES "StaffAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ModerationLog_staffId_fkey') THEN
    ALTER TABLE "ModerationLog" ADD CONSTRAINT "ModerationLog_staffId_fkey"
      FOREIGN KEY ("staffId") REFERENCES "StaffAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
