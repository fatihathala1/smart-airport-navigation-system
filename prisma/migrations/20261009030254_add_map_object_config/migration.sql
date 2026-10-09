-- CreateTable
CREATE TABLE "MapObjectConfig" (
    "id" TEXT NOT NULL,
    "objectName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL DEFAULT '',
    "entityType" TEXT NOT NULL DEFAULT 'TENANT',
    "color" TEXT NOT NULL DEFAULT '',
    "occupancy" TEXT NOT NULL DEFAULT 'OCCUPIED',
    "description" TEXT NOT NULL DEFAULT '',
    "photoUrl" TEXT NOT NULL DEFAULT '',
    "websiteUrl" TEXT NOT NULL DEFAULT '',
    "instagramUrl" TEXT NOT NULL DEFAULT '',
    "contact" TEXT NOT NULL DEFAULT '',
    "openTime" TEXT NOT NULL DEFAULT '',
    "closeTime" TEXT NOT NULL DEFAULT '',
    "activeFrom" TEXT NOT NULL DEFAULT '',
    "activeUntil" TEXT NOT NULL DEFAULT '',
    "entryDoors" JSONB NOT NULL DEFAULT '[]',
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MapObjectConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MapObjectConfig_objectName_key" ON "MapObjectConfig"("objectName");

-- CreateIndex
CREATE INDEX "MapObjectConfig_objectName_idx" ON "MapObjectConfig"("objectName");
