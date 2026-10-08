// Membangun data tampilan luar Terminal 1 dalam koordinat model GLB.
//
// Masukan : data/osm/t1-exterior.txt
//           Fitur OpenStreetMap di sekitar T1, sudah dipotong sampai area parkir
//           dan dikonversi ke meter lokal (x ke timur, y ke utara) terhadap
//           ORIGIN di bawah. Satu baris per fitur:
//           jenis|lebar|nama|jumlah_lantai|x,y x,y ...
//           Jenis: P parkir, B gedung, A apron, G rumput, W air, R jalan, T taxiway.
// Keluaran: public/exterior/t1-exterior.json
//
// Jalankan: node scripts/build-exterior.mjs
//
// Data: (c) OpenStreetMap contributors, lisensi ODbL. Atribusi wajib tampil.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SOURCE = path.join(ROOT, "data/osm/t1-exterior.txt");
const TARGET = path.join(ROOT, "public/exterior/t1-exterior.json");

/** Titik acuan konversi derajat ke meter lokal. */
const ORIGIN = { lon: 112.7953, lat: -7.375 };

/**
 * Penyelarasan OSM ke model GLB.
 *
 * Dicari dengan memaksimalkan IoU antara poligon gedung T1 di OSM
 * (way 177630771) dan seluruh pelat lantai GLB (area_visitor + area_merah).
 * Hasil: IoU 0,898. Model GLB berskala sekitar 0,81 terhadap ukuran asli dan
 * diluruskan sekitar 9,2 derajat terhadap arah sebenarnya.
 *
 * Sumbu GLB: X ke timur, Z ke selatan (utara = -Z), sesuai konvensi pintu
 * NORTH = minZ yang sudah dipakai di walkable-grid.ts.
 */
const FIT = {
  rotationDeg: -9.2,
  scale: 0.81,
  /** Pusat poligon T1 OSM dalam sumbu GLB sebelum diputar. */
  centroid: [-58.8628, -1.2603],
  /** Pergeseran akhir dalam satuan model. */
  shift: [-47.5, 4.5],
  iou: 0.898,
};

/**
 * Batas tampilan dalam koordinat model, sejajar dengan terminal. Utara (-Z)
 * sampai jalan lingkar di belakang parkiran; selatan (+Z) hanya strip apron
 * tempat pesawat parkir, tanpa taxiway dan landasan di kejauhan.
 */
const MODEL_BOUNDS = { minX: -460, maxX: 460, minZ: -215, maxZ: 115 };

const KIND = { P: "parking", B: "building", A: "apron", G: "grass", W: "water", R: "road", T: "taxiway" };

const theta = (FIT.rotationDeg * Math.PI) / 180;
const cos = Math.cos(theta);
const sin = Math.sin(theta);

/** Meter lokal (timur, utara) ke koordinat model GLB (x, z). */
function toModel([east, north]) {
  const px = east - FIT.centroid[0];
  const pz = -north - FIT.centroid[1];
  const x = (cos * px - sin * pz) * FIT.scale + FIT.shift[0];
  const z = (sin * px + cos * pz) * FIT.scale + FIT.shift[1];
  return [Math.round(x * 10) / 10, Math.round(z * 10) / 10];
}

const inside = {
  left: (p) => p[0] >= MODEL_BOUNDS.minX,
  right: (p) => p[0] <= MODEL_BOUNDS.maxX,
  top: (p) => p[1] >= MODEL_BOUNDS.minZ,
  bottom: (p) => p[1] <= MODEL_BOUNDS.maxZ,
};
const crossing = {
  left: (a, b) => lerpAt(a, b, 0, MODEL_BOUNDS.minX),
  right: (a, b) => lerpAt(a, b, 0, MODEL_BOUNDS.maxX),
  top: (a, b) => lerpAt(a, b, 1, MODEL_BOUNDS.minZ),
  bottom: (a, b) => lerpAt(a, b, 1, MODEL_BOUNDS.maxZ),
};

function lerpAt(a, b, axis, value) {
  const t = (value - a[axis]) / (b[axis] - a[axis]);
  const point = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  point[axis] = value;
  return point.map((v) => Math.round(v * 10) / 10);
}

