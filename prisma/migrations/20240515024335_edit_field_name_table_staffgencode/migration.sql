/*
  Warnings:

  - Added the required column `name` to the `PGT_Staff_Gencode` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PGT_Staff_Gencode" ADD COLUMN     "name" TEXT NOT NULL;
