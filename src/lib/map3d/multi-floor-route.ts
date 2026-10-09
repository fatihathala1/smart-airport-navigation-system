import type * as THREE from "three";
import { FLOOR_LABELS, FLOOR_ORDER, type FloorId } from "./floors";
import { connectorAllows, connectorLabel, detectFloorConnectors, type FloorConnector } from "./floor-connectors";
import { analyzeAllLevels } from "./scene-walkability";
import {
  elevationAt,
  findWalkableRoute,
  findWalkableRouteToTarget,
  openTargetEntryDoors,
  snapToWalkable,
  type Point2,
  type Point3,
  type TargetEntryDoor,
  type TargetRect,
  type WalkableGrid,
} from "./walkable-grid";

/**
 * Navigasi untuk model bertingkat: satu grid jalan per lantai, disambung oleh
 * eskalator dan tangga. Rute di dalam satu lantai tetap memakai A* yang sama
 * seperti sebelumnya. Rute antarlantai mencoba setiap penghubung yang arahnya
 * sesuai, lalu memilih total jarak terpendek.
 */
export type FloorNavigation = {
  floors: FloorId[];
  grids: Partial<Record<FloorId, WalkableGrid>>;
  connectors: FloorConnector[];
};

export type RoutePlace = { floor: FloorId; point: Point2 };

export type RouteTarget = {
  floor: FloorId;
  rect: TargetRect;
  entryDoors?: readonly TargetEntryDoor[];
};

export type FloorTransition = {
  /** Indeks titik rute tempat perpindahan lantai dimulai. Segmen berikutnya adalah lintasan miring. */
  index: number;
  from: FloorId;
  to: FloorId;
  connector: FloorConnector;
  label: string;
};

export type FloorRoute = {
  points: Point3[];
  transitions: FloorTransition[];
  /** Lantai untuk setiap titik pada `points`. */
  pointFloors: FloorId[];
  length: number;
};

/** Jarak gambar rute di atas permukaan lantai, dalam meter. */
export const ROUTE_CLEARANCE = 0.06;

export function createFloorNavigation(objects: { name: string; object: THREE.Object3D }[]): FloorNavigation {
  // Tingkat diurutkan dari bawah ke atas dan dipetakan ke L1, L2. Model lama
  // yang hanya berisi lantai dasar menghasilkan satu tingkat saja.
  const levels = analyzeAllLevels(objects).slice(0, FLOOR_ORDER.length);
  const floors = FLOOR_ORDER.slice(0, levels.length);
  const grids: FloorNavigation["grids"] = {};
  floors.forEach((floor, index) => {
    grids[floor] = levels[index].grid;
  });
  const connectors = levels.length > 1
    ? detectFloorConnectors(objects, levels[0].level.y, levels[1].level.y)
    : [];
  return { floors, grids, connectors };
}

/** Lantai terdekat untuk sebuah ketinggian, misalnya titik klik pada peta. */
export function floorAtHeight(navigation: FloorNavigation, y: number): FloorId {
  let best: FloorId = navigation.floors[0] ?? "L1";
  let distance = Number.POSITIVE_INFINITY;
  for (const floor of navigation.floors) {
    const grid = navigation.grids[floor];
    if (!grid) continue;
    const next = Math.abs(grid.levelY - y);
    if (next < distance) {
      distance = next;
      best = floor;
    }
  }
  return best;
}

export function snapPlace(navigation: FloorNavigation, place: RoutePlace): RoutePlace | null {
  const grid = navigation.grids[place.floor];
  if (!grid) return null;
  const point = snapToWalkable(grid, place.point);
  return point ? { floor: place.floor, point } : null;
}

export function placeElevation(navigation: FloorNavigation, place: RoutePlace) {
  const grid = navigation.grids[place.floor];
  return grid ? elevationAt(grid, place.point[0], place.point[1]) + ROUTE_CLEARANCE : ROUTE_CLEARANCE;
}

function pathLength(points: Point2[]) {
  let total = 0;
  for (let index = 1; index < points.length; index += 1) {
    total += Math.hypot(points[index][0] - points[index - 1][0], points[index][1] - points[index - 1][1]);
  }
  return total;
}

function distanceToRect(point: Point2, rect: TargetRect) {
  return Math.hypot(
    Math.max(rect.minX - point[0], 0, point[0] - rect.maxX),
    Math.max(rect.minZ - point[1], 0, point[1] - rect.maxZ),
  );
}

/** Rute ke sebuah titik; titik yang jatuh di sel yang sama menghasilkan rute satu titik. */
function walkTo(grid: WalkableGrid, from: Point2, to: Point2): Point2[] | null {
  const route = findWalkableRoute(grid, from, to);
  if (route) return route;
  const start = snapToWalkable(grid, from);
  const end = snapToWalkable(grid, to);
  if (start && end && start[0] === end[0] && start[1] === end[1]) return [start];
  return null;
}

