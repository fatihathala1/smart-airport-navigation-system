import * as THREE from "three";
import type { Point2, Point3 } from "./walkable-grid";

/**
 * Eskalator dan tangga yang menghubungkan dua lantai.
 *
 * Nama menentukan jenis dan arah, karena arah eskalator tidak terbaca dari
 * bentuknya: `EKS NAIK` hanya naik, `EKS TURUN` hanya turun, `TANGGA` dua arah.
 * Eskalator tanpa kata NAIK/TURUN tidak dipakai untuk rute.
 *
 * Bentuk menentukan posisi: objek harus menjangkau dari lantai bawah sampai
 * lantai atas. Ujung bawah dan atas diambil dari titik-titik geometrinya yang
 * berada di ketinggian masing-masing lantai, jadi pelat dasar eskalator yang
 * datar (`T1-GF-EKS NAIK-01`) otomatis tidak terhitung.
 */
export type ConnectorKind = "escalator" | "stairs";
export type ConnectorDirection = "up" | "down" | "both";

export type FloorConnector = {
  name: string;
  kind: ConnectorKind;
  direction: ConnectorDirection;
  /** Ujung bawah dan atas pada bidang XZ. */
  bottom: Point2;
  top: Point2;
  /** Titik lantai sedikit di luar ujung, tempat rute di tiap lantai disambung. */
  bottomLanding: Point2;
  topLanding: Point2;
  /** Panjang lintasan miring dari ujung bawah ke ujung atas. */
  length: number;
};

const CONNECTOR_NAME = /(eks|eskalator|escalator)[\s_-]*(naik|turun)|tangga|stair/i;

/** Titik dalam jarak ini dari ketinggian lantai dianggap sebagai ujung. */
const END_TOLERANCE = 0.35;
/** Jarak titik sambung dari ujung, supaya tidak jatuh di atas pelat landasan. */
const LANDING_OFFSET = 1.2;

export function connectorDirection(name: string): ConnectorDirection {
  if (/naik/i.test(name)) return "up";
  if (/turun/i.test(name)) return "down";
  return "both";
}

export function connectorKind(name: string): ConnectorKind {
  return /tangga|stair/i.test(name) ? "stairs" : "escalator";
}

export function connectorAllows(connector: FloorConnector, travel: "up" | "down") {
  return connector.direction === "both" || connector.direction === travel;
}

function worldVertices(object: THREE.Object3D): Point3[] {
  const points: Point3[] = [];
  const vertex = new THREE.Vector3();
  object.updateWorldMatrix(true, true);
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const position = child.geometry.getAttribute("position");
    if (!position) return;
    for (let index = 0; index < position.count; index += 1) {
      vertex.fromBufferAttribute(position, index).applyMatrix4(child.matrixWorld);
      points.push([vertex.x, vertex.y, vertex.z]);
    }
  });
  return points;
}

function centroidXZ(points: Point3[]): Point2 {
  const sum = points.reduce<Point2>((total, point) => [total[0] + point[0], total[1] + point[2]], [0, 0]);
  return [sum[0] / points.length, sum[1] / points.length];
}

export function detectFloorConnectors(
  objects: { name: string; object: THREE.Object3D }[],
  lowerY: number,
  upperY: number,
): FloorConnector[] {
  const connectors: FloorConnector[] = [];
  for (const { name, object } of objects) {
    if (!CONNECTOR_NAME.test(name)) continue;
    const vertices = worldVertices(object);
    const low = vertices.filter((point) => point[1] <= lowerY + END_TOLERANCE);
    const high = vertices.filter((point) => point[1] >= upperY - END_TOLERANCE);
    if (!low.length || !high.length) continue;

    const bottom = centroidXZ(low);
    const top = centroidXZ(high);
    const run = Math.hypot(top[0] - bottom[0], top[1] - bottom[1]);
    if (run < 0.5) continue;
    const axis: Point2 = [(top[0] - bottom[0]) / run, (top[1] - bottom[1]) / run];
    connectors.push({
      name,
      kind: connectorKind(name),
      direction: connectorDirection(name),
      bottom,
      top,
      bottomLanding: [bottom[0] - axis[0] * LANDING_OFFSET, bottom[1] - axis[1] * LANDING_OFFSET],
      topLanding: [top[0] + axis[0] * LANDING_OFFSET, top[1] + axis[1] * LANDING_OFFSET],
      length: Math.hypot(run, upperY - lowerY),
    });
  }
  return connectors;
}

export function connectorLabel(connector: FloorConnector, travel: "up" | "down", floorLabel: string) {
  const via = connector.kind === "stairs" ? "tangga" : "eskalator";
  return `${travel === "up" ? "Naik" : "Turun"} ${via} ke ${floorLabel}`;
}
