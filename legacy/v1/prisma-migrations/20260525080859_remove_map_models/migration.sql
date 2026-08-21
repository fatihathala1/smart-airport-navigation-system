/*
  Warnings:

  - You are about to drop the `MapEdge` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MapNode` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Facility" DROP CONSTRAINT "Facility_nodeId_fkey";

-- DropForeignKey
ALTER TABLE "MapEdge" DROP CONSTRAINT "MapEdge_fromNodeId_fkey";

-- DropForeignKey
ALTER TABLE "MapEdge" DROP CONSTRAINT "MapEdge_toNodeId_fkey";

-- DropForeignKey
ALTER TABLE "MapNode" DROP CONSTRAINT "MapNode_floorId_fkey";

-- DropTable
DROP TABLE "MapEdge";

-- DropTable
DROP TABLE "MapNode";
