import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/** Titik pada bidang model: [x, z]. Utara = -Z. */
export type ExteriorPoint = [x: number, z: number];

export type ExteriorArea = { kind: "parking" | "apron" | "grass" | "water"; name?: string; points: ExteriorPoint[] };
export type ExteriorLine = { kind: "road" | "taxiway"; width: number; name?: string; points: ExteriorPoint[] };
export type ExteriorBuilding = { name?: string; height: number; points: ExteriorPoint[] };

export type ExteriorData = {
  meta: { attribution: string; fit: { scale: number; rotationDeg: number; iou: number } };
  ground: ExteriorPoint[];
  areas: ExteriorArea[];
  lines: ExteriorLine[];
  buildings: ExteriorBuilding[];
};

/** Bentuk 2D di ruang shape. Y shape = -Z model supaya setelah diputar jatuh tepat. */
function toShape(points: ExteriorPoint[]) {
  return new THREE.Shape(points.map(([x, z]) => new THREE.Vector2(x, -z)));
}

/** Bidang datar di ketinggian y. */
export function flatPolygon(points: ExteriorPoint[], y: number): THREE.BufferGeometry | null {
  if (points.length < 3) return null;
  const geometry = new THREE.ShapeGeometry(toShape(points));
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, y, 0);
  geometry.deleteAttribute("uv");
  return geometry;
}

/** Balok hasil ekstrusi ke atas, alas di y. */
export function extrudedPolygon(points: ExteriorPoint[], y: number, height: number): THREE.BufferGeometry | null {
  if (points.length < 3 || height <= 0) return null;
  const geometry = new THREE.ExtrudeGeometry(toShape(points), { depth: height, bevelEnabled: false });
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, y, 0);
  geometry.deleteAttribute("uv");
  return geometry;
}

/**
 * Pita selebar `width` mengikuti garis tengah. Sambungan memakai miter yang
 * dibatasi supaya tikungan tajam tidak menghasilkan paku panjang.
 */
export function ribbon(points: ExteriorPoint[], width: number, y: number): THREE.BufferGeometry | null {
  if (points.length < 2 || width <= 0) return null;
  const half = width / 2;
  const left: number[][] = [];
  const right: number[][] = [];
  for (let index = 0; index < points.length; index += 1) {
    const previous = points[Math.max(0, index - 1)];
    const next = points[Math.min(points.length - 1, index + 1)];
    const current = points[index];
    let dx = next[0] - previous[0];
    let dz = next[1] - previous[1];
    const length = Math.hypot(dx, dz) || 1;
    dx /= length;
    dz /= length;
    // Normal kiri dari arah jalan.
    let nx = -dz;
    let nz = dx;
    let scale = 1;
    if (index > 0 && index < points.length - 1) {
      const ax = current[0] - previous[0];
      const az = current[1] - previous[1];
      const al = Math.hypot(ax, az) || 1;
      const segmentNormalX = -az / al;
      const segmentNormalZ = ax / al;
      const dot = nx * segmentNormalX + nz * segmentNormalZ;
      scale = Math.min(2, 1 / Math.max(dot, 0.5));
    }
    nx *= half * scale;
    nz *= half * scale;
    left.push([current[0] + nx, current[1] + nz]);
    right.push([current[0] - nx, current[1] - nz]);
  }
  const positions: number[] = [];
  for (let index = 0; index < points.length - 1; index += 1) {
    const [l0, l1, r0, r1] = [left[index], left[index + 1], right[index], right[index + 1]];
    // Urutan berlawanan jarum jam dilihat dari atas, supaya sisi depan menghadap ke atas.
    positions.push(l0[0], y, l0[1], l1[0], y, l1[1], r0[0], y, r0[1]);
    positions.push(l1[0], y, l1[1], r1[0], y, r1[1], r0[0], y, r0[1]);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  const normals = new Float32Array(positions.length);
  for (let index = 1; index < normals.length; index += 3) normals[index] = 1;
  geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  return geometry;
}

/** Gabungkan banyak geometri satu kategori menjadi satu draw call. */
export function merge(geometries: (THREE.BufferGeometry | null)[]): THREE.BufferGeometry | null {
  const valid = geometries.filter((geometry): geometry is THREE.BufferGeometry => geometry !== null);
  if (!valid.length) return null;
  const merged = mergeGeometries(valid.map((geometry) => (geometry.index ? geometry.toNonIndexed() : geometry)));
  valid.forEach((geometry) => geometry.dispose());
  return merged;
}

/** Titik tengah poligon, untuk menempatkan label. */
export function centroid(points: ExteriorPoint[]): ExteriorPoint {
  let area = 0;
  let cx = 0;
  let cz = 0;
  for (let index = 0; index < points.length; index += 1) {
    const [x0, z0] = points[index];
    const [x1, z1] = points[(index + 1) % points.length];
    const cross = x0 * z1 - x1 * z0;
    area += cross;
    cx += (x0 + x1) * cross;
    cz += (z0 + z1) * cross;
  }
  if (Math.abs(area) < 1e-9) {
    const sum = points.reduce((total, [x, z]) => [total[0] + x, total[1] + z], [0, 0]);
    return [sum[0] / points.length, sum[1] / points.length];
  }
  return [cx / (3 * area), cz / (3 * area)];
}

/** Luas poligon pada bidang XZ. */
export function polygonArea(points: ExteriorPoint[]) {
  let area = 0;
  for (let index = 0; index < points.length; index += 1) {
    const [x0, z0] = points[index];
    const [x1, z1] = points[(index + 1) % points.length];
    area += x0 * z1 - x1 * z0;
  }
  return Math.abs(area) / 2;
}
