-- CreateTable
CREATE TABLE "camp_credits" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "amount" MONEY NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerName" TEXT,
    "bookingId" TEXT NOT NULL,
    "stripeCouponId" TEXT NOT NULL,
    "stripePromotionCodeId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "redeemedAt" TIMESTAMP(3),
    "redeemedOrderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "camp_credits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "camp_credits_code_key" ON "camp_credits"("code");

-- CreateIndex
CREATE UNIQUE INDEX "camp_credits_bookingId_key" ON "camp_credits"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "camp_credits_stripePromotionCodeId_key" ON "camp_credits"("stripePromotionCodeId");

-- CreateIndex
CREATE INDEX "camp_credits_customerEmail_idx" ON "camp_credits"("customerEmail");

-- AddForeignKey
ALTER TABLE "camp_credits" ADD CONSTRAINT "camp_credits_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
