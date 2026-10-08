import { readFileSync } from "node:fs";
import path from "node:path";
import type * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";

/** Muat GLB dari repo dengan loader yang sama seperti di browser. */
export async function loadGlb(relativePath: string): Promise<GLTF> {
  const bytes = readFileSync(path.join(process.cwd(), relativePath));
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  return new Promise((resolve, reject) => new GLTFLoader().parse(buffer, "", resolve, reject));
}

/**
 * Objek node glTF yang memiliki mesh, disusun seperti `SceneObjectRecord` di
 * SceneModel: satu entri per node, memakai nama node asli.
 */
export function nodeMeshObjects(gltf: GLTF) {
  const parser = gltf.parser as GLTF["parser"] & {
    associations: Map<THREE.Object3D, { nodes?: number }>;
    json: { nodes?: { name?: string; mesh?: number }[] };
  };
  const nodes = parser.json.nodes ?? [];
  gltf.scene.updateMatrixWorld(true);
  const records: { name: string; object: THREE.Object3D }[] = [];
  gltf.scene.traverse((object) => {
    const nodeIndex = parser.associations.get(object)?.nodes;
    if (nodeIndex === undefined || nodes[nodeIndex]?.mesh === undefined) return;
    records.push({ name: nodes[nodeIndex].name ?? object.name, object });
  });
  return records;
}
