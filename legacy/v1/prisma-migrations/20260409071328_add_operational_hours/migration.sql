-- CreateTable
CREATE TABLE "OperationalHour" (
    "id" SERIAL NOT NULL,
    "facilityId" INTEGER NOT NULL,
    "day" INTEGER NOT NULL,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "is24Hours" BOOLEAN NOT NULL DEFAULT false,
    "openTime" TEXT,
    "closeTime" TEXT,

    CONSTRAINT "OperationalHour_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OperationalHour_facilityId_day_key" ON "OperationalHour"("facilityId", "day");

-- AddForeignKey
ALTER TABLE "OperationalHour" ADD CONSTRAINT "OperationalHour_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;
