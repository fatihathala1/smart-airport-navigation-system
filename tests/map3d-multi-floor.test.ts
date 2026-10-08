import assert from "node:assert/strict";
import { before, test } from "node:test";
import * as THREE from "three";
import { loadGlb, nodeMeshObjects } from "./helpers/load-glb";
import { floorOfObject, type FloorId } from "../src/lib/map3d/floors";
import { detectFloorConnectors } from "../src/lib/map3d/floor-connectors";
import { AIRCRAFT, createAircraftParts, findAircraftStands } from "../src/lib/map3d/aircraft";
import { createFloorNavigation, findFloorRoute, type FloorNavigation, type FloorRoute, type RoutePlace, type RouteTarget } from "../src/lib/map3d/multi-floor-route";

type Records = { name: string; object: THREE.Object3D }[];
let objects: Records;
let navigation: FloorNavigation;

before(async () => {
  objects = nodeMeshObjects(await loadGlb("public/models/t1-gabungan.glb"));
  navigation = createFloorNavigation(objects);
});

function record(name: string) {
  const found = objects.find((item) => item.name === name);
  assert.ok(found, `${name} tidak ada di t1-gabungan.glb`);
  return found;
}

function target(name: string): RouteTarget {
  const { object } = record(name);
  const box = new THREE.Box3().setFromObject(object);
  return { floor: floorOfObject(object), rect: { minX: box.min.x, maxX: box.max.x, minZ: box.min.z, maxZ: box.max.z } };
}

function center(name: string): RoutePlace {
  const { floor, rect } = target(name);
  return { floor, point: [(rect.minX + rect.maxX) / 2, (rect.minZ + rect.maxZ) / 2] };
}

/** Setiap titik di lantai jalan harus berada di sel terbuka pada grid lantainya. */
function assertOnGrid(route: FloorRoute) {
  route.points.forEach(([x, , z], index) => {
    // Titik ujung eskalator/tangga berada di landasan, bukan di grid.
    const isRideEnd = route.transitions.some((transition) => index === transition.index || index === transition.index + 1);
    if (isRideEnd) return;
    const grid = navigation.grids[route.pointFloors[index]];
    assert.ok(grid);
    const column = Math.floor((x - grid.minX) / grid.cellSize);
    const row = Math.floor((z - grid.minZ) / grid.cellSize);
    assert.equal(grid.open[row * grid.width + column], 1, `titik ${index} keluar dari area jalan ${route.pointFloors[index]}`);
  });
}

test("merged model stacks the ground floor and upper floor in separate level groups", () => {
  assert.equal(floorOfObject(record("area_visitor").object), "L1");
  assert.equal(floorOfObject(record("FLOOR_JUANDA_FF8").object), "L2");
  assert.equal(floorOfObject(record("T1-FF-GATE-5").object), "L2");
  // Salinan eskalator GF dari file FF dibuang; semua `T1-GF-` berasal dari Lantai 1.
  for (const item of objects.filter(({ name }) => /T1-GF-/i.test(name))) {
    assert.equal(floorOfObject(item.object), "L1", `${item.name} seharusnya hanya ada di Lantai 1`);
  }
  // Nama yang bentrok diberi akhiran, jadi penanda Departure di Lantai 1 tetap unik.
  assert.equal(objects.filter(({ name }) => name === "tembok_pilar_42").length, 1);
  assert.equal(floorOfObject(record("tembok_pilar_42__L2").object), "L2");
});

test("both floors are detected and the upper floor sits about 3 m above the ground floor", () => {
  assert.deepEqual(navigation.floors, ["L1", "L2"]);
  const lower = navigation.grids.L1?.levelY ?? Number.NaN;
  const upper = navigation.grids.L2?.levelY ?? Number.NaN;
  assert.ok(Math.abs(lower) < 0.2, `Lantai 1 di ketinggian ${lower}`);
  assert.ok(Math.abs(upper - 3) < 0.2, `Lantai 2 di ketinggian ${upper}`);
});

test("escalators and stairs connect the floors in their marked direction", () => {
  const byName = (pattern: RegExp) => navigation.connectors.filter((connector) => pattern.test(connector.name));
  assert.ok(byName(/EKS NAIK/).length >= 3);
  assert.ok(byName(/EKS NAIK/).every((connector) => connector.direction === "up"));
  assert.ok(byName(/EKS TURUN/).length >= 3);
  assert.ok(byName(/EKS TURUN/).every((connector) => connector.direction === "down"));
  assert.ok(byName(/TANGGA/).every((connector) => connector.direction === "both" && connector.kind === "stairs"));
  // Eskalator tanpa NAIK/TURUN tidak dipakai, karena arahnya tidak diketahui.
  assert.equal(byName(/EKS-0[4-8]|EKS-11/).length, 0);
});

