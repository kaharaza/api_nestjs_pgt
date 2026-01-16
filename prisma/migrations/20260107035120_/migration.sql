-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('LECTURE', 'LAB', 'WORKSHOP');

-- AlterTable
ALTER TABLE "PGT_title_Project" ADD COLUMN     "priceTotal" INTEGER;

-- CreateTable
CREATE TABLE "PGT_Project_Activity" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "type" "ActivityType" NOT NULL,
    "capacity" INTEGER NOT NULL,
    "earlyPrice" INTEGER NOT NULL,
    "regularPrice" INTEGER NOT NULL,

    CONSTRAINT "PGT_Project_Activity_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PGT_Project_Activity" ADD CONSTRAINT "PGT_Project_Activity_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "PGT_Register_Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
