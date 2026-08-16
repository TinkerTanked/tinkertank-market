ALTER TABLE "locations"
ALTER COLUMN "capacity" SET DEFAULT 35;

UPDATE "locations"
SET "capacity" = 35
WHERE "name" IN ('Neutral Bay', 'TinkerTank Neutral Bay', 'Manly Library');
