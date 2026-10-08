export type Point2 = [x: number, z: number];
export type Point3 = [x: number, y: number, z: number];

/**
 * Segitiga permukaan lantai dalam koordinat dunia. Komponen Y disimpan supaya
 * rute dapat digambar menempel pada lantai yang benar, termasuk pada model
 * yang berisi lebih dari satu lantai.
 */
export type WalkableTriangle = [Point3, Point3, Point3];

/** Penghalang berbentuk segitiga pada bidang XZ, hasil proyeksi geometri asli. */
export type ObstacleTriangle = { triangle: [Point2, Point2, Point2]; kind: "solid" | "glass" };

export type Footprint = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

export type ObstacleFootprint = Footprint & { kind: "solid" | "glass" };

export type WalkableGrid = {
  minX: number;
  minZ: number;
  width: number;
  height: number;
  cellSize: number;
  open: Uint8Array;
  /** Ketinggian lantai per sel. NaN pada sel tanpa lantai. */
  elevation: Float32Array;
  /** Ketinggian acuan lantai yang dipakai grid ini. */
  levelY: number;
};

type GridInput = {
  floor: WalkableTriangle[];
  obstacles: ObstacleFootprint[];
  doors: Footprint[];
  cellSize: number;
  clearance: number;
  /** Penghalang presisi per segitiga. Dipakai bersama `obstacles`. */
  obstacleTriangles?: ObstacleTriangle[];
};

function containsTriangle([a, b, c]: [Point2, Point2, Point2], x: number, z: number) {
  const cross = (p: Point2, q: Point2) => (q[0] - p[0]) * (z - p[1]) - (q[1] - p[1]) * (x - p[0]);
  const ab = cross(a, b);
  const bc = cross(b, c);
  const ca = cross(c, a);
  return (ab >= -1e-6 && bc >= -1e-6 && ca >= -1e-6) ||
    (ab <= 1e-6 && bc <= 1e-6 && ca <= 1e-6);
}

/** Proyeksi XZ dari segitiga lantai. */
function flatten([a, b, c]: WalkableTriangle): [Point2, Point2, Point2] {
  return [[a[0], a[2]], [b[0], b[2]], [c[0], c[2]]];
}

/** Interpolasi ketinggian lantai di dalam segitiga (barycentric). */
function triangleElevation([a, b, c]: WalkableTriangle, x: number, z: number) {
  const denominator = (b[2] - c[2]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[2] - c[2]);
  if (Math.abs(denominator) < 1e-12) return (a[1] + b[1] + c[1]) / 3;
  const wa = ((b[2] - c[2]) * (x - c[0]) + (c[0] - b[0]) * (z - c[2])) / denominator;
  const wb = ((c[2] - a[2]) * (x - c[0]) + (a[0] - c[0]) * (z - c[2])) / denominator;
  return wa * a[1] + wb * b[1] + (1 - wa - wb) * c[1];
}

function gridIndex(grid: WalkableGrid, x: number, z: number) {
  const column = Math.floor((x - grid.minX) / grid.cellSize);
  const row = Math.floor((z - grid.minZ) / grid.cellSize);
  if (column < 0 || column >= grid.width || row < 0 || row >= grid.height) return -1;
  return row * grid.width + column;
}

function gridPoint(grid: WalkableGrid, index: number): Point2 {
  return [
    grid.minX + ((index % grid.width) + 0.5) * grid.cellSize,
    grid.minZ + (Math.floor(index / grid.width) + 0.5) * grid.cellSize,
  ];
}

/**
 * Bukaan pintu. Orientasi diambil dari bentuk pintu itu sendiri: sisi tipis
 * adalah tebal dinding yang ditembus, sisi lebar adalah lebar bukaan. Dengan
 * begitu pintu tetap dikenali tanpa perlu dicocokkan ke objek dinding mana pun.
 */
