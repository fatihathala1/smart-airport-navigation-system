-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "icon" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Facility" ADD COLUMN     "photo" TEXT;
