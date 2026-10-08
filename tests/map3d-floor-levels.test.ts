import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { detectFloorLevels, headroomFor } from "../src/lib/map3d/floor-levels";
import { analyzeSceneWalkability } from "../src/lib/map3d/scene-walkability";
import { elevationAt, findWalkableRoute } from "../src/lib/map3d/walkable-grid";

function slab(name: string, width: number, depth: number, x: number, z: number, y: number) {
  const object = new THREE.Mesh(new THREE.BoxGeometry(width, 0.1, depth));
  object.position.set(x, y, z);
  return { name, object };
}

function wall(name: string, width: number, height: number, depth: number, x: number, z: number, baseY: number) {
  const object = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth));
  object.position.set(x, baseY + height / 2, z);
  return { name, object };
}

test("floor levels are clustered by height and sorted by surface area", () => {
  const levels = detectFloorLevels([
    { vertices: [[0, 0, 0], [10, 0, 0], [10, 0, 10]], area: 50, y: 0 },
    { vertices: [[0, 0.05, 0], [10, 0.05, 10], [0, 0.05, 10]], area: 50, y: 0.05 },
    { vertices: [[0, 1.8, 0], [6, 1.8, 0], [6, 1.8, 6]], area: 18, y: 1.8 },
  ]);

  assert.equal(levels.length, 2);
  assert.ok(Math.abs(levels[0].y - 0.025) < 0.01, "ground level is the largest surface");
  assert.ok(Math.abs(levels[1].y - 1.8) < 0.01);
  // Ruang bebas lantai bawah dibatasi oleh pelat lantai di atasnya.
  assert.ok(Math.abs(headroomFor(levels[0], levels, 2.1) - (1.8 - 0.025 - 0.15)) < 0.01);
  assert.equal(headroomFor(levels[1], levels, 2.1), 2.1);
});

test("walkable floor is detected without relying on wall or pillar names", () => {
  const objects = [
    slab("area_visitor", 12, 8, 6, 4, 0),
    // Nama bebas: klasifikasi memakai bentuk, bukan konvensi penamaan.
    wall("Cube.014", 0.4, 2.8, 8, 6, 4, 0),
  ];
  const { grid } = analyzeSceneWalkability(objects, { cellSize: 0.25, clearance: 0.2 });

  assert.equal(findWalkableRoute(grid, [1, 4], [11, 4]), null, "an unnamed wall still blocks");
});

test("a flat decorative plane above the floor does not block walking", () => {
  const objects = [
    slab("area_visitor", 12, 8, 6, 4, 0),
    slab("area_merah", 12, 8, 6, 4, 1.2),
  ];
  const { grid } = analyzeSceneWalkability(objects, { cellSize: 0.25, clearance: 0.2 });
  const route = findWalkableRoute(grid, [1, 4], [11, 4]);

  assert.ok(route && route.length >= 2);
});

test("route elevation follows the chosen floor in a two-storey model", () => {
  const objects = [
    slab("area_visitor_L1", 12, 8, 6, 4, 0),
    slab("area_visitor_L2", 12, 8, 6, 4, 5),
  ];

  const ground = analyzeSceneWalkability(objects, { cellSize: 0.5, clearance: 0.2 });
  assert.ok(Math.abs(elevationAt(ground.grid, 6, 4) - 0.05) < 0.2, "ground route sits on the lower slab");

  const upper = analyzeSceneWalkability(objects, { cellSize: 0.5, clearance: 0.2, levelY: 5 });
  assert.ok(Math.abs(elevationAt(upper.grid, 6, 4) - 5.05) < 0.2, "upper route sits on the upper slab");
  assert.ok(upper.levels.length >= 2, "both storeys are reported");
});

test("a point inside a sealed unit snaps out to the public floor", () => {
  const objects = [
    slab("area_visitor", 20, 12, 10, 6, 0),
    wall("unit-north", 4, 2.6, 0.3, 4, 2, 0),
    wall("unit-south", 4, 2.6, 0.3, 4, 6, 0),
    wall("unit-west", 0.3, 2.6, 4, 2, 4, 0),
    wall("unit-east", 0.3, 2.6, 4, 6, 4, 0),
  ];
  const { grid } = analyzeSceneWalkability(objects, { cellSize: 0.25, clearance: 0.15 });
  const route = findWalkableRoute(grid, [4, 4], [16, 9]);

  assert.ok(route, "a route starts from the public floor beside the sealed unit");
  assert.ok(route.every(([x, z]) => !(x > 1.8 && x < 5.6 && z > 1.8 && z < 5.6)), "route stays out of the sealed unit");
});
