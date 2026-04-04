-- CreateEnum
CREATE TYPE "DeploymentStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'SUCCESS', 'FAILED', 'CANCELLED', 'ROLLBACK_IN_PROGRESS', 'ROLLBACK_SUCCESS', 'ROLLBACK_FAILED');

-- AlterTable: Environment
ALTER TABLE "Environment" 
ADD COLUMN "name" TEXT NOT NULL DEFAULT 'Unnamed Environment',
ADD COLUMN "currentVersion" TEXT NOT NULL DEFAULT 'v1.0.0',
ADD COLUMN "lastDeploymentAt" TIMESTAMP(3),
ADD COLUMN "metadata" JSONB;

-- AlterTable: Deployment
ALTER TABLE "Deployment" 
ADD COLUMN "version" TEXT NOT NULL DEFAULT 'v1.0.0',
ADD COLUMN "status" "DeploymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "duration" INTEGER,
ADD COLUMN "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "completedAt" TIMESTAMP(3),
ADD COLUMN "updatedAt" TIMESTAMP(3),
DROP COLUMN "projectId",
DROP COLUMN "deploymentUrl",
ALTER COLUMN "runId" DROP NOT NULL;

-- CreateTable: DeploymentLog
CREATE TABLE "DeploymentLog" (
    "id" TEXT NOT NULL,
    "deploymentId" TEXT NOT NULL,
    "stageName" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'INFO',
    "sequence" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeploymentLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DeploymentLog" ADD CONSTRAINT "DeploymentLog_deploymentId_fkey" FOREIGN KEY ("deploymentId") REFERENCES "Deployment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX "DeploymentLog_deploymentId_sequence_key" ON "DeploymentLog"("deploymentId", "sequence");
