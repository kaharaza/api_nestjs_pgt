-- CreateTable
CREATE TABLE "Faculty" (
    "id" SERIAL NOT NULL,
    "OrganizationID" TEXT NOT NULL,
    "NameThai" TEXT NOT NULL,
    "NameEnglish" TEXT NOT NULL,

    CONSTRAINT "Faculty_pkey" PRIMARY KEY ("id")
);