function walkToTarget(grid: WalkableGrid, from: Point2, target: RouteTarget) {
  const routeGrid = target.entryDoors ? openTargetEntryDoors(grid, target.rect, target.entryDoors) : grid;
  const points = findWalkableRouteToTarget(routeGrid, from, target.rect, target.entryDoors);
  return points ? { points, grid: routeGrid } : null;
}

function lift(grid: WalkableGrid, points: Point2[]): Point3[] {
  return points.map(([x, z]) => [x, elevationAt(grid, x, z) + ROUTE_CLEARANCE, z]);
}

export function findFloorRoute(navigation: FloorNavigation, start: RoutePlace, target: RouteTarget): FloorRoute | null {
  const startGrid = navigation.grids[start.floor];
  const targetGrid = navigation.grids[target.floor];
  if (!startGrid || !targetGrid) return null;

  if (start.floor === target.floor) {
    const leg = walkToTarget(startGrid, start.point, target);
    if (!leg) return null;
    const route = new RouteBuilder();
    lift(leg.grid, leg.points).forEach((point) => route.push(point, start.floor));
    return { points: route.points, transitions: [], pointFloors: route.floors, length: pathLength(leg.points) };
  }

  const travel = FLOOR_ORDER.indexOf(target.floor) > FLOOR_ORDER.indexOf(start.floor) ? "up" : "down";
  const going = (connector: FloorConnector) => travel === "up"
    ? { enter: connector.bottomLanding, from: connector.bottom, to: connector.top, exit: connector.topLanding }
    : { enter: connector.topLanding, from: connector.top, to: connector.bottom, exit: connector.bottomLanding };

  // Bagian pertama dihitung untuk semua penghubung, lalu diurutkan berdasarkan
  // batas bawah total jarak. Bagian kedua (yang lebih mahal karena menelusuri
  // sisi tujuan) dilewati bila batas bawahnya sudah lebih panjang dari rute terbaik.
  const candidates = navigation.connectors
    .filter((connector) => connectorAllows(connector, travel))
    .flatMap((connector) => {
      const path = going(connector);
      // Landing dari GLB kadang berada beberapa sentimeter di luar sel lantai
      // karena ujung tangga/eskalator tidak persis menempel pada pelat FF.
      // `walkTo` akan snap landing ke sel jalan terdekat; A* tetap memeriksa
      // seluruh obstacle sehingga snap tidak dapat melewati tembok/pilar.
      const first = walkTo(startGrid, start.point, path.enter);
      if (!first) return [];
      const firstLength = pathLength(first);
      const lowerBound = firstLength + connector.length + distanceToRect(path.exit, target.rect);
      return [{ connector, path, first, firstLength, lowerBound }];
    })
    .sort((left, right) => left.lowerBound - right.lowerBound);

  let best: { route: FloorRoute; length: number } | null = null;
  for (const candidate of candidates) {
    if (best && candidate.lowerBound >= best.length) break;
    const second = walkToTarget(targetGrid, candidate.path.exit, target);
    if (!second) continue;
    const length = candidate.firstLength + candidate.connector.length + pathLength(second.points);
    if (best && length >= best.length) continue;

    const rideStart: Point3 = [candidate.path.from[0], elevationAt(startGrid, ...candidate.path.from) + ROUTE_CLEARANCE, candidate.path.from[1]];
    const rideEnd: Point3 = [candidate.path.to[0], elevationAt(second.grid, ...candidate.path.to) + ROUTE_CLEARANCE, candidate.path.to[1]];
    const route = new RouteBuilder();
    lift(startGrid, candidate.first).forEach((point) => route.push(point, start.floor));
    route.push(rideStart, start.floor);
    const transitionIndex = route.points.length - 1;
    route.push(rideEnd, target.floor);
    lift(second.grid, second.points).forEach((point) => route.push(point, target.floor));
    best = {
      length,
      route: {
        points: route.points,
        transitions: [{
          index: transitionIndex,
          from: start.floor,
          to: target.floor,
          connector: candidate.connector,
          label: connectorLabel(candidate.connector, travel, FLOOR_LABELS[target.floor]),
        }],
        pointFloors: route.floors,
        length,
      },
    };
  }
  return best?.route ?? null;
}

/**
 * Titik kembar berurutan dibuang di sini, dengan toleransi yang sama seperti
 * `createRouteMetrics`, supaya indeks perpindahan lantai tetap cocok.
 */
class RouteBuilder {
  points: Point3[] = [];
  floors: FloorId[] = [];

  push(point: Point3, floor: FloorId) {
    const last = this.points.at(-1);
    if (last && (last[0] - point[0]) ** 2 + (last[1] - point[1]) ** 2 + (last[2] - point[2]) ** 2 <= 0.000001) return;
    this.points.push(point);
    this.floors.push(floor);
  }
}