function inDoorOpening(door: Footprint, x: number, z: number, clearance: number) {
  const spanX = door.maxX - door.minX;
  const spanZ = door.maxZ - door.minZ;
  const thinAxisIsX = spanX <= spanZ;
  // Sisi tipis dilebarkan agar bukaan menembus seluruh tebal dinding; sisi
  // lebar dipersempit agar kusen tidak ikut terbuka.
  const shrink = Math.min(clearance, Math.max(spanX, spanZ) / 4);
  return thinAxisIsX
    ? x >= door.minX - clearance && x <= door.maxX + clearance &&
      z >= door.minZ + shrink && z <= door.maxZ - shrink
    : z >= door.minZ - clearance && z <= door.maxZ + clearance &&
      x >= door.minX + shrink && x <= door.maxX - shrink;
}

export function createWalkableGrid({ floor, obstacles, doors, cellSize, clearance, obstacleTriangles = [] }: GridInput): WalkableGrid {
  if (!floor.length || cellSize <= 0 || clearance < 0) throw new Error("Geometri lantai atau ukuran grid tidak valid.");
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minZ = Number.POSITIVE_INFINITY;
  let maxZ = Number.NEGATIVE_INFINITY;
  let levelTotal = 0;
  for (const triangle of floor) {
    for (const vertex of triangle) {
      if (vertex[0] < minX) minX = vertex[0];
      if (vertex[0] > maxX) maxX = vertex[0];
      if (vertex[2] < minZ) minZ = vertex[2];
      if (vertex[2] > maxZ) maxZ = vertex[2];
      levelTotal += vertex[1];
    }
  }
  const width = Math.ceil((maxX - minX) / cellSize);
  const height = Math.ceil((maxZ - minZ) / cellSize);
  if (width * height > 1_500_000) throw new Error("Grid navigasi terlalu besar untuk diproses.");
  const grid: WalkableGrid = {
    minX,
    minZ,
    width,
    height,
    cellSize,
    open: new Uint8Array(width * height),
    elevation: new Float32Array(width * height).fill(Number.NaN),
    levelY: levelTotal / (floor.length * 3),
  };

  const rasterize = (
    triangle: [Point2, Point2, Point2],
    margin: number,
    visit: (index: number, x: number, z: number) => void,
  ) => {
    const xs = [triangle[0][0], triangle[1][0], triangle[2][0]];
    const zs = [triangle[0][1], triangle[1][1], triangle[2][1]];
    const firstColumn = Math.max(0, Math.floor((Math.min(...xs) - margin - minX) / cellSize));
    const lastColumn = Math.min(width - 1, Math.floor((Math.max(...xs) + margin - minX) / cellSize));
    const firstRow = Math.max(0, Math.floor((Math.min(...zs) - margin - minZ) / cellSize));
    const lastRow = Math.min(height - 1, Math.floor((Math.max(...zs) + margin - minZ) / cellSize));
    for (let row = firstRow; row <= lastRow; row += 1) {
      for (let column = firstColumn; column <= lastColumn; column += 1) {
        const x = minX + (column + 0.5) * cellSize;
        const z = minZ + (row + 0.5) * cellSize;
        visit(row * width + column, x, z);
      }
    }
  };

  for (const triangle of floor) {
    const flat = flatten(triangle);
    rasterize(flat, 0, (index, x, z) => {
      if (!containsTriangle(flat, x, z)) return;
      grid.open[index] = 1;
      const y = triangleElevation(triangle, x, z);
      // Permukaan teratas yang menang, supaya rute tidak tenggelam ke pelat bawah.
      if (Number.isNaN(grid.elevation[index]) || y > grid.elevation[index]) grid.elevation[index] = y;
    });
  }

  // Kaca dicatat terpisah supaya bukaan pintu hanya menembus dinding kaca,
  // bukan tembok atau pilar yang kebetulan berdekatan dengan sebuah pintu.
  const glassBlocked = new Uint8Array(width * height);

  const applyFootprint = (obstacle: ObstacleFootprint) => {
    const firstColumn = Math.max(0, Math.floor((obstacle.minX - clearance - minX) / cellSize));
    const lastColumn = Math.min(width - 1, Math.floor((obstacle.maxX + clearance - minX) / cellSize));
    const firstRow = Math.max(0, Math.floor((obstacle.minZ - clearance - minZ) / cellSize));
    const lastRow = Math.min(height - 1, Math.floor((obstacle.maxZ + clearance - minZ) / cellSize));
    for (let row = firstRow; row <= lastRow; row += 1) {
      const z = minZ + (row + 0.5) * cellSize;
      if (z < obstacle.minZ - clearance || z > obstacle.maxZ + clearance) continue;
      for (let column = firstColumn; column <= lastColumn; column += 1) {
        const x = minX + (column + 0.5) * cellSize;
        if (x < obstacle.minX - clearance || x > obstacle.maxX + clearance) continue;
        const index = row * width + column;
        if (obstacle.kind === "glass") glassBlocked[index] = 1;
        else grid.open[index] = 0;
      }
    }
  };

  for (const obstacle of obstacles) applyFootprint(obstacle);

  // Penghalang per segitiga mengikuti bentuk asli objek, jadi dinding miring
  // tidak lagi memblokir persegi besar seperti pada pendekatan kotak pembatas.
  for (const { triangle, kind } of obstacleTriangles) {
    rasterize(triangle, clearance, (index, x, z) => {
      if (!grid.open[index]) return;
      if (!containsTriangleWithin(triangle, x, z, clearance)) return;
      if (kind === "glass") glassBlocked[index] = 1;
      else grid.open[index] = 0;
    });
  }

  for (let index = 0; index < glassBlocked.length; index += 1) {
    if (!glassBlocked[index] || !grid.open[index]) continue;
    const x = minX + ((index % width) + 0.5) * cellSize;
    const z = minZ + (Math.floor(index / width) + 0.5) * cellSize;
    if (doors.some((door) => inDoorOpening(door, x, z, clearance))) continue;
    grid.open[index] = 0;
  }

  return grid;
}

