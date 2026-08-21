/*
  Warnings:

  - You are about to drop the column `nodeId` on the `Facility` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[destId]` on the table `Facility` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Facility_nodeId_key";

-- AlterTable
ALTER TABLE "Facility" DROP COLUMN "nodeId",
ADD COLUMN     "destId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Facility_destId_key" ON "Facility"("destId");
