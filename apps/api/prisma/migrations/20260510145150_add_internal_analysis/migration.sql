-- CreateTable
CREATE TABLE "internal_analyses" (
    "id" TEXT NOT NULL,
    "aspirationId" TEXT NOT NULL,
    "notulensi" TEXT NOT NULL,
    "rekomendasi" TEXT NOT NULL,
    "rencanaAksi" TEXT NOT NULL,
    "analyzedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "internal_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "internal_analyses_aspirationId_key" ON "internal_analyses"("aspirationId");

-- AddForeignKey
ALTER TABLE "internal_analyses" ADD CONSTRAINT "internal_analyses_aspirationId_fkey" FOREIGN KEY ("aspirationId") REFERENCES "aspirations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
