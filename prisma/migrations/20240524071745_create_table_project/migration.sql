/*
  Warnings:

  - You are about to drop the column `shirtId` on the `PGT_Register_Project` table. All the data in the column will be lost.
  - You are about to drop the column `titleId` on the `PGT_Register_Project` table. All the data in the column will be lost.
  - You are about to drop the `PGT_Title_Project` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PGT_shirt_size` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `close_regi` to the `PGT_Register_Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `count_regi` to the `PGT_Register_Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdAt` to the `PGT_Register_Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `detail` to the `PGT_Register_Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `discount` to the `PGT_Register_Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `image` to the `PGT_Register_Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `open_regi` to the `PGT_Register_Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price_regi` to the `PGT_Register_Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtitle` to the `PGT_Register_Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `PGT_Register_Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `PGT_Register_Project` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "PGT_Register_Project" DROP CONSTRAINT "PGT_Register_Project_shirtId_fkey";

-- DropForeignKey
ALTER TABLE "PGT_Register_Project" DROP CONSTRAINT "PGT_Register_Project_titleId_fkey";

-- AlterTable
ALTER TABLE "PGT_Register_Project" DROP COLUMN "shirtId",
DROP COLUMN "titleId",
ADD COLUMN     "close_regi" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "count_regi" INTEGER NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "detail" TEXT NOT NULL,
ADD COLUMN     "discount" TEXT NOT NULL,
ADD COLUMN     "image" TEXT NOT NULL,
ADD COLUMN     "open_regi" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "price_regi" INTEGER NOT NULL,
ADD COLUMN     "subtitle" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "PGT_Title_Project";

-- DropTable
DROP TABLE "PGT_shirt_size";
