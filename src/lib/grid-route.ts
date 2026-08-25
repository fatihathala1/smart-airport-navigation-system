import { astar, buildWallSet, calcSegmentMeters } from "@/lib/astar";
import { gridToMapPoint } from "@/data/demo-wayfinding";
import {
  FLOOR1_ROW_MIN as T1_FLOOR1_ROW_MIN,
  STAIRCASE_L1 as T1_STAIRCASE_L1,
  STAIRCASE_L2 as T1_STAIRCASE_L2,
  T1_WALL_DATA,
} from "@/data/walls/t1";
import {
  FLOOR1_ROW_MIN as T2_FLOOR1_ROW_MIN,
  STAIRCASE_L1 as T2_STAIRCASE_L1,
  STAIRCASE_L2 as T2_STAIRCASE_L2,
  T2_WALL_DATA,
} from "@/data/walls/t2";
import type { DijkstraResult, GridPoint, RouteOptions, RouteSegment, TerminalCode, WayfindingNode } from "@/types";

const FLOOR_CHANGE_METERS = 12;

function pathToNearestReachable(start: GridPoint, target: GridPoint, walls: Set<string>, rows: number, cols: number) {
  const key = (point: GridPoint) => point.r * cols + point.c;
  const queue: GridPoint[] = [start];
  const parents = new Map<number, number | null>([[key(start), null]]);
  const points = new Map<number, GridPoint>([[key(start), start]]);
  let best = start;
  let bestDistance = Math.abs(start.r - target.r) + Math.abs(start.c - target.c);
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const current = queue[cursor];
    const distance = Math.abs(current.r - target.r) + Math.abs(current.c - target.c);
    if (distance < bestDistance) { best = current; bestDistance = distance; }
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as const) {
      const next = { r: current.r + dr, c: current.c + dc };
      const nextKey = key(next);
      if (next.r < 0 || next.r >= rows || next.c < 0 || next.c >= cols || walls.has(`${next.r},${next.c}`) || parents.has(nextKey)) continue;
      parents.set(nextKey, key(current));
      points.set(nextKey, next);
      queue.push(next);
    }
  }
  const path: GridPoint[] = [];
  let cursor: number | null = key(best);
  while (cursor != null) {
    path.unshift(points.get(cursor)!);
    cursor = parents.get(cursor) ?? null;
  }
  return { path, stepCount: Math.max(0, path.length - 1) };
}

function pathOrNearest(start: GridPoint, end: GridPoint, walls: Set<string>, rows: number, cols: number) {
  return astar(start.r, start.c, end.r, end.c, walls, rows, cols) ?? pathToNearestReachable(start, end, walls, rows, cols);
}

function compactPath(path: GridPoint[]) {
  if (path.length <= 2) return path;
  const compacted = [path[0]];
  for (let index = 1; index < path.length - 1; index += 1) {
    const previous = path[index - 1];
    const current = path[index];
    const next = path[index + 1];
    const sameDirection = current.r - previous.r === next.r - current.r && current.c - previous.c === next.c - current.c;
    if (!sameDirection) compacted.push(current);
  }
  compacted.push(path[path.length - 1]);
  return compacted;
}

function nearestWalkable(point: GridPoint, walls: Set<string>, rows: number, cols: number) {
  if (!walls.has(`${point.r},${point.c}`)) return point;
  for (let radius = 1; radius <= 12; radius += 1) {
    for (let dr = -radius; dr <= radius; dr += 1) {
      for (let dc = -radius; dc <= radius; dc += 1) {
        if (Math.abs(dr) !== radius && Math.abs(dc) !== radius) continue;
        const r = point.r + dr;
        const c = point.c + dc;
        if (r >= 0 && r < rows && c >= 0 && c < cols && !walls.has(`${r},${c}`)) return { r, c };
      }
    }
  }
  return point;
}

function pathNodes(path: GridPoint[], terminal: TerminalCode, floorId: string, prefix: string, startId?: string, endId?: string) {
  return compactPath(path).map((point, index, values): WayfindingNode => {
    const position = gridToMapPoint(terminal, floorId, point.r, point.c);
    return {
      id: index === 0 && startId ? startId : index === values.length - 1 && endId ? endId : `${prefix}-${index}`,
      floorId,
      floorLabel: floorId.endsWith("L1") ? "Lantai 1" : "Lantai 2",
      x: position.x,
      y: position.y,
      gridRow: point.r,
      gridCol: point.c,
    };
  });
}

