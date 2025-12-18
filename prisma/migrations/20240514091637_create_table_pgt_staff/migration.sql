/*
  Warnings:

  - A unique constraint covering the columns `[menberId]` on the table `PGT_User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[ce]` on the table `PGT_User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phone]` on the table `PGT_User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `PGT_User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `address` to the `PGT_User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `PGT_User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fname` to the `PGT_User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lostfood` to the `PGT_User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `PGT_User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `prefix` to the `PGT_User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `role` to the `PGT_User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PGT_User" ADD COLUMN     "address" TEXT NOT NULL,
ADD COLUMN     "ce" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3),
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "fname" TEXT NOT NULL,
ADD COLUMN     "lostfood" TEXT NOT NULL,
ADD COLUMN     "phone" TEXT NOT NULL,
ADD COLUMN     "prefix" TEXT NOT NULL,
ADD COLUMN     "role" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "PGT_Register_Project" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "titleId" INTEGER NOT NULL,
    "shirtId" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PGT_Register_Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PGT_shirt_size" (
    "id" SERIAL NOT NULL,
    "namesize" TEXT NOT NULL,

    CONSTRAINT "PGT_shirt_size_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PGT_Staff_Gencode" (
    "id" SERIAL NOT NULL,
    "gencode" TEXT NOT NULL,
    "agencyId" INTEGER NOT NULL,

    CONSTRAINT "PGT_Staff_Gencode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PGT_Staff_Agency" (
    "id" SERIAL NOT NULL,
    "agency" TEXT NOT NULL,

    CONSTRAINT "PGT_Staff_Agency_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PGT_User_menberId_key" ON "PGT_User"("menberId");

-- CreateIndex
CREATE UNIQUE INDEX "PGT_User_ce_key" ON "PGT_User"("ce");

-- CreateIndex
CREATE UNIQUE INDEX "PGT_User_phone_key" ON "PGT_User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "PGT_User_email_key" ON "PGT_User"("email");

-- AddForeignKey
ALTER TABLE "PGT_Register_Project" ADD CONSTRAINT "PGT_Register_Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "PGT_User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PGT_Register_Project" ADD CONSTRAINT "PGT_Register_Project_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "PGT_Title_Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PGT_Register_Project" ADD CONSTRAINT "PGT_Register_Project_shirtId_fkey" FOREIGN KEY ("shirtId") REFERENCES "PGT_shirt_size"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PGT_Staff_Gencode" ADD CONSTRAINT "PGT_Staff_Gencode_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "PGT_Staff_Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
