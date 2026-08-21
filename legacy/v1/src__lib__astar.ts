import type {
  AStarNode,
  GridPoint,
  PathResult,
  MultiPathResult,
  DestinationPoint,
} from "@/types";

// =============================================================================
// INTERNAL — A* single-floor pathfinding
// =============================================================================

function astarSingle(
  startR: number,
  startC: number,
  endR: number,
  endC: number,
  wallSet: Set<string>,
  rows: number,
  cols: number
): GridPoint[] | null {
  const key = (r: number, c: number): number => r * 10000 + c;
  const nodes = new Map<number, AStarNode>();

  const getNode = (r: number, c: number): AStarNode => {
    const k = key(r, c);
    if (!nodes.has(k)) nodes.set(k, { r, c, g: Infinity, f: Infinity, parent: null });
    return nodes.get(k)!;
  };

  const heuristic = (r: number, c: number): number =>
    Math.abs(r - endR) + Math.abs(c - endC);

  const isWall = (r: number, c: number): boolean => wallSet.has(`${r},${c}`);
  const inBounds = (r: number, c: number): boolean =>
    r >= 0 && r < rows && c >= 0 && c < cols;

  const dirs: [number, number][] = [
    [-1, 0], [1, 0], [0, -1], [0, 1],
    [-1, -1], [-1, 1], [1, -1], [1, 1],
  ];

  const open: AStarNode[] = [];
  const closed = new Set<number>();

  const startNode = getNode(startR, startC);
  startNode.g = 0;
  startNode.f = heuristic(startR, startC);
  open.push(startNode);

  while (open.length > 0) {
    open.sort((a, b) => a.f - b.f);
    const current = open.shift()!;
    const currentKey = key(current.r, current.c);
    if (closed.has(currentKey)) continue;
    closed.add(currentKey);

    if (current.r === endR && current.c === endC) {
      const path: GridPoint[] = [];
      let node: AStarNode | null = current;
      while (node !== null) {
        path.unshift({ r: node.r, c: node.c });
        node = node.parent;
      }
      return path;
    }

    for (const [dr, dc] of dirs) {
      const nr = current.r + dr;
      const nc = current.c + dc;
      if (!inBounds(nr, nc)) continue;
      if (isWall(nr, nc)) continue;
      const neighborKey = key(nr, nc);
      if (closed.has(neighborKey)) continue;
      const moveCost = dr !== 0 && dc !== 0 ? 1.414 : 1;
      const tentativeG = current.g + moveCost;
      const neighbor = getNode(nr, nc);
      if (tentativeG < neighbor.g) {
        neighbor.parent = current;
        neighbor.g = tentativeG;
        neighbor.f = tentativeG + heuristic(nr, nc);
        if (!open.includes(neighbor)) open.push(neighbor);
      }
    }
  }

  return null;
}

// =============================================================================
// PUBLIC — A* single-floor
// Dipakai jika start dan tujuan sudah pasti di lantai yang sama.
// =============================================================================

export function astar(
  startR: number,
  startC: number,
  endR: number,
  endC: number,
  wallSet: Set<string>,
  rows: number,
  cols: number
): PathResult | null {
  const path = astarSingle(startR, startC, endR, endC, wallSet, rows, cols);
  if (!path) return null;
  return { path, stepCount: path.length - 1 };
}

// =============================================================================
// PUBLIC — A* dengan deteksi lintas lantai otomatis
//
// Caller wajib menyuplai data tangga dari terminal yang aktif:
//   - staircaseL1 : titik tangga di Lantai 1 (DestinationPoint dari t1.ts / t2.ts)
//   - staircaseL2 : titik tangga di Lantai 2 (DestinationPoint dari t1.ts / t2.ts)
//   - floor1RowMin: batas baris minimum Lantai 1 (FLOOR1_ROW_MIN dari t1.ts / t2.ts)
//
// destId prefix:
//   "l1_" → tujuan di Lantai 1
//   "l2_" → tujuan di Lantai 2
// =============================================================================