/** Jarak titik ke segitiga pada bidang XZ, dipakai untuk menambah jarak aman. */
function containsTriangleWithin(triangle: [Point2, Point2, Point2], x: number, z: number, margin: number) {
  if (containsTriangle(triangle, x, z)) return true;
  if (margin <= 0) return false;
  const limit = margin * margin;
  for (let index = 0; index < 3; index += 1) {
    const a = triangle[index];
    const b = triangle[(index + 1) % 3];
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const lengthSquared = dx * dx + dz * dz;
    const t = lengthSquared < 1e-12 ? 0 : Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / lengthSquared));
    const distanceSquared = (x - (a[0] + t * dx)) ** 2 + (z - (a[1] + t * dz)) ** 2;
    if (distanceSquared <= limit) return true;
  }
  return false;
}

/** Ketinggian lantai pada sebuah titik. Jatuh ke ketinggian acuan bila tidak ada data. */
export function elevationAt(grid: WalkableGrid, x: number, z: number): number {
  const index = gridIndex(grid, x, z);
  if (index >= 0 && !Number.isNaN(grid.elevation[index])) return grid.elevation[index];
  return grid.levelY;
}

type Components = { label: Int32Array; sizes: number[]; largest: number };

const componentCache = new WeakMap<Uint8Array, Components>();

/**
 * Kelompokkan sel yang saling terhubung. Lantai di dalam unit tertutup menjadi
 * kelompok tersendiri, sehingga titik awal dan tujuan dapat diarahkan ke sel
 * yang benar-benar dapat dicapai, bukan ke sel terdekat yang terkurung dinding.
 */
