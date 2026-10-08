import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import * as THREE from "three";
import { createGridFromSceneObjects } from "../src/lib/map3d/scene-walkability";
import { findWalkableRouteToTarget } from "../src/lib/map3d/walkable-grid";

type Accessor = {
  bufferView: number;
  byteOffset?: number;
  componentType: number;
  count: number;
  type: string;
};

type GlbJson = {
  accessors: Accessor[];
  bufferViews: { byteOffset?: number }[];
  meshes: { primitives: { attributes: { POSITION: number }; indices?: number }[] }[];
  nodes: { name?: string; mesh?: number; scale?: number[]; translation?: number[] }[];
};

function readModelObjects() {
  const file = readFileSync(path.join(process.cwd(), "public/models/buildings-ground-floor.glb"));
  const jsonLength = file.readUInt32LE(12);
  const glb = JSON.parse(file.subarray(20, 20 + jsonLength).toString()) as GlbJson;
  const binaryStart = 20 + jsonLength + 8;

  const readAccessor = (index: number) => {
    const accessor = glb.accessors[index];
    const view = glb.bufferViews[accessor.bufferView];
    const offset = binaryStart + (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
    const components = accessor.type === "VEC3" ? 3 : 1;
    const values: number[] = [];
    const componentSize = accessor.componentType === 5126 ? 4 : accessor.componentType === 5123 ? 2 : 4;
    for (let item = 0; item < accessor.count * components; item += 1) {
      const position = offset + item * componentSize;
      values.push(accessor.componentType === 5126
        ? file.readFloatLE(position)
        : accessor.componentType === 5123
          ? file.readUInt16LE(position)
          : file.readUInt32LE(position));
    }
    return values;
  };

  return glb.nodes.flatMap((node) => {
    if (node.mesh === undefined || !node.name) return [];
    if (/^tembok_pilar_(?:31[0-9]|63[1-9]|640|37|358)$/i.test(node.name)) return [];
    const object = new THREE.Group();
    object.name = node.name;
    object.position.fromArray(node.translation ?? [0, 0, 0]);
    object.scale.fromArray(node.scale ?? [1, 1, 1]);
    for (const primitive of glb.meshes[node.mesh].primitives) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(readAccessor(primitive.attributes.POSITION), 3));
      if (primitive.indices !== undefined) geometry.setIndex(readAccessor(primitive.indices));
      object.add(new THREE.Mesh(geometry));
    }
    return [{ name: node.name, object }];
  });
}

test("current GLB still provides connected walking routes between terminal units", () => {
  const objects = readModelObjects();
  const grid = createGridFromSceneObjects(objects);
  const boxOf = (name: string) => {
    const record = objects.find((item) => item.name === name);
    assert.ok(record, `${name} is missing from the GLB`);
    const box = new THREE.Box3().setFromObject(record.object);
    return { minX: box.min.x, maxX: box.max.x, minZ: box.min.z, maxZ: box.max.z };
  };
  const centerOf = (name: string): [number, number] => {
    const box = boxOf(name);
    return [(box.minX + box.maxX) / 2, (box.minZ + box.maxZ) / 2];
  };

  for (const destination of ["T1-GF-09", "T1-GF-20"]) {
    const route = findWalkableRouteToTarget(grid, centerOf("T1-GF-01"), boxOf(destination));
    assert.ok(route && route.length >= 2, `No valid floor route to ${destination}`);
    assert.ok(route.every(([x, z]) => {
      const column = Math.floor((x - grid.minX) / grid.cellSize);
      const row = Math.floor((z - grid.minZ) / grid.cellSize);
      return grid.open[row * grid.width + column] === 1;
    }), `Route to ${destination} leaves the walkable grid`);
  }
});
