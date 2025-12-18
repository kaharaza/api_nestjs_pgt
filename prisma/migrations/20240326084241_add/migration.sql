-- CreateTable
CREATE TABLE "Hotpital" (
    "id" SERIAL NOT NULL,
    "Hname_TH" TEXT,
    "Hname_EN" TEXT,

    CONSTRAINT "Hotpital_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Center" (
    "id" SERIAL NOT NULL,
    "Cname_TH" TEXT,
    "Cname_EN" TEXT,

    CONSTRAINT "Center_pkey" PRIMARY KEY ("id")
);