test("passenger route from a check-in area reaches a gate on floor 2 by going up", () => {
  const route = findFloorRoute(navigation, center("tembok-pillar_6"), target("T1-FF-GATE-5"));
  assert.ok(route, "rute Departure 1 ke Gate 5 tidak ditemukan");
  assert.equal(route.transitions.length, 1);
  const [transition] = route.transitions;
  assert.equal(transition.from, "L1");
  assert.equal(transition.to, "L2");
  assert.match(transition.connector.name, /NAIK|TANGGA/);
  assert.match(transition.label, /^Naik .* ke Lantai 2$/);
  assert.equal(route.pointFloors[0], "L1");
  assert.equal(route.pointFloors.at(-1), "L2");
  assert.ok((route.points.at(-1)?.[1] ?? 0) > 2.5, "rute harus berakhir di Lantai 2");
  assertOnGrid(route);
});

test("route from a gate down to baggage claim never rides an up escalator", () => {
  const route = findFloorRoute(navigation, center("T1-FF-GATE-3"), target("BAGGAGE CLAIM-B1"));
  assert.ok(route, "rute Gate 3 ke Baggage Claim B1 tidak ditemukan");
  assert.equal(route.transitions[0]?.to, "L1");
  assert.doesNotMatch(route.transitions[0].connector.name, /NAIK/);
  assertOnGrid(route);
});

test("route on one floor stays on that floor", () => {
  const route = findFloorRoute(navigation, center("T1-GF-01"), target("T1-GF-20"));
  assert.ok(route);
  assert.equal(route.transitions.length, 0);
  assert.ok(route.pointFloors.every((floor: FloorId) => floor === "L1"));
  assertOnGrid(route);
});

function box(name: string, width: number, height: number, depth: number, x: number, y: number, z: number) {
  const object = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth));
  object.position.set(x, y, z);
  return { name, object };
}

/** Bidang miring dari (x0, 0) sampai (x1, 3), lebar 1 m pada sumbu Z. */
function ramp(name: string, x0: number, x1: number) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute([x0, 0, 0, x1, 3, 0, x1, 3, 1, x0, 0, 0, x1, 3, 1, x0, 0, 1], 3));
  return { name, object: new THREE.Mesh(geometry) };
}

test("one-way escalator is not used against its direction", () => {
  const scene: Records = [
    box("area_visitor_L1", 20, 0.1, 6, 10, 0, 0),
    box("FLOOR__L2", 20, 0.1, 6, 10, 3, 0),
    ramp("ESC_VIS__EKS NAIK-01", 4, 12),
  ];
  scene.forEach(({ object }) => object.updateMatrixWorld(true));
  const connectors = detectFloorConnectors(scene, 0, 3);
  assert.equal(connectors.length, 1);
  assert.equal(connectors[0].direction, "up");
  assert.ok(connectors[0].bottom[0] < connectors[0].top[0], "ujung bawah harus di sisi x kecil");

  const nav = createFloorNavigation(scene);
  const upstairs: RouteTarget = { floor: "L2", rect: { minX: 17, maxX: 18, minZ: 0, maxZ: 1 } };
  const downstairs: RouteTarget = { floor: "L1", rect: { minX: 1, maxX: 2, minZ: 0, maxZ: 1 } };
  assert.ok(findFloorRoute(nav, { floor: "L1", point: [2, 0] }, upstairs), "naik lewat EKS NAIK harus bisa");
  assert.equal(findFloorRoute(nav, { floor: "L2", point: [18, 0] }, downstairs), null, "EKS NAIK tidak boleh dipakai turun");
});

test("aircraft are parked nose-in at the jet bridges without overlapping each other", () => {
  const stands = findAircraftStands(objects);
  const bridges = objects.filter(({ name }) => /^garbarata_/i.test(name));
  assert.equal(bridges.length, 13);
  assert.ok(stands.length >= 10 && stands.length < bridges.length, `${stands.length} pesawat`);
  const terminalEdge = new THREE.Box3().setFromObject(record("area_visitor").object).max.z;
  for (const stand of stands) {
    // Hidung di luar gedung, badan pesawat sepenuhnya di sisi apron.
    assert.ok(stand.nose[1] > terminalEdge, `pesawat ${stand.id} masuk ke dalam gedung`);
  }
  const sorted = [...stands].sort((left, right) => left.nose[0] - right.nose[0]);
  for (let index = 1; index < sorted.length; index += 1) {
    assert.ok(sorted[index].nose[0] - sorted[index - 1].nose[0] > AIRCRAFT.halfSpan * 2, "sayap pesawat bertabrakan");
  }
  const parts = createAircraftParts();
  parts.body.computeBoundingBox();
  const size = parts.body.boundingBox!.getSize(new THREE.Vector3());
  assert.ok(Math.abs(size.z - AIRCRAFT.length) < 0.5 && Math.abs(size.x - AIRCRAFT.halfSpan * 2) < 0.5);
});
