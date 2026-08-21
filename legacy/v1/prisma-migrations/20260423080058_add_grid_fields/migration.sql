-- AlterTable
ALTER TABLE "Facility" ADD COLUMN     "gridCol" INTEGER,
ADD COLUMN     "gridRow" INTEGER;

-- AlterTable
ALTER TABLE "Floor" ADD COLUMN     "gridCols" INTEGER,
ADD COLUMN     "gridRows" INTEGER,
ADD COLUMN     "startCol" INTEGER,
ADD COLUMN     "startRow" INTEGER,
ADD COLUMN     "wallData" JSONB;