function walkwaySegments(nodes: WayfindingNode[], prefix: string): RouteSegment[] {
  return nodes.slice(0, -1).map((from, index) => ({
    id: `${prefix}-${index}`,
    floorId: from.floorId,
    type: "WALKWAY",
    from,
    to: nodes[index + 1],
    distanceMeters: Math.round(Math.hypot((nodes[index + 1].gridRow ?? 0) - (from.gridRow ?? 0), (nodes[index + 1].gridCol ?? 0) - (from.gridCol ?? 0)) * 0.8),
  }));
}

export function findGridRoute(start: WayfindingNode | undefined, end: WayfindingNode | undefined, options: RouteOptions = {}): DijkstraResult | null {
  if (!start || !end || start.gridRow == null || start.gridCol == null || end.gridRow == null || end.gridCol == null) return null;
  const terminal = start.id.slice(0, 2) as TerminalCode;
  if (end.id.slice(0, 2) !== terminal) return null;
  const config = terminal === "T1"
    ? { wallData: T1_WALL_DATA, floor1Min: T1_FLOOR1_ROW_MIN, stairL1: T1_STAIRCASE_L1, stairL2: T1_STAIRCASE_L2 }
    : { wallData: T2_WALL_DATA, floor1Min: T2_FLOOR1_ROW_MIN, stairL1: T2_STAIRCASE_L1, stairL2: T2_STAIRCASE_L2 };
  const walls = buildWallSet(config.wallData.walls);
  const startGrid = nearestWalkable({ r: start.gridRow, c: start.gridCol }, walls, config.wallData.rows, config.wallData.cols);
  const endGrid = nearestWalkable({ r: end.gridRow, c: end.gridCol }, walls, config.wallData.rows, config.wallData.cols);

  if (start.floorId === end.floorId) {
    const result = pathOrNearest(startGrid, endGrid, walls, config.wallData.rows, config.wallData.cols);
    if (!result) return null;
    const nodes = pathNodes(result.path, terminal, start.floorId, `${terminal}-GRID`, start.id, end.id);
    const totalDistanceMeters = Math.round(calcSegmentMeters(result.path));
    const speed = options.walkingSpeedMetersPerMinute ?? 72;
    return { nodes, segments: walkwaySegments(nodes, `${terminal}-WALK`), totalDistanceMeters, estimatedMinutes: Math.max(1, Math.ceil(totalDistanceMeters / speed)), connectorInstructions: [] };
  }

  if (options.accessibleOnly) return null;
  const startOnL1 = start.gridRow >= config.floor1Min;
  const sourceStair = nearestWalkable(startOnL1 ? config.stairL1 : config.stairL2, walls, config.wallData.rows, config.wallData.cols);
  const targetStair = nearestWalkable(startOnL1 ? config.stairL2 : config.stairL1, walls, config.wallData.rows, config.wallData.cols);
  const first = pathOrNearest(startGrid, sourceStair, walls, config.wallData.rows, config.wallData.cols);
  const second = pathOrNearest(targetStair, endGrid, walls, config.wallData.rows, config.wallData.cols);
  if (!first || !second) return null;
  const firstNodes = pathNodes(first.path, terminal, start.floorId, `${terminal}-GRID-A`, start.id);
  const secondNodes = pathNodes(second.path, terminal, end.floorId, `${terminal}-GRID-B`, undefined, end.id);
  const connector: RouteSegment = { id: `${terminal}-FLOOR-CONNECTOR`, floorId: firstNodes.at(-1)!.floorId, type: "STAIRS", from: firstNodes.at(-1)!, to: secondNodes[0], distanceMeters: FLOOR_CHANGE_METERS };
  const totalDistanceMeters = Math.round(calcSegmentMeters(first.path) + calcSegmentMeters(second.path) + FLOOR_CHANGE_METERS);
  const speed = options.walkingSpeedMetersPerMinute ?? 72;
  return {
    nodes: [...firstNodes, ...secondNodes],
    segments: [...walkwaySegments(firstNodes, `${terminal}-WALK-A`), connector, ...walkwaySegments(secondNodes, `${terminal}-WALK-B`)],
    totalDistanceMeters,
    estimatedMinutes: Math.max(1, Math.ceil(totalDistanceMeters / speed)),
    connectorInstructions: [`Gunakan tangga dari ${start.floorLabel} ke ${end.floorLabel}`],
  };
}
