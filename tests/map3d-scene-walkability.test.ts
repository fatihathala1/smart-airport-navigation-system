import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { createGridFromSceneObjects } from "../src/lib/map3d/scene-walkability";
import { findWalkableRoute } from "../src/lib/map3d/walkable-grid";

function box(name: string, width: number, height: number, depth: number, x: number, z: number) {
  const object = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth));
  object.position.set(x, height / 2, z);
  return { name, object };
}

test("GLB floor and named wall objects produce a detour through the modeled door gap", () => {
  const objects = [
    box("FLOOR__area_visitor", 12, 0.1, 8, 6, 4),
    box("GLASS__dinding-kaca", 0.4, 2.8, 3.2, 5.5, 1.6),
    box("GLASS__dinding-kaca_2", 0.4, 2.8, 3.2, 5.5, 6.4),
    box("DOOR__Keberangkatan_1A", 0.4, 2.8, 1.6, 5.5, 4),
  ];
  const grid = createGridFromSceneObjects(objects, { cellSize: 0.25, clearance: 0.2 });
  const route = findWalkableRoute(grid, [1, 1], [11, 1]);

  assert.ok(route);
  assert.ok(route.some(([, z]) => z > 3 && z < 5));
});

test("GLB pillar remains blocked even when a nearby door exists", () => {
  const objects = [
    box("FLOOR__area_visitor", 12, 0.1, 8, 6, 4),
    box("tembok_pilar_1", 1, 2.8, 8, 5.5, 4),
    box("DOOR__Keberangkatan_1A", 0.4, 2.8, 1.6, 5.5, 4),
  ];
  const grid = createGridFromSceneObjects(objects, { cellSize: 0.25, clearance: 0.2 });
  assert.equal(findWalkableRoute(grid, [1, 4], [11, 4]), null);
});

test("hyphenated wall name in the export also blocks walking", () => {
  const objects = [
    box("FLOOR__area_visitor", 12, 0.1, 8, 6, 4),
    box("tembok-pilar", 1, 2.8, 8, 5.5, 4),
  ];
  const grid = createGridFromSceneObjects(objects, { cellSize: 0.25, clearance: 0.2 });
  assert.equal(findWalkableRoute(grid, [1, 4], [11, 4]), null);
});
