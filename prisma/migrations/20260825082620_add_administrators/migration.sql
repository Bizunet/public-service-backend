-- CreateTable
CREATE TABLE "Administrator" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "nameAm" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "roleEn" TEXT NOT NULL,
    "roleAm" TEXT NOT NULL,
    "badgeEn" TEXT,
    "badgeAm" TEXT,
    "team" TEXT,
    "imagePath" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "isLeader" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Administrator_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Administrator_key_key" ON "Administrator"("key");
