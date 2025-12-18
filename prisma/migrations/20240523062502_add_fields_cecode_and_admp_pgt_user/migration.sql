/*
  Warnings:

  - A unique constraint covering the columns `[codeId]` on the table `PGT_User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "PGT_User" ADD COLUMN     "admp" TEXT,
ADD COLUMN     "cecode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "PGT_User_codeId_key" ON "PGT_User"("codeId");
