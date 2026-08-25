-- Keep server-owned Stripe prices aligned with the prices displayed throughout
-- the camp booking and landing pages.
UPDATE "products"
SET "price" = CASE "id"
    WHEN 'day-camp' THEN '119.99'::money
    WHEN 'all-day-camp' THEN '149.99'::money
    WHEN 'day-camp-3day-bundle' THEN '299.99'::money
    WHEN 'all-day-camp-3day-bundle' THEN '399.99'::money
END
WHERE "id" IN (
    'day-camp',
    'all-day-camp',
    'day-camp-3day-bundle',
    'all-day-camp-3day-bundle'
);
