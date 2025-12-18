-- CreateTable
CREATE TABLE "ComplaintVoc2" (
    "id" SERIAL NOT NULL,
    "department" TEXT NOT NULL,
    "type" TEXT,
    "fname" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "statusType" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "consent" TEXT NOT NULL,
    "imageName" TEXT NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "ComplaintVoc2_pkey" PRIMARY KEY ("id")
);
