import * as THREE from "three";
import {
  createWalkableGrid,
  type Footprint,
  type ObstacleFootprint,
  type WalkableGrid,
  type WalkableTriangle,
} from "./walkable-grid";

type SceneObject = { name: string; object: THREE.Object3D };

function obstacleKind(name: string): ObstacleFootprint["kind"] | null {
  if (/^DOOR__/i.test(name)) return null;
  if (/^(GLASS__|dinding-kaca)/i.test(name)) return "glass";
  if (/^(tembok[-_](?:pilar|pillar)|T1-GF-|TI-GF-|Eskalator|ESC_|CHAIR|FOUNTAIN|Air-mancur|BAGGAGE[ _-]CLAIM|BAGGAGE[ _-]WRAP|lost[ _-]n[ _-]found)/i.test(name)) return "solid";
  return null;
}

function footprint(object: THREE.Object3D): Footprint | null {
  const box = new THREE.Box3().setFromObject(object);
  if (box.isEmpty()) return null;
  return { minX: box.min.x, maxX: box.max.x, minZ: box.min.z, maxZ: box.max.z };
}

function floorTriangles(object: THREE.Object3D): WalkableTriangle[] {
  const triangles: WalkableTriangle[] = [];
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const position = child.geometry.getAttribute("position");
    const index = child.geometry.getIndex();
    if (!position) return;
    const count = index?.count ?? position.count;
    for (let offset = 0; offset + 2 < count; offset += 3) {
      a.fromBufferAttribute(position, index?.getX(offset) ?? offset).applyMatrix4(child.matrixWorld);
      b.fromBufferAttribute(position, index?.getX(offset + 1) ?? offset + 1).applyMatrix4(child.matrixWorld);
      c.fromBufferAttribute(position, index?.getX(offset + 2) ?? offset + 2).applyMatrix4(child.matrixWorld);
      if (Math.max(a.y, b.y, c.y) - Math.min(a.y, b.y, c.y) > 0.08) continue;
      if (Math.abs((b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x)) < 1e-5) continue;
      triangles.push([[a.x, a.z], [b.x, b.z], [c.x, c.z]]);
    }
  });
  return triangles;
}

export function createGridFromSceneObjects(
  objects: SceneObject[],
  options: { cellSize?: number; clearance?: number } = {},
): WalkableGrid {
  const floor: WalkableTriangle[] = [];
  const obstacles: ObstacleFootprint[] = [];
  const doors: Footprint[] = [];

  for (const record of objects) {
    if (!record.object.visible) continue;
    record.object.updateWorldMatrix(true, true);
    // V3 drops the FLOOR__ prefix while retaining the same visitor-floor mesh.
    if (/^(?:FLOOR__)?area_visitor$/i.test(record.name)) {
      floor.push(...floorTriangles(record.object));
      continue;
    }
    const area = footprint(record.object);
    if (!area) continue;
    if (/^DOOR__/i.test(record.name)) {
      doors.push(area);
      continue;
    }
    const kind = obstacleKind(record.name);
    if (kind) obstacles.push({ ...area, kind });
  }

  if (!floor.length) throw new Error("Permukaan lantai untuk navigasi tidak ditemukan dalam model GLB.");
  return createWalkableGrid({
    floor,
    obstacles,
    doors,
    cellSize: options.cellSize ?? 0.6,
    clearance: options.clearance ?? 0.4,
  });
}
