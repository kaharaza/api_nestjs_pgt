-- CreateTable
CREATE TABLE "ComplaintVoc3" (
    "id" SERIAL NOT NULL,
    "fname" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "consent" BOOLEAN NOT NULL,
    "imageName" TEXT NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "ComplaintVoc3_pkey" PRIMARY KEY ("id")
);
