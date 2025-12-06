-- AlterTable
ALTER TABLE "WasteReport" ADD COLUMN     "routeCollectorId" TEXT;

-- AddForeignKey
ALTER TABLE "WasteReport" ADD CONSTRAINT "WasteReport_routeCollectorId_fkey" FOREIGN KEY ("routeCollectorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