function components(grid: WalkableGrid): Components {
  const cached = componentCache.get(grid.open);
  if (cached) return cached;
  const label = new Int32Array(grid.open.length).fill(-1);
  const sizes: number[] = [];
  const stack: number[] = [];
  for (let seed = 0; seed < grid.open.length; seed += 1) {
    if (!grid.open[seed] || label[seed] >= 0) continue;
    const id = sizes.length;
    label[seed] = id;
    stack.push(seed);
    let size = 0;
    while (stack.length) {
      const index = stack.pop() as number;
      size += 1;
      const row = Math.floor(index / grid.width);
      const column = index % grid.width;
      for (let dz = -1; dz <= 1; dz += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (!dx && !dz) continue;
          const nextRow = row + dz;
          const nextColumn = column + dx;
          if (nextRow < 0 || nextRow >= grid.height || nextColumn < 0 || nextColumn >= grid.width) continue;
          const next = nextRow * grid.width + nextColumn;
          if (!grid.open[next] || label[next] >= 0) continue;
          if (dx && dz && (!grid.open[row * grid.width + nextColumn] || !grid.open[nextRow * grid.width + column])) continue;
          label[next] = id;
          stack.push(next);
        }
      }
    }
    sizes.push(size);
  }
  let largest = -1;
  sizes.forEach((size, id) => {
    if (largest < 0 || size > sizes[largest]) largest = id;
  });
  const result: Components = { label, sizes, largest };
  componentCache.set(grid.open, result);
  return result;
}

function nearestOpenIndex(grid: WalkableGrid, point: Point2, component?: number) {
  const label = component === undefined ? null : components(grid).label;
  let bestIndex = -1;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let index = 0; index < grid.open.length; index += 1) {
    if (!grid.open[index]) continue;
    if (label && label[index] !== component) continue;
    const [x, z] = gridPoint(grid, index);
    const distance = (x - point[0]) ** 2 + (z - point[1]) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  }
  return bestIndex;
}

/** Kantong lantai sekecil ini dianggap ruang tertutup, bukan area publik. */
const ENCLOSED_POCKET_RATIO = 0.05;

/**
 * Sel berjalan terdekat. Bila sel itu berada di kantong tertutup, misalnya
 * lantai di dalam sebuah unit tenant, titik dipindah ke area publik terdekat.
 */
function reachableIndex(grid: WalkableGrid, point: Point2) {
  const groups = components(grid);
  const index = nearestOpenIndex(grid, point);
  if (index < 0 || groups.largest < 0) return index;
  const size = groups.sizes[groups.label[index]];
  if (size >= groups.sizes[groups.largest] * ENCLOSED_POCKET_RATIO) return index;
  return nearestOpenIndex(grid, point, groups.largest);
}

export function snapToWalkable(grid: WalkableGrid, point: Point2): Point2 | null {
  const index = reachableIndex(grid, point);
  return index < 0 ? null : gridPoint(grid, index);
}

/** Jumlah kelompok lantai yang saling terhubung. Dipakai pengujian dan diagnosa. */
export function walkableComponentCount(grid: WalkableGrid): number {
  return components(grid).sizes.length;
}

function segmentIsOpen(grid: WalkableGrid, start: Point2, end: Point2) {
  const distance = Math.hypot(end[0] - start[0], end[1] - start[1]);
  const samples = Math.max(1, Math.ceil(distance / (grid.cellSize * 0.25)));
  for (let step = 0; step <= samples; step += 1) {
    const progress = step / samples;
    const index = gridIndex(grid, start[0] + (end[0] - start[0]) * progress, start[1] + (end[1] - start[1]) * progress);
    if (index < 0 || !grid.open[index]) return false;
  }
  return true;
}

type QueueEntry = { index: number; score: number };

function pushQueue(queue: QueueEntry[], entry: QueueEntry) {
  queue.push(entry);
  let child = queue.length - 1;
  while (child > 0) {
    const parent = (child - 1) >> 1;
    if (queue[parent].score <= entry.score) break;
    queue[child] = queue[parent];
    child = parent;
  }
  queue[child] = entry;
}

