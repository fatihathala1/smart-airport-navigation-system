-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "terminals" TEXT[] DEFAULT ARRAY[]::TEXT[];
