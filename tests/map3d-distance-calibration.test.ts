import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { T1_DISTANCE_REFERENCES, T1_METERS_PER_MODEL_UNIT } from "../src/lib/map3d/distance-calibration";
import { createRouteMetrics, createPlaybackSnapshot, nearestRouteDistance, sampleRouteAtDistance, VISITOR_SPEED_METERS_PER_SECOND } from "../src/lib/map3d/route-guidance";
import { createRouteSteps } from "../src/lib/map3d/route-steps";
import { geographicToT1Model, T1_GEO_CALIBRATION } from "../src/lib/map3d/passenger-geolocation";
import { loadGlb, nodeMeshObjects } from "./helpers/load-glb";
import { floorOfObject } from "../src/lib/map3d/floors";

const close = (actual: number, expected: number, tolerance = 1e-6) =>
  assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`);
const horizontalSpan = 515.4008859339247;
const transverseSpan = 78.07065195998439;

test("accepted Google Earth baselines read 648.57 m and 100.79 m without moving model points", () => {
  const x = createRouteMetrics([[0, 0, 0], [horizontalSpan, 0, 0]], T1_METERS_PER_MODEL_UNIT)!;
  const z = createRouteMetrics([[0, 0, 0], [0, 0, transverseSpan]], T1_METERS_PER_MODEL_UNIT)!;
  close(x.totalDistance, 648.57);
  close(z.totalDistance, 100.79);
  close(x.points[1].x, horizontalSpan);
  close(z.points[1].z, transverseSpan);
});

test("diagonals and sloping stairs apply each axis scale once, retaining 3 m floor height", () => {
  const vertical = createRouteMetrics([[0, 0, 0], [0, 3, 0]], T1_METERS_PER_MODEL_UNIT)!;
  const diagonal = createRouteMetrics([[0, 0, 0], [horizontalSpan, 3, transverseSpan]], T1_METERS_PER_MODEL_UNIT)!;
  close(vertical.totalDistance, 3);
  close(diagonal.totalDistance, Math.hypot(648.57, 3, 100.79));
});

test("steps, playback, ETA and GPS progress share calibrated cumulative meters", () => {
  const route = createRouteMetrics([[0, 0, 0], [horizontalSpan, 0, 0], [horizontalSpan, 0, transverseSpan]], T1_METERS_PER_MODEL_UNIT)!;
  const steps = createRouteSteps(route);
  close(route.totalDistance, 749.36);
  close(steps[0].distance, 648.57);
  close(steps[1].distance, 100.79);
  const atMeters = 648.57 + 100.79 / 2;
  const snapshot = createPlaybackSnapshot(route, atMeters);
  close(snapshot.position[0], horizontalSpan);
  close(snapshot.position[2], transverseSpan / 2);
  close(snapshot.progress, atMeters / 749.36);
  close(nearestRouteDistance(route, snapshot.position), atMeters);
  close(sampleRouteAtDistance(route, 10_000).distance, 749.36);
  close(sampleRouteAtDistance(route, -100).distance, 0);
  assert.equal(Math.ceil(route.totalDistance / VISITOR_SPEED_METERS_PER_SECOND / 60), 10);
});

test("off-route GPS positions project in physical meters, including diagonal segments", () => {
  const route = createRouteMetrics([[0, 0, 0], [10, 0, 10]], [2, 1, 1])!;
  // Physical segment (0,0)->(20,10), point (20,0): dot/length^2 = 400/500.
  close(nearestRouteDistance(route, [10, 0, 0]), Math.sqrt(500) * 0.8);
});

test("GPS in multiple directions reproduces physical distances after model conversion", () => {
  const origin = T1_GEO_CALIBRATION.origin;
  const [x, z] = geographicToT1Model(origin);
  for (const [east, north] of [[100, 0], [0, 100], [-80, 60], [600, 100]]) {
    const target = geographicToT1Model({
      latitude: origin.latitude + north / 6378137 * 180 / Math.PI,
      longitude: origin.longitude + east / (6378137 * Math.cos(origin.latitude * Math.PI / 180)) * 180 / Math.PI,
    });
    const route = createRouteMetrics([[x, 0, z], [target[0], 0, target[1]]], T1_METERS_PER_MODEL_UNIT)!;
    close(route.totalDistance, Math.hypot(east, north));
  }
});

test("calibration rejects invalid scales and handles empty or repeated points", () => {
  assert.throws(() => createRouteMetrics([[0, 0, 0], [1, 0, 0]], [0, 1, 1]));
  assert.throws(() => createRouteMetrics([[0, 0, 0], [1, 0, 0]], [1, NaN, 1]));
  assert.equal(createRouteMetrics([], T1_METERS_PER_MODEL_UNIT), null);
  assert.equal(createRouteMetrics([[0, 0, 0], [0, 0, 0]], T1_METERS_PER_MODEL_UNIT), null);
});

test("calibration endpoints still correspond to the current GLB export", async () => {
  const records = nodeMeshObjects(await loadGlb("public/models/t1-gabungan.glb"))
    .filter(({ object }) => floorOfObject(object) === "L1");
  const bounds = (name: string) => {
    const record = records.find((item) => item.name === name);
    assert.ok(record, `Missing calibration object: ${name}`);
    return new THREE.Box3().setFromObject(record.object);
  };
  close(bounds("T1-GF-02").min.x, T1_DISTANCE_REFERENCES.longitudinal.startX);
  const right = bounds("tembok_pilar_106");
  close((right.min.x + right.max.x) / 2, T1_DISTANCE_REFERENCES.longitudinal.endX);
  close(bounds("area_visitor").min.z, T1_DISTANCE_REFERENCES.transverse.startZ);
  close(bounds("area_merah").max.z, T1_DISTANCE_REFERENCES.transverse.endZ);
});
