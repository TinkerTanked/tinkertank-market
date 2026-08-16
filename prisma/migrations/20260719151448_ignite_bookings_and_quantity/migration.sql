-- Add per-child Stripe quantity to Ignite subscriptions
ALTER TABLE "ignite_subscriptions" ADD COLUMN "quantity" INTEGER NOT NULL DEFAULT 1;

-- Link bookings to their Ignite subscription (null for camp/birthday bookings)
ALTER TABLE "bookings" ADD COLUMN "igniteSubscriptionId" TEXT;

-- One Ignite booking per subscription + student + session date.
-- Existing camp/birthday rows have NULL igniteSubscriptionId; Postgres treats
-- NULLs as distinct so those rows are unaffected by this unique constraint.
CREATE UNIQUE INDEX "bookings_igniteSubscriptionId_studentId_startDate_key" ON "bookings"("igniteSubscriptionId", "studentId", "startDate");

CREATE INDEX "bookings_startDate_status_idx" ON "bookings"("startDate", "status");

ALTER TABLE "bookings" ADD CONSTRAINT "bookings_igniteSubscriptionId_fkey" FOREIGN KEY ("igniteSubscriptionId") REFERENCES "ignite_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
