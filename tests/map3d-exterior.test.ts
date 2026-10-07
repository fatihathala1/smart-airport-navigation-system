import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import * as THREE from "three";
import { flatPolygon, ribbon, type ExteriorData } from "../src/lib/map3d/exterior-geometry";

function firstFaceNormalY(geometry: THREE.BufferGeometry) {
  const position = geometry.getAttribute("position");
  const index = geometry.index;
  const vertex = (i: number) => new THREE.Vector3().fromBufferAttribute(position, index ? index.getX(i) : i);
  const [a, b, c] = [vertex(0), vertex(1), vertex(2)];
  return new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).y;
}

test("flat exterior surfaces face upward so lighting hits their visible side", () => {
  const road = ribbon([[0, 0], [10, 0], [10, 10]], 2, 0);
  const lot = flatPolygon([[0, 0], [10, 0], [10, 10], [0, 10]], 0);
  assert.ok(road && firstFaceNormalY(road) > 0, "road ribbon faces up");
  assert.ok(lot && firstFaceNormalY(lot) > 0, "polygon faces up");
});

test("exterior data keeps parking on the landside (north) and the apron on the airside (south)", () => {
  const data = JSON.parse(readFileSync(path.join(process.cwd(), "public/exterior/t1-exterior.json"), "utf8")) as ExteriorData & {
    meta: { bounds: { minX: number; maxX: number; minZ: number; maxZ: number } };
  };
  const centerZ = (points: [number, number][]) => points.reduce((total, [, z]) => total + z, 0) / points.length;
  const parking = data.areas.filter((area) => area.kind === "parking");
  const apron = data.areas.filter((area) => area.kind === "apron");

  assert.ok(parking.length >= 3, "parking lots are present");
  // Utara = -Z. Terminal berada di sekitar z -40..40.
  assert.ok(parking.filter((area) => centerZ(area.points) < -40).length >= 2, "main parking lies north of the terminal");
  assert.ok(apron.every((area) => centerZ(area.points) > 0), "apron lies south of the terminal");

  const { bounds } = data.meta;
  const all = [...data.areas.flatMap((area) => area.points), ...data.lines.flatMap((line) => line.points)];
  assert.ok(all.every(([x, z]) => x >= bounds.minX - 0.2 && x <= bounds.maxX + 0.2 && z >= bounds.minZ - 0.2 && z <= bounds.maxZ + 0.2), "everything stays inside the display bounds");
  assert.ok(data.meta.attribution.includes("OpenStreetMap"), "ODbL attribution is carried with the data");
});
