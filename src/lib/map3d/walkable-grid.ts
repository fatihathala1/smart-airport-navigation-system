export type Point2 = [x: number, z: number];
export type WalkableTriangle = [Point2, Point2, Point2];

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
};

type GridInput = {
  floor: WalkableTriangle[];
  obstacles: ObstacleFootprint[];
  doors: Footprint[];
  cellSize: number;
  clearance: number;
};

function containsTriangle([a, b, c]: WalkableTriangle, x: number, z: number) {
  const cross = (p: Point2, q: Point2) => (q[0] - p[0]) * (z - p[1]) - (q[1] - p[1]) * (x - p[0]);
  const ab = cross(a, b);
  const bc = cross(b, c);
  const ca = cross(c, a);
  return (ab >= -1e-6 && bc >= -1e-6 && ca >= -1e-6) ||
    (ab <= 1e-6 && bc <= 1e-6 && ca <= 1e-6);
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

function inDoorOpening(door: Footprint, obstacle: Footprint, x: number, z: number, clearance: number) {
  const wallRunsAlongZ = obstacle.maxX - obstacle.minX < obstacle.maxZ - obstacle.minZ;
  return wallRunsAlongZ
    ? x >= door.minX - clearance && x <= door.maxX + clearance &&
      z >= door.minZ + clearance && z <= door.maxZ - clearance
    : z >= door.minZ - clearance && z <= door.maxZ + clearance &&
      x >= door.minX + clearance && x <= door.maxX - clearance;
}

export function createWalkableGrid({ floor, obstacles, doors, cellSize, clearance }: GridInput): WalkableGrid {
  if (!floor.length || cellSize <= 0 || clearance < 0) throw new Error("Geometri lantai atau ukuran grid tidak valid.");
  const coordinates = floor.flat(2);
  const minX = Math.min(...coordinates.filter((_, index) => index % 2 === 0));
  const maxX = Math.max(...coordinates.filter((_, index) => index % 2 === 0));
  const minZ = Math.min(...coordinates.filter((_, index) => index % 2 === 1));
  const maxZ = Math.max(...coordinates.filter((_, index) => index % 2 === 1));
  const width = Math.ceil((maxX - minX) / cellSize);
  const height = Math.ceil((maxZ - minZ) / cellSize);
  if (width * height > 1_500_000) throw new Error("Grid navigasi terlalu besar untuk diproses.");
  const grid: WalkableGrid = { minX, minZ, width, height, cellSize, open: new Uint8Array(width * height) };

  for (const triangle of floor) {
    const triangleMinX = Math.min(...triangle.map((point) => point[0]));
    const triangleMaxX = Math.max(...triangle.map((point) => point[0]));
    const triangleMinZ = Math.min(...triangle.map((point) => point[1]));
    const triangleMaxZ = Math.max(...triangle.map((point) => point[1]));
    const firstColumn = Math.max(0, Math.floor((triangleMinX - minX) / cellSize));
    const lastColumn = Math.min(width - 1, Math.floor((triangleMaxX - minX) / cellSize));
    const firstRow = Math.max(0, Math.floor((triangleMinZ - minZ) / cellSize));
    const lastRow = Math.min(height - 1, Math.floor((triangleMaxZ - minZ) / cellSize));
    for (let row = firstRow; row <= lastRow; row += 1) {
      for (let column = firstColumn; column <= lastColumn; column += 1) {
        const x = minX + (column + 0.5) * cellSize;
        const z = minZ + (row + 0.5) * cellSize;
        if (containsTriangle(triangle, x, z)) grid.open[row * width + column] = 1;
      }
    }
  }

  for (const obstacle of obstacles) {
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
        if (obstacle.kind === "glass" && doors.some((door) => inDoorOpening(door, obstacle, x, z, clearance))) continue;
        grid.open[row * width + column] = 0;
      }
    }
  }

  return grid;
}

function nearestOpenIndex(grid: WalkableGrid, point: Point2) {
  let bestIndex = -1;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let index = 0; index < grid.open.length; index += 1) {
    if (!grid.open[index]) continue;
    const [x, z] = gridPoint(grid, index);
    const distance = (x - point[0]) ** 2 + (z - point[1]) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  }
  return bestIndex;
}

export function snapToWalkable(grid: WalkableGrid, point: Point2): Point2 | null {
  const index = nearestOpenIndex(grid, point);
  return index < 0 ? null : gridPoint(grid, index);
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
  const startIndex = nearestOpenIndex(grid, start);
  const destinationIndex = nearestOpenIndex(grid, destination);
  if (startIndex < 0 || destinationIndex < 0) return null;
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
  const next: WalkableGrid = { ...grid, open: grid.open.slice() };
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

  let best: { route: Point2[]; targetDistance: number; length: number } | null = null;
  for (const candidate of candidates) {
    const route = findWalkableRoute(grid, start, candidate);
    if (!route) continue;
    const targetDistance = distanceToTargetRect(route.at(-1) ?? candidate, target);
    const length = route.reduce((total, point, index) => index === 0
      ? 0
      : total + Math.hypot(point[0] - route[index - 1][0], point[1] - route[index - 1][1]), 0);
    if (!best || length < best.length - 1e-6 ||
      (Math.abs(length - best.length) <= 1e-6 && targetDistance < best.targetDistance)) {
      best = { route, targetDistance, length };
    }
  }
  return best?.route ?? null;
}