/** Potong poligon ke batas tampilan (Sutherland-Hodgman). */
function clipPolygon(points) {
  let output = points;
  for (const edge of Object.keys(inside)) {
    const input = output;
    output = [];
    for (let index = 0; index < input.length; index += 1) {
      const current = input[index];
      const previous = input[(index + input.length - 1) % input.length];
      if (inside[edge](current)) {
        if (!inside[edge](previous)) output.push(crossing[edge](previous, current));
        output.push(current);
      } else if (inside[edge](previous)) {
        output.push(crossing[edge](previous, current));
      }
    }
    if (!output.length) break;
  }
  return output;
}

/** Potong garis ke batas tampilan; bagian yang keluar-masuk dipecah. */
function clipLine(points) {
  const isInside = (p) => Object.values(inside).every((test) => test(p));
  const clipSegment = (a, b) => {
    // Liang-Barsky
    let t0 = 0;
    let t1 = 1;
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const checks = [
      [-dx, a[0] - MODEL_BOUNDS.minX],
      [dx, MODEL_BOUNDS.maxX - a[0]],
      [-dz, a[1] - MODEL_BOUNDS.minZ],
      [dz, MODEL_BOUNDS.maxZ - a[1]],
    ];
    for (const [p, q] of checks) {
      if (p === 0) {
        if (q < 0) return null;
        continue;
      }
      const r = q / p;
      if (p < 0) t0 = Math.max(t0, r);
      else t1 = Math.min(t1, r);
      if (t0 > t1) return null;
    }
    const at = (t) => [Math.round((a[0] + dx * t) * 10) / 10, Math.round((a[1] + dz * t) * 10) / 10];
    return [at(t0), at(t1)];
  };
  const runs = [];
  let run = [];
  for (let index = 0; index < points.length - 1; index += 1) {
    const segment = clipSegment(points[index], points[index + 1]);
    if (!segment) {
      if (run.length >= 2) runs.push(run);
      run = [];
      continue;
    }
    if (!run.length) run.push(segment[0]);
    run.push(segment[1]);
    if (!isInside(points[index + 1])) {
      runs.push(run);
      run = [];
    }
  }
  if (run.length >= 2) runs.push(run);
  return runs;
}

function parse(line) {
  const [code, width, name, levels, coords] = line.split("|");
  const points = coords.trim().split(/\s+/).map((pair) => pair.split(",").map(Number));
  return {
    kind: KIND[code],
    width: width ? Number(width) : 0,
    name: name.trim(),
    levels: levels ? Number(levels) : 0,
    points,
  };
}

const features = readFileSync(SOURCE, "utf8").split(/\r?\n/).filter(Boolean).map(parse);
const areas = [];
const lines = [];
const buildings = [];

for (const feature of features) {
  const points = feature.points.map(toModel);
  if (feature.kind === "road" || feature.kind === "taxiway") {
    for (const run of clipLine(points)) {
      lines.push({ kind: feature.kind, width: Math.round(feature.width * FIT.scale * 10) / 10, name: feature.name || undefined, points: run });
    }
  } else if (feature.kind === "building") {
    // Gedung yang terpotong batas tidak digambar separuh.
    if (!points.every((point) => Object.values(inside).every((test) => test(point)))) continue;
    // Tinggi dari jumlah lantai bila tersedia, 3,5 m per lantai, ikut skala model.
    const storeys = feature.levels || 2;
    buildings.push({ name: feature.name || undefined, height: Math.round(storeys * 3.5 * FIT.scale * 10) / 10, points });
  } else {
    const clipped = clipPolygon(points);
    if (clipped.length >= 3) areas.push({ kind: feature.kind, name: feature.name || undefined, points: clipped });
  }
}

const ground = [
  [MODEL_BOUNDS.minX, MODEL_BOUNDS.minZ],
  [MODEL_BOUNDS.maxX, MODEL_BOUNDS.minZ],
  [MODEL_BOUNDS.maxX, MODEL_BOUNDS.maxZ],
  [MODEL_BOUNDS.minX, MODEL_BOUNDS.maxZ],
];

const output = {
  meta: {
    source: "OpenStreetMap",
    attribution: "© OpenStreetMap contributors (ODbL)",
    origin: ORIGIN,
    fit: FIT,
    bounds: MODEL_BOUNDS,
    generated: new Date().toISOString().slice(0, 10),
  },
  ground,
  areas,
  lines,
  buildings,
};

mkdirSync(path.dirname(TARGET), { recursive: true });
writeFileSync(TARGET, JSON.stringify(output));
console.log(`Tampilan luar: ${areas.length} area, ${lines.length} jalur, ${buildings.length} gedung -> ${path.relative(ROOT, TARGET)}`);
