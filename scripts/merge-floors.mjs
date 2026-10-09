// Menggabungkan model Lantai 1 (GF) dan Lantai 2 (FF) Terminal 1 menjadi satu GLB
// bertumpuk, supaya aplikasi cukup memuat satu file untuk kedua lantai.
//
// Masukan : public/models/buildings-ground-floor.glb   (Lantai 1)
//           data/models/t1-lantai-2.glb                (Lantai 2, salinan T1-FF.glb terbaru)
// Keluaran: public/models/t1-gabungan.glb
//
// Jalankan: node scripts/merge-floors.mjs
// Setelah itu naikkan TERMINAL_MODEL_URL di src/lib/map3d/assets.ts.
//
// Susunan hasil:
//   LEVEL__L1  → seluruh isi GF, tanpa perubahan
//   LEVEL__L2  → seluruh isi FF, digeser oleh FF_OFFSET
// Aplikasi memakai kedua grup ini untuk tombol lantai dan untuk rute antarlantai.

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const GROUND = path.join(ROOT, "public/models/buildings-ground-floor.glb");
const UPPER = path.join(ROOT, "data/models/t1-lantai-2.glb");
const TARGET = path.join(ROOT, "public/models/t1-gabungan.glb");

/**
 * Posisi FF terhadap GF, dalam meter.
 *
 * Kedua file diekspor terpusat pada kotak pembatasnya sendiri, dan kotak FF lebih
 * dalam (garbarata di utara, pavilion di selatan), jadi titik nolnya tidak sama.
 * Geseran X/Z dicari dua tahap:
 *   1. Kasar dari delapan objek yang ada di kedua file (eskalator NAIK-01..03,
 *      TURUN-09, TURUN-10, tangga 01..03): X −1,35, Z +8,87.
 *   2. Halus dari 56 pasang pilar struktur yang menembus kedua lantai. Median
 *      selisihnya dipakai, rata-rata sisa jarak pilar 0,25 m.
 * Y: eskalator dan tangga di file FF turun 3,0 m dari pelat FF ke lantai GF.
 */
const FF_OFFSET = [-1.06, 3.0, 8.80];

/**
 * File FF ikut membawa salinan eskalator dan tangga GF (nama `T1-GF-...`) yang
 * posisinya sedikit berbeda dari aslinya di file GF. Salinan ini dibuang supaya
 * tidak muncul eskalator ganda; yang dipakai adalah versi dari file GF.
 */
const DROP_FROM_UPPER = /T1-GF-/i;

/** Akhiran untuk nama FF yang sudah dipakai di GF, misalnya `tembok_pilar_43`. */
const UPPER_NAME_SUFFIX = "__L2";

function readGlb(file) {
  const bytes = readFileSync(file);
  if (bytes.readUInt32LE(0) !== 0x46546c67) throw new Error(`${file} bukan file GLB.`);
  const jsonLength = bytes.readUInt32LE(12);
  const json = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString("utf8"));
  const binaryHeader = 20 + jsonLength;
  const binaryLength = bytes.readUInt32LE(binaryHeader);
  const binary = bytes.subarray(binaryHeader + 8, binaryHeader + 8 + binaryLength);
  if ((json.buffers ?? []).length !== 1) throw new Error(`${file} harus memiliki tepat satu buffer.`);
  return { json, binary };
}

