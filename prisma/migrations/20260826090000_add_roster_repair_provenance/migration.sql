-- Preserve whether a student's date of birth is a temporary estimate.
ALTER TABLE "students" ADD COLUMN "birthdateEstimated" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "students" ADD COLUMN "importReference" TEXT;
CREATE UNIQUE INDEX "students_importReference_key" ON "students"("importReference");

-- Distinguish intentional roster overrides (invoice/complimentary/paused billing)
-- from stale standalone subscription bookings.
ALTER TABLE "bookings" ADD COLUMN "rosterOverride" BOOLEAN NOT NULL DEFAULT false;
