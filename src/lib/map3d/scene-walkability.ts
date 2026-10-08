import * as THREE from "three";
import {
  createWalkableGrid,
  type Footprint,
  type ObstacleTriangle,
  type Point2,
  type WalkableGrid,
  type WalkableTriangle,
} from "./walkable-grid";
import {
  detectFloorLevels,
  headroomFor,
  triangleAreaXZ,
  FLAT_TRIANGLE_TOLERANCE,
  type FloorLevel,
  type SurfaceTriangle,
} from "./floor-levels";

type SceneObject = { name: string; object: THREE.Object3D };

export type GridOptions = {
  cellSize?: number;
  clearance?: number;
  /**
   * Ketinggian lantai yang dipakai. Bila kosong, dipilih lantai dengan luas
   * permukaan terbesar pada model.
   */
  levelY?: number;
  /** Tinggi ruang yang dianggap menghalangi jalan di atas lantai. */
  headroom?: number;
};

export type SceneWalkability = {
  grid: WalkableGrid;
  level: FloorLevel;
  levels: FloorLevel[];
};

const DOOR_NAME = /(^|[_\-\s])(door|pintu)([_\-\s]|$)/i;
const GLASS_NAME = /(glass|kaca)/i;

/**
 * Penanda permukaan yang boleh dilalui pengunjung.
 *
 * Ini satu-satunya konvensi penamaan yang masih dibutuhkan model GLB. Alasannya
 * geometris: apron di luar gedung berada pada ketinggian yang sama persis
 * dengan lantai di dalam gedung, sehingga tidak ada petunjuk bentuk yang dapat
 * memisahkan keduanya. Bila tidak ada objek yang cocok, seluruh permukaan datar
 * pada lantai terluas dipakai sebagai cadangan.
 */
const WALKABLE_FLOOR_NAME = /(area[_\-\s]?visitor|walkable|area[_\-\s]?jalan|^floor__|nav[_\-\s]?floor)/i;

/** Objek penanda yang tidak pernah menghalangi jalan. */
const NON_BLOCKING_NAME = /(navigasi|navigation|marker|label|signage)/i;

type ObjectSurfaces = {
  record: SceneObject;
  /** Segitiga datar, kandidat permukaan lantai. */
  surfaces: SurfaceTriangle[];
  /** Semua segitiga, dipakai untuk memotong penghalang per tingkat. */
  triangles: { vertices: [THREE.Vector3, THREE.Vector3, THREE.Vector3]; minY: number; maxY: number }[];
  box: THREE.Box3;
};

function readTriangles(record: SceneObject): ObjectSurfaces {
  const surfaces: SurfaceTriangle[] = [];
  const triangles: ObjectSurfaces["triangles"] = [];
  const box = new THREE.Box3();
  record.object.traverse((child) => {
    if (!(child instanceof THREE.Mesh) || child.visible === false) return;
    const position = child.geometry.getAttribute("position");
    if (!position) return;
    const index = child.geometry.getIndex();
    const count = index?.count ?? position.count;
    for (let offset = 0; offset + 2 < count; offset += 3) {
      const vertices = [0, 1, 2].map((corner) =>
        new THREE.Vector3()
          .fromBufferAttribute(position, index?.getX(offset + corner) ?? offset + corner)
          .applyMatrix4(child.matrixWorld),
      ) as [THREE.Vector3, THREE.Vector3, THREE.Vector3];
      const [a, b, c] = vertices;
      const minY = Math.min(a.y, b.y, c.y);
      const maxY = Math.max(a.y, b.y, c.y);
      box.expandByPoint(a).expandByPoint(b).expandByPoint(c);
      triangles.push({ vertices, minY, maxY });
      if (maxY - minY > FLAT_TRIANGLE_TOLERANCE) continue;
      const area = triangleAreaXZ([a.x, a.y, a.z], [b.x, b.y, b.z], [c.x, c.y, c.z]);
      if (area < 1e-5) continue;
      surfaces.push({
        vertices: [[a.x, a.y, a.z], [b.x, b.y, b.z], [c.x, c.y, c.z]],
        area,
        y: (minY + maxY) / 2,
      });
    }
  });
  return { record, surfaces, triangles, box };
}

/**
 * Bangun grid jalan dari isi model.
 *
 * Lantai dikenali dari permukaan datar terluas, penghalang dari geometri yang
 * berada dalam rentang ketinggian pejalan kaki di atas lantai itu. Keduanya
 * tidak bergantung pada konvensi penamaan, sehingga model GLB baru dapat
 * dipakai tanpa mengubah kode.
 */
