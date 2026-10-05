export type MapObjectOccupancy = "OCCUPIED" | "OBSTACLE" | "WALKABLE";

export type MapObjectConfig = {
  objectName: string;
  displayName: string;
  entityType: "TENANT" | "FACILITY";
  color: string;
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

export function defaultMapObjectConfig(objectName: string): MapObjectConfig {
  const isFacility = /(?:-avsec-|-tl-|-nr-|-man-|-mus-)/i.test(objectName);
  return {
    objectName,
    displayName: "",
    entityType: isFacility ? "FACILITY" : "TENANT",
    color: "",
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
        { ...defaultMapObjectConfig(objectName), ...config, objectName },
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
