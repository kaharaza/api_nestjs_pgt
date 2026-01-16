-- CreateEnum
CREATE TYPE "PricingTier" AS ENUM ('EARLY', 'REGULAR');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "TransferSlipStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "PGT_Project_Registration" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "totalAmount" INTEGER NOT NULL DEFAULT 0,
    "discountAmount" INTEGER NOT NULL DEFAULT 0,
    "pricingTier" "PricingTier" NOT NULL,
    "packageName" TEXT,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "transferSlipUrl" TEXT,
    "transferSlipStatus" "TransferSlipStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "PGT_Project_Registration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PGT_Project_RegistrationItem" (
    "id" SERIAL NOT NULL,
    "registrationId" INTEGER NOT NULL,
    "activityId" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "pricingTier" "PricingTier" NOT NULL,
    "unitPriceSnapshot" INTEGER NOT NULL,
    "lineAmount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PGT_Project_RegistrationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PGT_Payment" (
    "id" SERIAL NOT NULL,
    "registrationId" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "slipUrl" TEXT,
    "slipStatus" "TransferSlipStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PGT_Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PGT_Project_Registration_projectId_userId_idx" ON "PGT_Project_Registration"("projectId", "userId");

-- CreateIndex
CREATE INDEX "PGT_Project_Registration_paymentStatus_idx" ON "PGT_Project_Registration"("paymentStatus");

-- CreateIndex
CREATE INDEX "PGT_Project_Registration_createdAt_idx" ON "PGT_Project_Registration"("createdAt");

-- CreateIndex
CREATE INDEX "PGT_Project_RegistrationItem_registrationId_idx" ON "PGT_Project_RegistrationItem"("registrationId");

-- CreateIndex
CREATE INDEX "PGT_Project_RegistrationItem_activityId_idx" ON "PGT_Project_RegistrationItem"("activityId");

-- CreateIndex
CREATE INDEX "PGT_Payment_registrationId_idx" ON "PGT_Payment"("registrationId");

-- CreateIndex
CREATE INDEX "PGT_Payment_status_idx" ON "PGT_Payment"("status");

-- CreateIndex
CREATE INDEX "PGT_Project_Activity_projectId_type_idx" ON "PGT_Project_Activity"("projectId", "type");

-- CreateIndex
CREATE INDEX "PGT_Register_Project_open_regi_idx" ON "PGT_Register_Project"("open_regi");

-- CreateIndex
CREATE INDEX "PGT_Register_Project_close_regi_idx" ON "PGT_Register_Project"("close_regi");

-- AddForeignKey
ALTER TABLE "PGT_Project_Registration" ADD CONSTRAINT "PGT_Project_Registration_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "PGT_Register_Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PGT_Project_Registration" ADD CONSTRAINT "PGT_Project_Registration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "PGT_User"("codeId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PGT_Project_RegistrationItem" ADD CONSTRAINT "PGT_Project_RegistrationItem_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "PGT_Project_Registration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PGT_Project_RegistrationItem" ADD CONSTRAINT "PGT_Project_RegistrationItem_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "PGT_Project_Activity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PGT_Payment" ADD CONSTRAINT "PGT_Payment_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "PGT_Project_Registration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
