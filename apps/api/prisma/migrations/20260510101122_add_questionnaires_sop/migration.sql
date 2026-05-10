-- CreateEnum
CREATE TYPE "QuestionnaireType" AS ENUM ('KSR_A', 'KSR_B', 'KSR_C', 'KSR_D', 'KSR_E');

-- CreateEnum
CREATE TYPE "QuestionnaireStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "questionnaires" (
    "id" TEXT NOT NULL,
    "type" "QuestionnaireType" NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "formUrl" TEXT,
    "status" "QuestionnaireStatus" NOT NULL DEFAULT 'DRAFT',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "picId" TEXT,
    "requestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questionnaires_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questionnaire_requests" (
    "id" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "requesterRole" TEXT NOT NULL,
    "contactInfo" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "targetRespondent" TEXT NOT NULL,
    "estimatedCount" INTEGER,
    "requestedDeadline" TIMESTAMP(3) NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questionnaire_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questionnaire_analyses" (
    "id" TEXT NOT NULL,
    "questionnaireId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "keyFindings" TEXT NOT NULL,
    "recommendations" TEXT NOT NULL,
    "reportFileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questionnaire_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "questionnaires_code_key" ON "questionnaires"("code");

-- CreateIndex
CREATE UNIQUE INDEX "questionnaires_requestId_key" ON "questionnaires"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "questionnaire_analyses_questionnaireId_key" ON "questionnaire_analyses"("questionnaireId");

-- AddForeignKey
ALTER TABLE "questionnaires" ADD CONSTRAINT "questionnaires_picId_fkey" FOREIGN KEY ("picId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questionnaires" ADD CONSTRAINT "questionnaires_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "questionnaire_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questionnaire_analyses" ADD CONSTRAINT "questionnaire_analyses_questionnaireId_fkey" FOREIGN KEY ("questionnaireId") REFERENCES "questionnaires"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
