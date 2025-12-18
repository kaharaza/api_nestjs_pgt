-- CreateTable
CREATE TABLE "Organization" (
    "id" SERIAL NOT NULL,
    "OrganizationID" TEXT,
    "NameThai" TEXT,
    "NameEnglish" TEXT,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);
