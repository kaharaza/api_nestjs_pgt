/*
  Warnings:

  - Added the required column `createdAt` to the `PGT_title_Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `remaker` to the `PGT_title_Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transferSlip` to the `PGT_title_Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `PGT_title_Project` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PGT_Register_Project" ALTER COLUMN "open_regi" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "PGT_title_Project" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "remaker" TEXT NOT NULL,
ADD COLUMN     "sentTransferSlip" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "transferSlip" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
