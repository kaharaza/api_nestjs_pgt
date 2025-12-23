-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'FINANCE', 'SUB', 'STAFF', 'ADMIN');

-- CreateEnum
CREATE TYPE "Permission" AS ENUM ('READ', 'CREATE', 'EDIT', 'DELETE', 'FINANCE', 'ADMINISTRATION', 'ACTIVE');

-- AlterTable
ALTER TABLE "PGT_User" ADD COLUMN     "points" INTEGER DEFAULT 0;

-- CreateTable
CREATE TABLE "cmu_it_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "permissions" "Permission"[] DEFAULT ARRAY[]::"Permission"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cmu_it_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cmu_it_accounts_email_key" ON "cmu_it_accounts"("email");