function popQueue(queue: QueueEntry[]) {
  const root = queue[0];
  const last = queue.pop();
  if (!last || !queue.length) return root;
  let parent = 0;
  while (parent * 2 + 1 < queue.length) {
    let child = parent * 2 + 1;
    if (child + 1 < queue.length && queue[child + 1].score < queue[child].score) child += 1;
    if (last.score <= queue[child].score) break;
    queue[parent] = queue[child];
    parent = child;
  }
  queue[parent] = last;
  return root;
}

export function findWalkableRoute(grid: WalkableGrid, start: Point2, destination: Point2): Point2[] | null {
  const groups = components(grid);
  // Titik awal di dalam unit tertutup dipindah ke area publik terdekat.
  const startIndex = reachableIndex(grid, start);
  const destinationIndex = reachableIndex(grid, destination);
  if (startIndex < 0 || destinationIndex < 0) return null;
  // Tujuan yang terkurung dinding dilaporkan sebagai tidak terjangkau, bukan
  // diganti diam-diam dengan titik lain. Rute ke sebuah objek ditangani oleh
  // findWalkableRouteToTarget yang menelusuri sisi-sisi objek.
  if (groups.label[startIndex] !== groups.label[destinationIndex]) return null;
  if (startIndex === destinationIndex) return null;

  const cost = new Float64Array(grid.open.length).fill(Number.POSITIVE_INFINITY);
  const previous = new Int32Array(grid.open.length).fill(-1);
  const settled = new Uint8Array(grid.open.length);
  const queue: QueueEntry[] = [];
  const goal = gridPoint(grid, destinationIndex);
  cost[startIndex] = 0;
  pushQueue(queue, { index: startIndex, score: 0 });
  const neighbors = [-1, 0, 1];

  while (queue.length) {
    const current = popQueue(queue);
    if (settled[current.index]) continue;
    settled[current.index] = 1;
    if (current.index === destinationIndex) break;
    const row = Math.floor(current.index / grid.width);
    const column = current.index % grid.width;
    for (const dz of neighbors) {
      for (const dx of neighbors) {
        if (!dx && !dz) continue;
        const nextRow = row + dz;
        const nextColumn = column + dx;
        if (nextRow < 0 || nextRow >= grid.height || nextColumn < 0 || nextColumn >= grid.width) continue;
        const nextIndex = nextRow * grid.width + nextColumn;
        if (!grid.open[nextIndex] || settled[nextIndex]) continue;
        if (dx && dz && (!grid.open[row * grid.width + nextColumn] || !grid.open[nextRow * grid.width + column])) continue;
        const nextCost = cost[current.index] + Math.hypot(dx, dz);
        if (nextCost >= cost[nextIndex]) continue;
        cost[nextIndex] = nextCost;
        previous[nextIndex] = current.index;
        const nextPoint = gridPoint(grid, nextIndex);
        pushQueue(queue, { index: nextIndex, score: nextCost + Math.hypot(nextPoint[0] - goal[0], nextPoint[1] - goal[1]) / grid.cellSize });
      }
    }
  }

  if (previous[destinationIndex] < 0) return null;
  return tracePath(grid, previous, startIndex, destinationIndex);
}

/** Susun ulang jalur dari tabel `previous`, lalu buang titik yang segaris. */
function tracePath(grid: WalkableGrid, previous: Int32Array, startIndex: number, destinationIndex: number): Point2[] {
  const raw: Point2[] = [];
  for (let index = destinationIndex; index >= 0; index = previous[index]) {
    raw.push(gridPoint(grid, index));
    if (index === startIndex) break;
  }
  raw.reverse();

  const simplified: Point2[] = [raw[0]];
  let anchor = 0;
  while (anchor < raw.length - 1) {
    let next = Math.min(raw.length - 1, anchor + 64);
    while (next > anchor + 1 && !segmentIsOpen(grid, raw[anchor], raw[next])) next -= 1;
    simplified.push(raw[next]);
    anchor = next;
  }
  return simplified;
}

