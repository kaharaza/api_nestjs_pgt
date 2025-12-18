/*
  Warnings:

  - Added the required column `createdAt` to the `PGT_User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `PGT_User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PGT_User" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
