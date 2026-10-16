-- Scheduled cancellation and pause resume dates mirrored from Stripe for admin display.
ALTER TABLE "ignite_subscriptions" ADD COLUMN "cancelAt" TIMESTAMP(3);
ALTER TABLE "ignite_subscriptions" ADD COLUMN "pauseResumesAt" TIMESTAMP(3);
