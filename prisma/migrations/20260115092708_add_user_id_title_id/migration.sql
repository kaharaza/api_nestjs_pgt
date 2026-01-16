/*
  Warnings:

  - A unique constraint covering the columns `[userId,titleId]` on the table `PGT_CheckIn` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PGT_CheckIn_userId_titleId_key" ON "PGT_CheckIn"("userId", "titleId");
