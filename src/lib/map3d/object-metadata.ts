import * as THREE from "three";

export type CategoryKey =
  | "building"
  | "wall"
  | "pillar"
  | "glass"
  | "door-glass"
  | "door-frame"
  | "escalator"
  | "departure"
  | "arrival"
  | "red-area"
  | "visitor"
  | "fountain"
  | "lost-found"
  | "security"
  | "customer-service"
  | "seating"
  | "prayer-room"
  | "nursery"
  | "toilet"
  | "office"
  | "baggage-claim"
  | "baggage-wrap";

export type ObjectMetadata = {
  key: CategoryKey;
  category: string;
  location: string;
  status: string;
  color: string;
};

export type RuntimeMaterialStyle = {
  key: CategoryKey;
  color: string;
  opacity: number;
  transparent: boolean;
  roughness: number;
  metalness: number;
};

export type SelectedObject = ObjectMetadata & {
  uuid: string;
  name: string;
  position: [number, number, number];
};

const BASE_LOCATION = "Terminal 1 - Ground Floor";

export const COLOR_PALETTE: Record<CategoryKey, string> = {
  building: "#8B5A2B",
  wall: "#7A858D",
  pillar: "#68747C",
  glass: "#9ED9E5",
  "door-glass": "#AEE6EC",
  "door-frame": "#34434A",
  escalator: "#C98B55",
  departure: "#4FA66A",
  arrival: "#4D82C4",
  "red-area": "#C95A56",
  visitor: "#FFFFFF",
  fountain: "#5AA9E6",
  "lost-found": "#F28C28",
  security: "#9C3EA9",
  "customer-service": "#D9D9D9",
  seating: "#9E9E9E",
  "prayer-room": "#38A852",
  nursery: "#62FF9F",
  toilet: "#67E8F9",
  office: "#176B3A",
  "baggage-claim": "#A6A6A6",
  "baggage-wrap": "#123B73",
};

function categoryForObject(objectName: string): CategoryKey {
  const name = objectName.trim().toLocaleLowerCase("id-ID");
  if (/^t(?:1|i)-gf-tl(?:[-_]|$)/.test(name)) return "toilet";
  if (/^door__(?:keberangkatan|kedatangan)_/.test(name)) {
    return name.startsWith("door__keberangkatan") ? "departure" : "arrival";
  }
  if (/^baggage claim[- ](?:a1|b[1-6])$/.test(name)) return "baggage-claim";
  if (/^baggage wrap[- ]/.test(name)) return "baggage-wrap";
  if (name.startsWith("area_merah")) return "red-area";
  if (name.startsWith("area_visitor")) return "visitor";
  if (name.startsWith("air-mancur") || name.startsWith("fountain__")) {
    return "fountain";
  }
  if (/lost[ _-]*(n|and)?[ _-]*found/.test(name)) return "lost-found";
  if (name.startsWith("eskalator") || name.startsWith("esc_vis__")) {
    return "escalator";
  }
  if (name.startsWith("door__")) return "door-frame";
  if (name.startsWith("dinding-kaca") || name.startsWith("glass__")) {
    return "glass";
  }
  if (name.startsWith("tembok_pilar") || name.includes("pilar")) {
    return "pillar";
  }
  if (name.startsWith("keberangkatan")) return "departure";
  if (name.startsWith("kedatangan")) return "arrival";

  if (name.includes("-avsec-") || name.includes("avsec")) return "security";
  if (name.includes("-cs-") || name.includes("customer service")) return "customer-service";
  if (name.includes("-kursi-") || name.includes("kursi")) return "seating";
  if (name.includes("-mus-") || name.includes("mushola")) return "prayer-room";
  if (name.includes("-nr-") || name.includes("nursery")) return "nursery";
  if (name.includes("-tl-") || name.includes("toilet")) return "toilet";
  if (name.includes("-man-") || name.includes("office")) return "office";

  if (/^t[i1]-gf-/.test(name)) return "building";

  if (
    /^(rectangle|vector|curve)/.test(name) ||
    name.includes("wall") ||
    name.includes("dinding") ||
    name.includes("tembok")
  ) {
    return "wall";
  }
  return "building";
}

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  building: "Building / unit terminal",
  wall: "Wall / struktur umum",
  pillar: "Pilar terminal",
  glass: "Kaca arsitektural",
  "door-glass": "Kaca pintu",
  "door-frame": "Frame pintu",
  escalator: "Sirkulasi vertikal",
  departure: "Area keberangkatan",
  arrival: "Area kedatangan",
  "red-area": "Area merah",
  visitor: "Lantai area visitor",
  fountain: "Air mancur",
  "lost-found": "Lost & Found",
  security: "Aviation Security (Avsec)",
  "customer-service": "Customer Service",
  seating: "Area Duduk / Kursi",
  "prayer-room": "Mushola",
  nursery: "Nursery Room",
  toilet: "Toilet",
  office: "Ruang Manajemen / Kantor",
  "baggage-claim": "Baggage Claim",
  "baggage-wrap": "Baggage Wrap",
};

export function getObjectMetadata(objectName: string): ObjectMetadata {
  const key = categoryForObject(objectName);
  return {
    key,
    category: CATEGORY_LABELS[key],
    location: BASE_LOCATION,
    status: "Terdata",
    color: COLOR_PALETTE[key],
  };
}

export function getRuntimeMaterialStyle(
  objectName: string,
  materialName: string,
): RuntimeMaterialStyle {
  const normalizedObject = objectName.trim().toLocaleLowerCase("id-ID");
  const normalizedMaterial = materialName.trim().toLocaleLowerCase("id-ID");
  let key = categoryForObject(objectName);

  if (normalizedObject.startsWith("door__")) {
    key = normalizedMaterial.includes("glass") ? "door-glass" : "door-frame";
  } else if (
    normalizedObject.startsWith("glass__") &&
    normalizedMaterial.includes("frame")
  ) {
    key = "door-frame";
  }

  const isTransparent = key === "glass" || key === "door-glass";
  return {
    key,
    color: COLOR_PALETTE[key],
    opacity: key === "glass" ? 0.42 : key === "door-glass" ? 0.5 : 1,
    transparent: isTransparent,
    roughness: isTransparent ? 0.16 : key === "door-frame" ? 0.34 : 0.76,
    metalness: key === "door-frame" ? 0.34 : 0,
  };
}

export function createSelectedObject(object: THREE.Object3D): SelectedObject {
  const worldPosition = new THREE.Vector3();
  const sourceObjectName = object.userData.sourceObjectName || object.name;
  object.getWorldPosition(worldPosition);

  return {
    uuid: object.uuid,
    name: sourceObjectName,
    position: [worldPosition.x, worldPosition.y, worldPosition.z],
    ...getObjectMetadata(sourceObjectName),
  };
}
