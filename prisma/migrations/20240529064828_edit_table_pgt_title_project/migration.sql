/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `PGT_title_Project` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PGT_title_Project" DROP COLUMN "updatedAt",
ADD COLUMN     "F_updatedAt" TIMESTAMP(3),
ADD COLUMN     "S_updatedAt" TIMESTAMP(3),
ADD COLUMN     "W_updatedAt" TIMESTAMP(3),
ALTER COLUMN "createdAt" DROP NOT NULL,
ALTER COLUMN "createdAt" DROP DEFAULT;