function createWriter() {
  const out = {
    asset: { version: "2.0", generator: "scripts/merge-floors.mjs" },
    extensionsUsed: [],
    scene: 0,
    scenes: [{ name: "Terminal 1", nodes: [] }],
    nodes: [],
    meshes: [],
    materials: [],
    accessors: [],
    bufferViews: [],
    buffers: [{ byteLength: 0 }],
  };
  const chunks = [];
  let byteLength = 0;

  const appendBytes = (bytes) => {
    const padding = (4 - (byteLength % 4)) % 4;
    if (padding) {
      chunks.push(Buffer.alloc(padding));
      byteLength += padding;
    }
    const offset = byteLength;
    chunks.push(bytes);
    byteLength += bytes.length;
    return offset;
  };

  const finish = () => {
    out.buffers[0].byteLength = byteLength;
    if (!out.extensionsUsed.length) delete out.extensionsUsed;
    const binary = Buffer.concat(chunks);
    const binaryPadded = Buffer.concat([binary, Buffer.alloc((4 - (binary.length % 4)) % 4)]);
    const jsonBytes = Buffer.from(JSON.stringify(out), "utf8");
    const jsonPadded = Buffer.concat([jsonBytes, Buffer.alloc((4 - (jsonBytes.length % 4)) % 4, 0x20)]);
    const header = Buffer.alloc(12);
    header.writeUInt32LE(0x46546c67, 0);
    header.writeUInt32LE(2, 4);
    header.writeUInt32LE(12 + 8 + jsonPadded.length + 8 + binaryPadded.length, 8);
    const jsonHeader = Buffer.alloc(8);
    jsonHeader.writeUInt32LE(jsonPadded.length, 0);
    jsonHeader.writeUInt32LE(0x4e4f534a, 4);
    const binaryHeader = Buffer.alloc(8);
    binaryHeader.writeUInt32LE(binaryPadded.length, 0);
    binaryHeader.writeUInt32LE(0x004e4942, 4);
    return Buffer.concat([header, jsonHeader, jsonPadded, binaryHeader, binaryPadded]);
  };

  return { out, appendBytes, finish };
}

/**
 * Salin satu file sumber ke dalam writer. Hanya mesh, material, accessor, dan
 * bufferView yang dipakai oleh node yang disimpan ikut tersalin.
 */
function copySource(writer, source, { dropNode, rename }) {
  const { json, binary } = source;
  const maps = { mesh: new Map(), material: new Map(), accessor: new Map(), bufferView: new Map() };
  const memo = (map, index, create) => {
    if (!map.has(index)) map.set(index, create());
    return map.get(index);
  };

  for (const extension of json.extensionsUsed ?? []) {
    if (!writer.out.extensionsUsed.includes(extension)) writer.out.extensionsUsed.push(extension);
  }

  const copyBufferView = (index) => memo(maps.bufferView, index, () => {
    const view = json.bufferViews[index];
    const start = view.byteOffset ?? 0;
    const byteOffset = writer.appendBytes(binary.subarray(start, start + view.byteLength));
    writer.out.bufferViews.push({ ...view, buffer: 0, byteOffset });
    return writer.out.bufferViews.length - 1;
  });

  const copyAccessor = (index) => memo(maps.accessor, index, () => {
    const accessor = json.accessors[index];
    writer.out.accessors.push({ ...accessor, bufferView: copyBufferView(accessor.bufferView) });
    return writer.out.accessors.length - 1;
  });

  const copyMaterial = (index) => memo(maps.material, index, () => {
    writer.out.materials.push(structuredClone(json.materials[index]));
    return writer.out.materials.length - 1;
  });

  const copyMesh = (index) => memo(maps.mesh, index, () => {
    const mesh = json.meshes[index];
    writer.out.meshes.push({
      ...mesh,
      primitives: mesh.primitives.map((primitive) => ({
        ...primitive,
        attributes: Object.fromEntries(Object.entries(primitive.attributes).map(([key, accessor]) => [key, copyAccessor(accessor)])),
        ...(primitive.indices !== undefined ? { indices: copyAccessor(primitive.indices) } : {}),
        ...(primitive.material !== undefined ? { material: copyMaterial(primitive.material) } : {}),
      })),
    });
    return writer.out.meshes.length - 1;
  });

  let dropped = 0;
  const copyNode = (index) => {
    const node = json.nodes[index];
    if (dropNode(node)) {
      dropped += 1;
      return null;
    }
    const { children, mesh, ...rest } = node;
    const copied = { ...rest, name: rename(node.name ?? "") };
    if (mesh !== undefined) copied.mesh = copyMesh(mesh);
    writer.out.nodes.push(copied);
    const outIndex = writer.out.nodes.length - 1;
    const keptChildren = (children ?? []).map(copyNode).filter((child) => child !== null);
    if (keptChildren.length) copied.children = keptChildren;
    return outIndex;
  };

  const roots = json.scenes[json.scene ?? 0].nodes.map(copyNode).filter((root) => root !== null);
  return { roots, dropped };
}

const ground = readGlb(GROUND);
const upper = readGlb(UPPER);
const writer = createWriter();
const groundNames = new Set(ground.json.nodes.map((node) => node.name));