export function astarWithStairs(
  startR: number,
  startC: number,
  destR: number,
  destC: number,
  destId: string,
  wallSet: Set<string>,
  rows: number,
  cols: number,
  staircaseL1: DestinationPoint,
  staircaseL2: DestinationPoint,
  floor1RowMin: number
): MultiPathResult | null {
  // Coba jalur langsung dulu (tidak perlu lintas lantai)
  const directPath = astarSingle(startR, startC, destR, destC, wallSet, rows, cols);
  if (directPath) {
    return {
      segments: [{ path: directPath, color: "#f39c12" }],
      totalSteps: directPath.length - 1,
      usedStairs: false,
    };
  }

  const isDestL1 = destId.startsWith("l1_");
  const isDestL2 = destId.startsWith("l2_");
  if (!isDestL1 && !isDestL2) return null;

  // Deteksi posisi start berdasarkan baris
  const startOnL1 = startR >= floor1RowMin;

  // Tentukan arah tangga sesuai asal → tujuan
  let midPoint: GridPoint;   // tangga di sisi asal
  let contPoint: GridPoint;  // tangga di sisi tujuan

  if (startOnL1 && isDestL2) {
    // Lantai 1 → Lantai 2: naik via tangga L1, turun di tangga L2
    midPoint  = { r: staircaseL1.r, c: staircaseL1.c };
    contPoint = { r: staircaseL2.r, c: staircaseL2.c };
  } else if (!startOnL1 && isDestL1) {
    // Lantai 2 → Lantai 1: naik via tangga L2, turun di tangga L1
    midPoint  = { r: staircaseL2.r, c: staircaseL2.c };
    contPoint = { r: staircaseL1.r, c: staircaseL1.c };
  } else {
    // Start dan tujuan di lantai yang sama tapi direct path gagal → tidak ada jalan
    return null;
  }

  const path1 = astarSingle(startR, startC, midPoint.r, midPoint.c, wallSet, rows, cols);
  if (!path1) return null;

  const path2 = astarSingle(contPoint.r, contPoint.c, destR, destC, wallSet, rows, cols);
  if (!path2) return null;

  return {
    segments: [
      { path: path1, color: "#f39c12" },
      { path: path2, color: "#58a6ff" },
    ],
    totalSteps: (path1.length - 1) + (path2.length - 1),
    usedStairs: true,
    stairsLabel: `${staircaseL1.label} → ${staircaseL2.label}`,
  };
}

// =============================================================================
// UTILS
// =============================================================================

/**
 * Bangun wallSet dari array string "r,c"
 */
export function buildWallSet(walls: string[]): Set<string> {
  return new Set(walls);
}

/**
 * Konversi koordinat grid ke koordinat SVG pixel.
 * Default cellSize = 6px (sesuai render MapCanvas).
 */
export function gridToSvg(
  r: number,
  c: number,
  cellSize: number = 6
): { x: number; y: number } {
  return {
    x: c * cellSize + cellSize / 2,
    y: r * cellSize + cellSize / 2,
  };
}

// =============================================================================
// DISTANCE METRIC
// =============================================================================

/**
 * Jarak fisik satu cell grid dalam meter.
 * Tune nilai ini agar sesuai dengan skala denah bandara.
 * Cara kalibrasi: ukur elemen fisik yang diketahui di denah
 * (mis. lebar koridor ~3 m) lalu hitung berapa cell lebarnya.
 *
 * @example
 * // Koridor 3 m = 4 cell → CELL_METERS = 3 / 4 = 0.75
 * // Untuk sekarang pakai 0.8 sebagai estimasi wajar bandara
 */
export const CELL_METERS = 0.8;

/**
 * Hitung jarak tempuh nyata satu segment path dalam meter.
 *
 * Gerakan ortogonal  (↑↓←→)  : 1 cell   = 1.000 × CELL_METERS
 * Gerakan diagonal   (↖↗↙↘)  : √2 cell  = 1.414 × CELL_METERS
 *
 * Konsisten dengan moveCost di astarSingle — tidak ada double-counting.
 */
export function calcSegmentMeters(
  path: GridPoint[],
  cellMeters: number = CELL_METERS
): number {
  let dist = 0;
  for (let i = 1; i < path.length; i++) {
    const dr = Math.abs(path[i].r - path[i - 1].r);
    const dc = Math.abs(path[i].c - path[i - 1].c);
    dist += dr > 0 && dc > 0 ? Math.SQRT2 : 1;
  }
  return dist * cellMeters;
}

/**
 * Hitung total jarak tempuh semua segment (termasuk lintas lantai) dalam meter.
 * Hasilnya dibulatkan ke meter terdekat untuk display.
 */
export function calcMultiPathMeters(
  segments: { path: GridPoint[] }[],
  cellMeters: number = CELL_METERS
): number {
  const total = segments.reduce(
    (sum, seg) => sum + calcSegmentMeters(seg.path, cellMeters),
    0
  );
  return Math.round(total);
}

/**
 * Estimasi waktu tempuh dalam menit.
 * Kecepatan jalan rata-rata di bandara ~80 m/menit
 * (lebih lambat dari 100 m/menit karena membawa koper, ramai, dll).
 *
 * Minimum 1 menit agar tidak tampil "0 menit" untuk rute sangat pendek.
 */
export const WALKING_SPEED_MPM = 80; // meter per menit

export function calcWalkMinutes(meters: number): number {
  return Math.max(1, Math.ceil(meters / WALKING_SPEED_MPM));
}