-- DropForeignKey
ALTER TABLE "status_logs" DROP CONSTRAINT "status_logs_changedById_fkey";

-- AlterTable
ALTER TABLE "status_logs" ALTER COLUMN "changedById" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "status_logs" ADD CONSTRAINT "status_logs_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