const addLevel = (name, floor, label, translation) => {
  writer.out.nodes.push({ name, ...(translation ? { translation } : {}), extras: { floor, label }, children: [] });
  const index = writer.out.nodes.length - 1;
  writer.out.scenes[0].nodes.push(index);
  return writer.out.nodes[index];
};

const lower = addLevel("LEVEL__L1", "L1", "Lantai 1", null);
lower.children = copySource(writer, ground, { dropNode: () => false, rename: (name) => name }).roots;

const top = addLevel("LEVEL__L2", "L2", "Lantai 2", FF_OFFSET);
let renamed = 0;
const upperResult = copySource(writer, upper, {
  // The FF export contains navigation helper meshes named T1-GF-... as well
  // as the actual escalator/stair meshes.  Keep the latter: they are the
  // visible upper landing that must meet the GF connector.  Only discard the
  // duplicate helper meshes that would otherwise be mistaken for GF objects.
  dropNode: (node) => DROP_FROM_UPPER.test(node.name ?? ""),
  rename: (name) => {
    if (!groundNames.has(name)) return name;
    renamed += 1;
    return `${name}${UPPER_NAME_SUFFIX}`;
  },
});
top.children = upperResult.roots;

// Pada ekspor FF, empat bukaan di sekitar landing tangga/eskalator tidak
// memiliki segitiga lantai. Tambahkan pelat tipis pada sisi lantai 2 agar
// ujung konektor bertemu permukaan jalan dan grid navigasi tidak terputus.
const patchMaterial = writer.out.materials.push({
  name: "Floor connector patch",
  pbrMetallicRoughness: {
    baseColorFactor: [0.82, 0.85, 0.87, 1],
    roughnessFactor: 0.82,
    metallicFactor: 0,
  },
}) - 1;
function addFloorPatch(name, centerX, centerZ, width, depth) {
  const vertices = new Float32Array([
    -width / 2, 0, -depth / 2, width / 2, 0, -depth / 2,
    width / 2, 0, depth / 2, -width / 2, 0, depth / 2,
  ]);
  const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);
  const positionOffset = writer.appendBytes(Buffer.from(vertices.buffer));
  const indexOffset = writer.appendBytes(Buffer.from(indices.buffer));
  const positionView = writer.out.bufferViews.push({ buffer: 0, byteOffset: positionOffset, byteLength: vertices.byteLength, target: 34962 }) - 1;
  const indexView = writer.out.bufferViews.push({ buffer: 0, byteOffset: indexOffset, byteLength: indices.byteLength, target: 34963 }) - 1;
  const positionAccessor = writer.out.accessors.push({ bufferView: positionView, componentType: 5126, count: 4, type: "VEC3", min: [-width / 2, 0, -depth / 2], max: [width / 2, 0, depth / 2] }) - 1;
  const indexAccessor = writer.out.accessors.push({ bufferView: indexView, componentType: 5123, count: 6, type: "SCALAR", min: [0], max: [3] }) - 1;
  const mesh = writer.out.meshes.push({ name, primitives: [{ attributes: { POSITION: positionAccessor }, indices: indexAccessor, material: patchMaterial }] }) - 1;
  const node = { name, mesh, translation: [centerX - FF_OFFSET[0], 0.025, centerZ - FF_OFFSET[2]] };
  writer.out.nodes.push(node);
  top.children.push(writer.out.nodes.length - 1);
}
addFloorPatch("FLOOR_CONNECTOR_PAD_L2_01", 128.45, -14.55, 12, 6);
addFloorPatch("FLOOR_CONNECTOR_PAD_L2_02", 218.90, -14.55, 12, 6);

const output = writer.finish();
writeFileSync(TARGET, output);
console.log(`Tersimpan ${path.relative(ROOT, TARGET)} (${(output.length / 1024 / 1024).toFixed(2)} MB)`);
console.log(`  Lantai 1: ${lower.children.length} objek`);
console.log(`  Lantai 2: ${top.children.length} objek, ${upperResult.dropped} salinan eskalator/tangga GF dibuang, ${renamed} nama diberi akhiran ${UPPER_NAME_SUFFIX}`);
console.log(`  Geseran Lantai 2: X ${FF_OFFSET[0]}, Y ${FF_OFFSET[1]}, Z ${FF_OFFSET[2]}`);
