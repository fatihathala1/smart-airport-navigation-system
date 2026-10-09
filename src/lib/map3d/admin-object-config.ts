export type MapObjectOccupancy = "OCCUPIED" | "OBSTACLE" | "WALKABLE";
export type MapObjectDoorSide = "NORTH" | "EAST" | "SOUTH" | "WEST";
export type MapObjectDoor = { side: MapObjectDoorSide; open: boolean; position: number };

export type MapObjectConfig = {
  objectName: string;
  displayName: string;
  entityType: "TENANT" | "FACILITY";
  color: string;
  entryDoors: MapObjectDoor[];
  occupancy: MapObjectOccupancy;
  description: string;
  photoUrl: string;
  websiteUrl: string;
  instagramUrl: string;
  contact: string;
  openTime: string;
  closeTime: string;
  activeFrom: string;
  activeUntil: string;
  updatedAt: string;
};

export type MapObjectConfigByName = Record<string, MapObjectConfig>;

export const MAP_OBJECT_CONFIG_STORAGE_KEY = "todjuanda.admin.map-object-config.v1";

/** Converts common Google Drive share links into an image URL usable by <img>. */
export function getMapObjectPhotoUrl(value: string | undefined | null): string {
  const raw = value?.trim() ?? "";
  if (!raw) return "";
  try {
    const url = new URL(raw);
    if (!/(^|\.)drive\.google\.com$/i.test(url.hostname)) return raw;
    const fileMatch = url.pathname.match(/\/file\/d\/([^/]+)/i);
    const id = fileMatch?.[1] ?? url.searchParams.get("id");
    return id ? `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w1200` : raw;
  } catch {
    return raw;
  }
}

export function defaultMapObjectConfig(objectName: string): MapObjectConfig {
  const isFacility = /(?:-avsec-|-tl-|-nr-|-man-|-mus-)/i.test(objectName);
  return {
    objectName,
    displayName: "",
    entityType: isFacility ? "FACILITY" : "TENANT",
    color: "",
    entryDoors: [
      { side: "NORTH", open: true, position: 50 },
      { side: "EAST", open: true, position: 50 },
      { side: "SOUTH", open: true, position: 50 },
      { side: "WEST", open: true, position: 50 },
    ],
    occupancy: "OCCUPIED",
    description: "",
    photoUrl: "",
    websiteUrl: "",
    instagramUrl: "",
    contact: "",
    openTime: "",
    closeTime: "",
    activeFrom: "",
    activeUntil: "",
    updatedAt: "",
  };
}

export function readMapObjectConfigs(): MapObjectConfigByName {
  if (typeof window === "undefined") return {};
  try {
    const value = JSON.parse(window.localStorage.getItem(MAP_OBJECT_CONFIG_STORAGE_KEY) ?? "{}");
    if (!value || typeof value !== "object") return {};
    return Object.fromEntries(
      Object.entries(value as Record<string, Partial<MapObjectConfig>>).map(([objectName, config]) => [
        objectName,
        { ...defaultMapObjectConfig(objectName), ...config, objectName, entryDoors: config.entryDoors?.slice(0, 4) ?? defaultMapObjectConfig(objectName).entryDoors },
      ]),
    ) as MapObjectConfigByName;
  } catch {
    return {};
  }
}

export function writeMapObjectConfigs(configs: MapObjectConfigByName) {
  window.localStorage.setItem(MAP_OBJECT_CONFIG_STORAGE_KEY, JSON.stringify(configs));
  window.dispatchEvent(new CustomEvent("todjuanda-map-config-change", { detail: configs }));
}

/**
 * Ambil semua konfigurasi objek peta dari database via API.
 * Menyimpan hasilnya ke localStorage sebagai cache.
 * Melempar error jika fetch gagal.
 */
export async function fetchMapObjectConfigsFromDb(): Promise<MapObjectConfigByName> {
  const response = await fetch("/api/admin/map-objects", { cache: "no-store" });
  if (!response.ok) throw new Error(`Gagal mengambil konfigurasi peta: ${response.status}`);
  const raw = await response.json() as Record<string, Partial<MapObjectConfig>>;
  const configs: MapObjectConfigByName = Object.fromEntries(
    Object.entries(raw).map(([objectName, config]) => [
      objectName,
      { ...defaultMapObjectConfig(objectName), ...config, objectName, entryDoors: config.entryDoors?.slice(0, 4) ?? defaultMapObjectConfig(objectName).entryDoors },
    ]),
  );
  // Simpan ke localStorage sebagai cache
  if (typeof window !== "undefined") {
    window.localStorage.setItem(MAP_OBJECT_CONFIG_STORAGE_KEY, JSON.stringify(configs));
  }
  return configs;
}

/**
 * Simpan konfigurasi satu objek ke database via API, lalu update localStorage.
 */
export async function saveMapObjectConfigToDb(config: MapObjectConfig): Promise<void> {
  const response = await fetch(`/api/admin/map-objects/${encodeURIComponent(config.objectName)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error ?? `Gagal menyimpan: ${response.status}`);
  }
  // Update localStorage juga agar perubahan langsung terlihat
  if (typeof window !== "undefined") {
    const existing = readMapObjectConfigs();
    const next = { ...existing, [config.objectName]: { ...config, updatedAt: new Date().toISOString() } };
    writeMapObjectConfigs(next);
  }
}

/**
 * Simpan semua konfigurasi (batch) ke database via API.
 */
export async function saveAllMapObjectConfigsToDb(configs: MapObjectConfigByName): Promise<void> {
  const response = await fetch("/api/admin/map-objects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(configs),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error ?? `Gagal menyimpan: ${response.status}`);
  }
  if (typeof window !== "undefined") {
    writeMapObjectConfigs(configs);
  }
}

