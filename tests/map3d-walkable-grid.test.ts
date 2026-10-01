import assert from "node:assert/strict";
import test from "node:test";
import {
  createWalkableGrid,
  findWalkableRoute,
  type WalkableTriangle,
} from "../src/lib/map3d/walkable-grid";

const floor: WalkableTriangle[] = [
  [[0, 0], [12, 0], [12, 8]],
  [[0, 0], [12, 8], [0, 8]],
];

function crossingAtX(route: [number, number][], x: number) {
  for (let index = 1; index < route.length; index += 1) {
    const [beforeX, beforeZ] = route[index - 1];
    const [afterX, afterZ] = route[index];
    if (beforeX <= x && afterX >= x && afterX !== beforeX) {
      return beforeZ + ((x - beforeX) / (afterX - beforeX)) * (afterZ - beforeZ);
    }
  }
  return null;
}

test("shortest walkable route uses the opening instead of crossing a wall", () => {
  const grid = createWalkableGrid({
    floor,
    obstacles: [
      { kind: "solid", minX: 5, maxX: 6, minZ: 0, maxZ: 3.2 },
      { kind: "solid", minX: 5, maxX: 6, minZ: 4.8, maxZ: 8 },
    ],
    doors: [],
    cellSize: 0.25,
    clearance: 0.2,
  });

  const route = findWalkableRoute(grid, [1, 1], [11, 1]);
  assert.ok(route);
  const crossing = crossingAtX(route, 5.5);
  assert.ok(crossing !== null && crossing > 3.2 && crossing < 4.8);
  assert.ok(route.every(([x, z]) => !(x >= 4.8 && x <= 6.2 && (z < 3 || z > 5))));
});

test("glass door remains passable while the rest of the glass wall blocks", () => {
  const grid = createWalkableGrid({
    floor,
    obstacles: [{ kind: "glass", minX: 5, maxX: 6, minZ: 0, maxZ: 8 }],
    doors: [{ minX: 4.9, maxX: 6.1, minZ: 3, maxZ: 5 }],
    cellSize: 0.25,
    clearance: 0.2,
  });

  const route = findWalkableRoute(grid, [1, 1], [11, 1]);
  assert.ok(route);
  const crossing = crossingAtX(route, 5.5);
  assert.ok(crossing !== null && crossing >= 3.2 && crossing <= 4.8);
});

test("solid wall cannot be bypassed by a glass door", () => {
  const grid = createWalkableGrid({
    floor,
    obstacles: [{ kind: "solid", minX: 5, maxX: 6, minZ: 0, maxZ: 8 }],
    doors: [{ minX: 4.9, maxX: 6.1, minZ: 3, maxZ: 5 }],
    cellSize: 0.25,
    clearance: 0.2,
  });

  assert.equal(findWalkableRoute(grid, [1, 4], [11, 4]), null);
});
