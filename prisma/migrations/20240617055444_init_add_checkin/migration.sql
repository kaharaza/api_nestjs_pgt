-- CreateTable
CREATE TABLE "PGT_CheckIn" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "titleId" INTEGER NOT NULL,
    "dateCheckin" TEXT,
    "timeCheckin" TEXT,

    CONSTRAINT "PGT_CheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PGT_Send_Receipt" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "titleId" INTEGER NOT NULL,
    "dateSend" TEXT NOT NULL,
    "timeSend" TEXT NOT NULL,

    CONSTRAINT "PGT_Send_Receipt_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PGT_CheckIn" ADD CONSTRAINT "PGT_CheckIn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "PGT_User"("codeId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PGT_CheckIn" ADD CONSTRAINT "PGT_CheckIn_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "PGT_Register_Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PGT_Send_Receipt" ADD CONSTRAINT "PGT_Send_Receipt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "PGT_User"("codeId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PGT_Send_Receipt" ADD CONSTRAINT "PGT_Send_Receipt_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "PGT_Register_Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
