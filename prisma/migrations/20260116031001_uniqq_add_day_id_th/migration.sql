/*
  Warnings:

  - A unique constraint covering the columns `[userId,titleId,dayIdTH]` on the table `PGT_CheckIn` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "PGT_CheckIn_userId_titleId_key";

-- CreateIndex
CREATE UNIQUE INDEX "PGT_CheckIn_userId_titleId_dayIdTH_key" ON "PGT_CheckIn"("userId", "titleId", "dayIdTH");
