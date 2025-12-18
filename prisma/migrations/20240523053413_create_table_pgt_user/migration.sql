/*
  Warnings:

  - You are about to drop the column `name_en` on the `PGT_Title_Project` table. All the data in the column will be lost.
  - You are about to drop the column `name_th` on the `PGT_Title_Project` table. All the data in the column will be lost.
  - You are about to drop the column `ce` on the `PGT_User` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `PGT_User` table. All the data in the column will be lost.
  - You are about to drop the column `fname` on the `PGT_User` table. All the data in the column will be lost.
  - You are about to drop the column `lostfood` on the `PGT_User` table. All the data in the column will be lost.
  - You are about to drop the column `menberId` on the `PGT_User` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `PGT_User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[idCard]` on the table `PGT_User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `PGT_Title_Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `codeId` to the `PGT_User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `county` to the `PGT_User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `district` to the `PGT_User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ethnicity` to the `PGT_User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fnameEn` to the `PGT_User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fnameTh` to the `PGT_User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `foodtype` to the `PGT_User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hdb` to the `PGT_User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idCard` to the `PGT_User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lnameEn` to the `PGT_User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lnameTh` to the `PGT_User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nationality` to the `PGT_User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `parish` to the `PGT_User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pdpa` to the `PGT_User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pwd` to the `PGT_User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sex` to the `PGT_User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `workaddress` to the `PGT_User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `zipcode` to the `PGT_User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "PGT_User_ce_key";

-- DropIndex
DROP INDEX "PGT_User_email_key";

-- DropIndex
DROP INDEX "PGT_User_menberId_key";

-- DropIndex
DROP INDEX "PGT_User_phone_key";

-- AlterTable
ALTER TABLE "PGT_Title_Project" DROP COLUMN "name_en",
DROP COLUMN "name_th",
ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PGT_User" DROP COLUMN "ce",
DROP COLUMN "createdAt",
DROP COLUMN "fname",
DROP COLUMN "lostfood",
DROP COLUMN "menberId",
DROP COLUMN "updatedAt",
ADD COLUMN     "certName" TEXT,
ADD COLUMN     "codeId" TEXT NOT NULL,
ADD COLUMN     "county" TEXT NOT NULL,
ADD COLUMN     "district" TEXT NOT NULL,
ADD COLUMN     "ethnicity" TEXT NOT NULL,
ADD COLUMN     "fnameEn" TEXT NOT NULL,
ADD COLUMN     "fnameTh" TEXT NOT NULL,
ADD COLUMN     "foodtype" TEXT NOT NULL,
ADD COLUMN     "hdb" TEXT NOT NULL,
ADD COLUMN     "idCard" TEXT NOT NULL,
ADD COLUMN     "lineId" TEXT,
ADD COLUMN     "lnameEn" TEXT NOT NULL,
ADD COLUMN     "lnameTh" TEXT NOT NULL,
ADD COLUMN     "nationality" TEXT NOT NULL,
ADD COLUMN     "parish" TEXT NOT NULL,
ADD COLUMN     "pdpa" TEXT NOT NULL,
ADD COLUMN     "pwd" TEXT NOT NULL,
ADD COLUMN     "schoolEnd" TEXT,
ADD COLUMN     "schoolYear" TEXT,
ADD COLUMN     "sex" TEXT NOT NULL,
ADD COLUMN     "workaddress" TEXT NOT NULL,
ADD COLUMN     "worklocaltion" TEXT,
ADD COLUMN     "zipcode" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "PGT_User_idCard_key" ON "PGT_User"("idCard");
