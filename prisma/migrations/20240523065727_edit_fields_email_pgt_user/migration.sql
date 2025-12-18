/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `PGT_User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PGT_User_email_key" ON "PGT_User"("email");
