/*
  Warnings:

  - Added the required column `fileId` to the `ComplaintVoc2` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileId` to the `ComplaintVoc3` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ComplaintVoc2" ADD COLUMN     "fileId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "ComplaintVoc3" ADD COLUMN     "fileId" INTEGER NOT NULL;
