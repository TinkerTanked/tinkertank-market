/*
  Warnings:

  - You are about to drop the column `locationId` on the `orders` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "IgniteSubscriptionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CANCELED', 'PAST_DUE', 'TRIALING');

-- DropForeignKey
ALTER TABLE "public"."orders" DROP CONSTRAINT "orders_locationId_fkey";

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "locationId";

-- CreateTable
CREATE TABLE "ignite_subscriptions" (
    "id" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "stripePriceId" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerName" TEXT,
    "igniteSessionId" TEXT,
    "status" "IgniteSubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "weeklyAmount" MONEY NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ignite_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ignite_subscriptions_stripeSubscriptionId_key" ON "ignite_subscriptions"("stripeSubscriptionId");
