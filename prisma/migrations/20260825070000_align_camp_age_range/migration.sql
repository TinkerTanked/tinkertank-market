-- Camp marketing and booking have consistently supported ages 6–16. Keep the
-- server-owned product rules aligned so valid teenagers are not blocked at checkout.
UPDATE "products"
SET "ageMin" = 6,
    "ageMax" = 16
WHERE "id" IN (
    'day-camp',
    'all-day-camp',
    'day-camp-3day-bundle',
    'all-day-camp-3day-bundle'
);
