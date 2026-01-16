/*
  Warnings:

  - Added the required column `dayIdTH` to the `PGT_CheckIn` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PGT_CheckIn" ADD COLUMN     "dayIdTH" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "PGT_CheckIn_userId_titleId_dayIdTH_idx" ON "PGT_CheckIn"("userId", "titleId", "dayIdTH");
