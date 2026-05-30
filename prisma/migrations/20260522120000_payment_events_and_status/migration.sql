-- PaymentStatus enum + PaymentEvent + payment timestamps
CREATE TYPE "PaymentStatus" AS ENUM (
  'CREATED',
  'PENDING',
  'SUCCEEDED',
  'CANCELED',
  'FAILED',
  'REFUNDED',
  'PARTIAL_REFUNDED'
);

ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "canceledAt" TIMESTAMP(3);
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "refundedAt" TIMESTAMP(3);

ALTER TABLE "Payment" ADD COLUMN "status_new" "PaymentStatus";

UPDATE "Payment" SET "status_new" = CASE
  WHEN LOWER("status") IN ('paid', 'succeeded', 'confirmed') THEN 'SUCCEEDED'::"PaymentStatus"
  WHEN LOWER("status") IN ('failed', 'rejected') THEN 'FAILED'::"PaymentStatus"
  WHEN LOWER("status") IN ('cancelled', 'canceled', 'reversed') THEN 'CANCELED'::"PaymentStatus"
  WHEN LOWER("status") = 'refunded' THEN 'REFUNDED'::"PaymentStatus"
  WHEN LOWER("status") = 'partial_refunded' THEN 'PARTIAL_REFUNDED'::"PaymentStatus"
  WHEN LOWER("status") = 'created' THEN 'CREATED'::"PaymentStatus"
  ELSE 'PENDING'::"PaymentStatus"
END;

ALTER TABLE "Payment" DROP COLUMN "status";
ALTER TABLE "Payment" RENAME COLUMN "status_new" TO "status";
ALTER TABLE "Payment" ALTER COLUMN "status" SET DEFAULT 'PENDING'::"PaymentStatus";
ALTER TABLE "Payment" ALTER COLUMN "status" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Payment_tbankPaymentId_key" ON "Payment"("tbankPaymentId");

CREATE TABLE "PaymentEvent" (
  "id" TEXT NOT NULL,
  "paymentId" TEXT NOT NULL,
  "providerEventId" TEXT,
  "rawEventHash" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaymentEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PaymentEvent_paymentId_rawEventHash_key" ON "PaymentEvent"("paymentId", "rawEventHash");
CREATE INDEX "PaymentEvent_paymentId_createdAt_idx" ON "PaymentEvent"("paymentId", "createdAt" DESC);
CREATE INDEX "PaymentEvent_providerEventId_idx" ON "PaymentEvent"("providerEventId");

ALTER TABLE "PaymentEvent" ADD CONSTRAINT "PaymentEvent_paymentId_fkey"
  FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