export function analyzeSceneWalkability(objects: SceneObject[], options: GridOptions = {}): SceneWalkability {
  const cellSize = options.cellSize ?? 0.6;
  const clearance = options.clearance ?? 0.4;
  const preferredHeadroom = options.headroom ?? 2.1;

  const parsed: ObjectSurfaces[] = [];
  for (const record of objects) {
    if (!record.object.visible) continue;
    record.object.updateWorldMatrix(true, true);
    parsed.push(readTriangles(record));
  }

  const floorObjects = parsed.filter((entry) => entry.surfaces.length && WALKABLE_FLOOR_NAME.test(entry.record.name));
  const floorSource = floorObjects.length ? floorObjects : parsed;
  const levels = detectFloorLevels(floorSource.flatMap((entry) => entry.surfaces));
  if (!levels.length) throw new Error("Permukaan lantai untuk navigasi tidak ditemukan dalam model GLB.");

  const wanted = options.levelY;
  const level = wanted === undefined
    ? levels[0]
    : [...levels].sort((left, right) => Math.abs(left.y - wanted) - Math.abs(right.y - wanted))[0];
  const headroom = headroomFor(level, levels, preferredHeadroom);
  const floorTop = level.maxY + FLAT_TRIANGLE_TOLERANCE;
  const bandBottom = level.y + 0.15;
  const bandTop = level.y + headroom;
  const onThisLevel = (y: number) => y >= level.minY - FLAT_TRIANGLE_TOLERANCE && y <= floorTop;

  const floor: WalkableTriangle[] = [];
  const obstacleTriangles: ObstacleTriangle[] = [];
  const doors: Footprint[] = [];
  const floorNames = new Set(floorSource.map((entry) => entry.record.name));

  for (const entry of floorSource) {
    for (const surface of entry.surfaces) {
      if (onThisLevel(surface.y)) floor.push(surface.vertices);
    }
  }

  for (const entry of parsed) {
    const { name } = entry.record;
    if (DOOR_NAME.test(name)) {
      if (!entry.box.isEmpty()) {
        doors.push({ minX: entry.box.min.x, maxX: entry.box.max.x, minZ: entry.box.min.z, maxZ: entry.box.max.z });
      }
      continue;
    }
    if (floorNames.has(name) || NON_BLOCKING_NAME.test(name)) continue;
    // Objek yang seluruhnya di luar rentang pejalan kaki tidak menghalangi:
    // plafon, lampu gantung, papan tergantung, dan pelat lantai di atasnya.
    if (entry.box.isEmpty() || entry.box.max.y < bandBottom || entry.box.min.y > bandTop) continue;

    const kind: ObstacleTriangle["kind"] = GLASS_NAME.test(name) ? "glass" : "solid";
    for (const triangle of entry.triangles) {
      if (triangle.maxY < bandBottom || triangle.minY > bandTop) continue;
      // Hanya bidang yang berdiri yang menghalangi. Bidang mendatar adalah
      // permukaan pijak, tutup meja, atau pelat hias, bukan dinding.
      if (triangle.maxY - triangle.minY <= FLAT_TRIANGLE_TOLERANCE) continue;
      // Sisi tebal pelat lantai tidak dihitung sebagai dinding.
      if (triangle.maxY <= floorTop) continue;
      const [a, b, c] = triangle.vertices;
      const flat: [Point2, Point2, Point2] = [[a.x, a.z], [b.x, b.z], [c.x, c.z]];
      const footprintArea = triangleAreaXZ([a.x, a.y, a.z], [b.x, b.y, b.z], [c.x, c.y, c.z]);
      // Dinding tegak memproyeksikan segitiga setipis garis. Diberi ketebalan
      // minimum supaya tetap memblokir sel grid yang dilaluinya.
      obstacleTriangles.push({ triangle: footprintArea < 1e-6 ? thicken(flat, cellSize * 0.5) : flat, kind });
    }
  }

  if (!floor.length) throw new Error("Permukaan lantai untuk navigasi tidak ditemukan dalam model GLB.");

  return {
    grid: createWalkableGrid({ floor, obstacles: [], doors, obstacleTriangles, cellSize, clearance }),
    level,
    levels,
  };
}

/** Beri ketebalan pada segitiga yang terproyeksi menjadi garis. */
function thicken(triangle: [Point2, Point2, Point2], amount: number): [Point2, Point2, Point2] {
  const xs = triangle.map((point) => point[0]);
  const zs = triangle.map((point) => point[1]);
  const spanX = Math.max(...xs) - Math.min(...xs);
  const spanZ = Math.max(...zs) - Math.min(...zs);
  const offsetX = spanX >= spanZ ? 0 : amount;
  const offsetZ = spanX >= spanZ ? amount : 0;
  return [
    [triangle[0][0] - offsetX, triangle[0][1] - offsetZ],
    [triangle[1][0] + offsetX, triangle[1][1] + offsetZ],
    [triangle[2][0] - offsetX, triangle[2][1] - offsetZ],
  ];
}

export function createGridFromSceneObjects(objects: SceneObject[], options: GridOptions = {}): WalkableGrid {
  return analyzeSceneWalkability(objects, options).grid;
}
