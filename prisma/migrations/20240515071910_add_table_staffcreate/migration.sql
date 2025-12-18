/*
  Warnings:

  - A unique constraint covering the columns `[gencode]` on the table `PGT_Staff_Gencode` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "PGT_Staff_Create" (
    "id" SERIAL NOT NULL,
    "fname" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "pwd" TEXT NOT NULL,
    "codeId" TEXT NOT NULL,

    CONSTRAINT "PGT_Staff_Create_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PGT_Staff_Create_email_key" ON "PGT_Staff_Create"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PGT_Staff_Gencode_gencode_key" ON "PGT_Staff_Gencode"("gencode");

-- AddForeignKey
ALTER TABLE "PGT_Staff_Create" ADD CONSTRAINT "PGT_Staff_Create_codeId_fkey" FOREIGN KEY ("codeId") REFERENCES "PGT_Staff_Gencode"("gencode") ON DELETE RESTRICT ON UPDATE CASCADE;
