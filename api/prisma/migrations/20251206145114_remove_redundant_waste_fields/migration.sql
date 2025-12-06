-- Drop the WasteType enum dependency first by altering the column
ALTER TABLE "WasteReport" ALTER COLUMN "wasteType" DROP NOT NULL;

-- Add aiAnalysis column if it doesn't exist
ALTER TABLE "WasteReport" ADD COLUMN IF NOT EXISTS "aiAnalysis" JSONB;

-- Drop the redundant columns
ALTER TABLE "WasteReport" DROP COLUMN IF EXISTS "wasteType";
ALTER TABLE "WasteReport" DROP COLUMN IF EXISTS "estimatedAmountKg";
ALTER TABLE "WasteReport" DROP COLUMN IF EXISTS "note";

-- Drop the WasteType enum
DROP TYPE IF EXISTS "WasteType";
