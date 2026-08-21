/*
  Warnings:

  - A unique constraint covering the columns `[terminal,floorNumber]` on the table `Floor` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Floor_terminal_floorNumber_key" ON "Floor"("terminal", "floorNumber");
