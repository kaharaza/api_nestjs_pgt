/*
  Warnings:

  - You are about to drop the column `timeCheckin` on the `PGT_CheckIn` table. All the data in the column will be lost.
  - The `dateCheckin` column on the `PGT_CheckIn` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "PGT_CheckIn" DROP COLUMN "timeCheckin",
DROP COLUMN "dateCheckin",
ADD COLUMN     "dateCheckin" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
