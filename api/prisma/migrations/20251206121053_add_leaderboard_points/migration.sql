-- AlterTable
ALTER TABLE "User" ADD COLUMN     "collectorPoints" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "globalPoints" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reporterPoints" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "User_globalPoints_reporterPoints_collectorPoints_idx" ON "User"("globalPoints", "reporterPoints", "collectorPoints");
