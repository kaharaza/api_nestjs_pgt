/*
  Warnings:

  - You are about to drop the `Center` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Hotpital` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Center";

-- DropTable
DROP TABLE "Hotpital";

-- CreateTable
CREATE TABLE "Hotpitals" (
    "id" SERIAL NOT NULL,
    "Hname_TH" TEXT,
    "Hname_EN" TEXT,

    CONSTRAINT "Hotpitals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Centers" (
    "id" SERIAL NOT NULL,
    "Cname_TH" TEXT,
    "Cname_EN" TEXT,

    CONSTRAINT "Centers_pkey" PRIMARY KEY ("id")
);
