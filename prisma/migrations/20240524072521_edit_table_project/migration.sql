/*
  Warnings:

  - You are about to drop the column `userId` on the `PGT_Register_Project` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "PGT_Register_Project" DROP CONSTRAINT "PGT_Register_Project_userId_fkey";

-- AlterTable
ALTER TABLE "PGT_Register_Project" DROP COLUMN "userId";

-- CreateTable
CREATE TABLE "PGT_title_Project" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "titleId" INTEGER NOT NULL,

    CONSTRAINT "PGT_title_Project_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PGT_title_Project" ADD CONSTRAINT "PGT_title_Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "PGT_User"("codeId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PGT_title_Project" ADD CONSTRAINT "PGT_title_Project_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "PGT_Register_Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
