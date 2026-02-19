-- CreateTable
CREATE TABLE "ignite_subscription_students" (
    "id" TEXT NOT NULL,
    "igniteSubscriptionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ignite_subscription_students_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ignite_subscription_students_igniteSubscriptionId_studentId_key" ON "ignite_subscription_students"("igniteSubscriptionId", "studentId");

-- AddForeignKey
ALTER TABLE "ignite_subscription_students" ADD CONSTRAINT "ignite_subscription_students_igniteSubscriptionId_fkey" FOREIGN KEY ("igniteSubscriptionId") REFERENCES "ignite_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ignite_subscription_students" ADD CONSTRAINT "ignite_subscription_students_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
