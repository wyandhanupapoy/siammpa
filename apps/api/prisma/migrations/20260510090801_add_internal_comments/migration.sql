-- CreateTable
CREATE TABLE "internal_comments" (
    "id" TEXT NOT NULL,
    "aspirationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "internal_comments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "internal_comments" ADD CONSTRAINT "internal_comments_aspirationId_fkey" FOREIGN KEY ("aspirationId") REFERENCES "aspirations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_comments" ADD CONSTRAINT "internal_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
