-- CreateTable
CREATE TABLE "PGT_User" (
    "id" SERIAL NOT NULL,
    "menberId" TEXT NOT NULL,

    CONSTRAINT "PGT_User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PGT_Title_Project" (
    "id" SERIAL NOT NULL,
    "name_th" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,

    CONSTRAINT "PGT_Title_Project_pkey" PRIMARY KEY ("id")
);
