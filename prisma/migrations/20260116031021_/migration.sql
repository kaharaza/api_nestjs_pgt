-- DropIndex
DROP INDEX "PGT_CheckIn_userId_titleId_dayIdTH_idx";

-- CreateIndex
CREATE INDEX "PGT_CheckIn_userId_titleId_idx" ON "PGT_CheckIn"("userId", "titleId");
