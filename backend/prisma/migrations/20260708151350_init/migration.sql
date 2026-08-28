-- CreateEnum
CREATE TYPE "Category" AS ENUM ('BANGUNAN', 'STRUKTUR', 'BENDA', 'SITUS', 'KAWASAN');

-- CreateEnum
CREATE TYPE "StatusCagar" AS ENUM ('DITETAPKAN', 'DIDAFTARKAN', 'USULAN');

-- CreateEnum
CREATE TYPE "TingkatCagar" AS ENUM ('NASIONAL', 'PROVINSI', 'KABUPATEN');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CagarBudaya" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "kabupaten" TEXT NOT NULL,
    "kecamatan" TEXT,
    "alamat" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "kategori" "Category" NOT NULL,
    "status" "StatusCagar" NOT NULL,
    "tingkat" "TingkatCagar",
    "tahun" INTEGER,
    "thumbnail" TEXT,
    "nomorSK" TEXT,
    "sumber" TEXT,
    "googleMaps" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CagarBudaya_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gallery" (
    "id" SERIAL NOT NULL,
    "image" TEXT NOT NULL,
    "caption" TEXT,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "cagarId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Gallery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CagarBudaya_slug_key" ON "CagarBudaya"("slug");

-- CreateIndex
CREATE INDEX "CagarBudaya_kabupaten_idx" ON "CagarBudaya"("kabupaten");

-- CreateIndex
CREATE INDEX "CagarBudaya_kategori_idx" ON "CagarBudaya"("kategori");

-- CreateIndex
CREATE INDEX "CagarBudaya_status_idx" ON "CagarBudaya"("status");

-- CreateIndex
CREATE INDEX "Gallery_cagarId_idx" ON "Gallery"("cagarId");

-- AddForeignKey
ALTER TABLE "Gallery" ADD CONSTRAINT "Gallery_cagarId_fkey" FOREIGN KEY ("cagarId") REFERENCES "CagarBudaya"("id") ON DELETE CASCADE ON UPDATE CASCADE;
