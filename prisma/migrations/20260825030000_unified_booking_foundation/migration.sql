-- Expand-only migration for the unified booking flow. All columns are nullable
-- so existing orders, students and rolling application deployments remain valid.
ALTER TABLE "students"
ADD COLUMN "firstName" TEXT,
ADD COLUMN "lastName" TEXT;

ALTER TABLE "orders"
ADD COLUMN "customerFirstName" TEXT,
ADD COLUMN "customerLastName" TEXT,
ADD COLUMN "customerPhone" TEXT,
ADD COLUMN "emergencyContactName" TEXT,
ADD COLUMN "emergencyContactPhone" TEXT,
ADD COLUMN "emergencyContactRelationship" TEXT,
ADD COLUMN "bookingSchemaVersion" INTEGER;

CREATE TABLE "booking_drafts" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_drafts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "booking_drafts_tokenHash_key" ON "booking_drafts"("tokenHash");
CREATE INDEX "booking_drafts_expiresAt_idx" ON "booking_drafts"("expiresAt");