export type TargetRect = { minX: number; maxX: number; minZ: number; maxZ: number };
export type TargetEntryDoor = { side: "NORTH" | "EAST" | "SOUTH" | "WEST"; open: boolean; position?: number };

export function openTargetEntryDoors(grid: WalkableGrid, target: TargetRect, entryDoors: readonly TargetEntryDoor[]): WalkableGrid {
  const next: WalkableGrid = { ...grid, open: grid.open.slice(), elevation: grid.elevation.slice() };
  const openingHalfWidth = Math.max(grid.cellSize * 1.5, 0.8);
  const openingDepth = Math.max(grid.cellSize * 2.5, 1.2);
  const width = Math.max(target.maxX - target.minX, grid.cellSize);
  const depth = Math.max(target.maxZ - target.minZ, grid.cellSize);
  const clearCell = (x: number, z: number) => {
    const column = Math.floor((x - grid.minX) / grid.cellSize);
    const row = Math.floor((z - grid.minZ) / grid.cellSize);
    if (column < 0 || column >= grid.width || row < 0 || row >= grid.height) return;
    next.open[row * grid.width + column] = 1;
  };
  entryDoors.filter((door) => door.open).slice(0, 4).forEach((door) => {
    const ratio = Math.max(0, Math.min(100, door.position ?? 50)) / 100;
    const centerX = target.minX + width * ratio;
    const centerZ = target.minZ + depth * ratio;
    const perpendicularSteps = Math.ceil((openingHalfWidth * 2) / grid.cellSize);
    const depthSteps = Math.ceil(openingDepth / grid.cellSize);
    for (let along = -perpendicularSteps; along <= perpendicularSteps; along += 1) {
      for (let away = 0; away <= depthSteps; away += 1) {
        if (door.side === "NORTH") clearCell(centerX + along * grid.cellSize, target.minZ - away * grid.cellSize);
        if (door.side === "SOUTH") clearCell(centerX + along * grid.cellSize, target.maxZ + away * grid.cellSize);
        if (door.side === "WEST") clearCell(target.minX - away * grid.cellSize, centerZ + along * grid.cellSize);
        if (door.side === "EAST") clearCell(target.maxX + away * grid.cellSize, centerZ + along * grid.cellSize);
      }
    }
  });
  return next;
}

function distanceToTargetRect(point: Point2, target: TargetRect) {
  const dx = Math.max(target.minX - point[0], 0, point[0] - target.maxX);
  const dz = Math.max(target.minZ - point[1], 0, point[1] - target.maxZ);
  return Math.hypot(dx, dz);
}

/**
 * Route to the reachable side of a model object instead of routing to its
 * center. This keeps the final route point on the walkable floor immediately
 * beside the target, even when the target itself is a solid room/fixture.
 */
export function findWalkableRouteToTarget(
  grid: WalkableGrid,
  start: Point2,
  target: TargetRect,
  entryDoors?: readonly TargetEntryDoor[],
): Point2[] | null {
  const width = Math.max(target.maxX - target.minX, grid.cellSize);
  const depth = Math.max(target.maxZ - target.minZ, grid.cellSize);
  const samples = Math.max(2, Math.ceil(Math.max(width, depth) / grid.cellSize));
  const candidates: Point2[] = [];
  const entryOffset = Math.max(grid.cellSize * 0.75, 0.2);
  const addSideCandidate = (side: TargetEntryDoor["side"], position: number) => {
    const ratio = Math.max(0, Math.min(100, position)) / 100;
    if (side === "NORTH") candidates.push([target.minX + width * ratio, target.minZ - entryOffset]);
    if (side === "SOUTH") candidates.push([target.minX + width * ratio, target.maxZ + entryOffset]);
    if (side === "WEST") candidates.push([target.minX - entryOffset, target.minZ + depth * ratio]);
    if (side === "EAST") candidates.push([target.maxX + entryOffset, target.minZ + depth * ratio]);
  };
  if (entryDoors !== undefined) {
    entryDoors.filter((door) => door.open).slice(0, 4).forEach((door) => addSideCandidate(door.side, door.position ?? 50));
  } else {
    candidates.push([(target.minX + target.maxX) / 2, (target.minZ + target.maxZ) / 2]);
    for (let index = 0; index <= samples; index += 1) {
      const x = target.minX + (width * index) / samples;
      const z = target.minZ + (depth * index) / samples;
      candidates.push([x, target.minZ], [x, target.maxZ], [target.minX, z], [target.maxX, z]);
    }
  }
  if (!candidates.length) return null;

  // Semua titik sisi dicari dalam satu penelusuran Dijkstra dari titik awal,
  // bukan satu A* per titik. Objek besar seperti baggage claim punya puluhan
  // titik sisi, dan cara lama menelusuri grid sebanyak itu.
  const groups = components(grid);
  const startIndex = reachableIndex(grid, start);
  if (startIndex < 0) return null;
  const goals = new Map<number, number>();
  for (const candidate of candidates) {
    const index = reachableIndex(grid, candidate);
    if (index < 0 || index === startIndex || groups.label[index] !== groups.label[startIndex]) continue;
    const targetDistance = distanceToTargetRect(gridPoint(grid, index), target);
    goals.set(index, Math.min(goals.get(index) ?? Number.POSITIVE_INFINITY, targetDistance));
  }
  if (!goals.size) return null;

  const cost = new Float64Array(grid.open.length).fill(Number.POSITIVE_INFINITY);
  const previous = new Int32Array(grid.open.length).fill(-1);
  const settled = new Uint8Array(grid.open.length);
  const queue: QueueEntry[] = [];
  cost[startIndex] = 0;
  pushQueue(queue, { index: startIndex, score: 0 });
  let remaining = goals.size;
  let best: { index: number; cost: number; targetDistance: number } | null = null;
  while (queue.length && remaining > 0) {
    const current = popQueue(queue);
    if (settled[current.index]) continue;
    settled[current.index] = 1;
    // Titik yang tersisa tidak mungkin lebih dekat dari rute terbaik.
    if (best && current.score > best.cost + 1e-6) break;
    const targetDistance = goals.get(current.index);
    if (targetDistance !== undefined) {
      remaining -= 1;
      if (!best || current.score < best.cost - 1e-6 ||
        (Math.abs(current.score - best.cost) <= 1e-6 && targetDistance < best.targetDistance)) {
        best = { index: current.index, cost: current.score, targetDistance };
      }
    }
    const row = Math.floor(current.index / grid.width);
    const column = current.index % grid.width;
    for (let dz = -1; dz <= 1; dz += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if (!dx && !dz) continue;
        const nextRow = row + dz;
        const nextColumn = column + dx;
        if (nextRow < 0 || nextRow >= grid.height || nextColumn < 0 || nextColumn >= grid.width) continue;
        const nextIndex = nextRow * grid.width + nextColumn;
        if (!grid.open[nextIndex] || settled[nextIndex]) continue;
        if (dx && dz && (!grid.open[row * grid.width + nextColumn] || !grid.open[nextRow * grid.width + column])) continue;
        const nextCost = cost[current.index] + Math.hypot(dx, dz);
        if (nextCost >= cost[nextIndex]) continue;
        cost[nextIndex] = nextCost;
        previous[nextIndex] = current.index;
        pushQueue(queue, { index: nextIndex, score: nextCost });
      }
    }
  }
  return best ? tracePath(grid, previous, startIndex, best.index) : null;
}
