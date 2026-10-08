import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Pesawat low-poly untuk apron, dibangun dari bentuk dasar three.js.
 *
 * Ukuran mengikuti pesawat lorong tunggal (kelas A320/B737) dikali skala model
 * sekitar 0,81 (lihat FIT di scripts/build-exterior.mjs): panjang ±30,6,
 * bentang sayap ±29, tinggi ekor ±9,7.
 *
 * Sumbu lokal: hidung di z = 0 menghadap -Z (ke arah terminal), ekor ke +Z,
 * sayap kanan ke +X, y = 0 di permukaan apron.
 */
export const AIRCRAFT = {
  length: 30.6,
  radius: 1.6,
  /** Tinggi sumbu badan pesawat dari apron. */
  bodyY: 2.6,
  /** Jarak pintu depan dari ujung hidung. */
  doorFromNose: 4.5,
  halfSpan: 14.5,
} as const;

export type AircraftParts = {
  body: THREE.BufferGeometry;
  livery: THREE.BufferGeometry;
  engine: THREE.BufferGeometry;
  glass: THREE.BufferGeometry;
  gear: THREE.BufferGeometry;
};

/** Pelat datar dari denah (x, z), tebal ke bawah dari `topY`. */
function planform(points: [number, number][], topY: number, thickness: number) {
  const geometry = new THREE.ExtrudeGeometry(new THREE.Shape(points.map(([x, z]) => new THREE.Vector2(x, z))), {
    depth: thickness,
    bevelEnabled: false,
  });
  // (u, v, w) → (u, -w, v): denah ke bidang XZ, ketebalan ke arah -Y.
  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, topY, 0);
  return geometry;
}

function mirrorX(points: [number, number][]): [number, number][] {
  return points.map(([x, z]) => [-x, z] as [number, number]).reverse();
}

function cylinderAlongZ(radiusFront: number, radiusBack: number, length: number, x: number, y: number, zFront: number) {
  const geometry = new THREE.CylinderGeometry(radiusFront, radiusBack, length, 14);
  // Sumbu silinder (Y) diputar ke Z; ujung atas (radiusFront) menghadap -Z.
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(x, y, zFront + length / 2);
  return geometry;
}

function merged(parts: THREE.BufferGeometry[]) {
  const geometry = mergeGeometries(parts.map((part) => {
    const flat = part.index ? part.toNonIndexed() : part;
    flat.deleteAttribute("uv");
    return flat;
  }));
  parts.forEach((part) => part.dispose());
  geometry.computeVertexNormals();
  return geometry;
}

export function createAircraftParts(): AircraftParts {
  const { radius, bodyY, length } = AIRCRAFT;

  // Badan pesawat: profil diputar (lathe) lalu diarahkan ke sumbu Z.
  const profile: [number, number][] = [
    [0, 0], [0.75, 0.35], [1.2, 1.0], [1.48, 2.0], [radius, 3.4],
    [radius, 21.5], [1.45, 24.2], [1.0, 27.4], [0.45, 30.2], [0, length],
  ];
  const fuselage = new THREE.LatheGeometry(profile.map(([r, along]) => new THREE.Vector2(r, along)), 24);
  // (x, y, z) → (x, -z, y): sumbu lathe (Y) menjadi Z.
  fuselage.rotateX(Math.PI / 2);
  fuselage.translate(0, bodyY, 0);

  // Sayap rendah dengan sudut sapu, kanan dan kiri.
  const wingRight: [number, number][] = [[0.8, 11], [AIRCRAFT.halfSpan, 17.2], [AIRCRAFT.halfSpan, 18.7], [0.8, 17.4]];
  const wingY = bodyY - 0.85;
  const wings = [planform(wingRight, wingY, 0.32), planform(mirrorX(wingRight), wingY, 0.32)];

  // Stabilisator datar di ekor.
  const stabRight: [number, number][] = [[0.3, 26.2], [5.6, 28.9], [5.6, 30.0], [0.3, 29.4]];
  const stabY = bodyY + 0.45;
  const stabilizers = [planform(stabRight, stabY, 0.22), planform(mirrorX(stabRight), stabY, 0.22)];

  // Sirip tegak: denah (z, y), diputar supaya tebalnya ke arah X.
  const fin = new THREE.ExtrudeGeometry(new THREE.Shape([
    new THREE.Vector2(23.8, 0), new THREE.Vector2(30.2, 0), new THREE.Vector2(30.5, 6.4), new THREE.Vector2(28.4, 6.4),
  ]), { depth: 0.3, bevelEnabled: false });
  // (u, v, w) → (-w, v, u)
  fin.rotateY(-Math.PI / 2);
  fin.translate(0.15, bodyY + 0.9, 0);

  // Dua mesin di bawah sayap, masing-masing dengan pylon.
  const engines = [-1, 1].flatMap((side) => {
    const x = side * 5.1;
    const engineY = bodyY - 1.75;
    const pylon = new THREE.BoxGeometry(0.3, 0.9, 2.6);
    pylon.translate(x, bodyY - 1.05, 13.4);
    return [cylinderAlongZ(0.86, 0.68, 3.6, x, engineY, 10.6), pylon];
  });

  // Kaca kokpit dan jendela kabin: pita gelap yang sedikit menonjol dari badan.
  const cockpit = new THREE.BoxGeometry(2.1, 0.38, 1.1);
  cockpit.translate(0, bodyY + 0.62, 1.75);
  const cabinWindows = new THREE.BoxGeometry(radius * 2 + 0.06, 0.24, 17.5);
  cabinWindows.translate(0, bodyY + 0.42, 5.2 + 17.5 / 2);

  // Roda pendarat: satu di hidung, dua di bawah sayap.
  const gear = [[0, 3.6], [-2.3, 15.4], [2.3, 15.4]].flatMap(([x, z]) => {
    const strut = new THREE.CylinderGeometry(0.12, 0.12, bodyY - radius, 6);
    strut.translate(x, (bodyY - radius) / 2 + 0.35, z);
    const wheel = new THREE.CylinderGeometry(0.42, 0.42, 0.5, 10);
    wheel.rotateZ(Math.PI / 2);
    wheel.translate(x, 0.42, z);
    return [strut, wheel];
  });

  return {
    body: merged([fuselage, ...wings, ...stabilizers]),
    livery: merged([fin]),
    engine: merged(engines),
    glass: merged([cockpit, cabinWindows]),
    gear: merged(gear),
  };
}

export type AircraftStand = {
  id: string;
  /** Posisi ujung hidung pesawat pada bidang XZ. */
  nose: [x: number, z: number];
  /** Warna ekor. Warna polos, bukan identitas maskapai mana pun. */
  livery: string;
};

const JET_BRIDGE = /^garbarata[_-]?([a-z0-9]+)$/i;

const LIVERIES = ["#1f6fb2", "#c8423c", "#2f8f5b", "#d98a1c", "#5a4bb0", "#0f8b97"];

/** Stand yang sengaja dibiarkan kosong supaya apron tidak tampak seragam. */
const EMPTY_STAND_EVERY = 5;

/**
 * Satu stand per garbarata. Kabin garbarata pada model berbelok ke barat di
 * ujungnya, jadi pintu depan pesawat ditempatkan di sisi barat kotak
 * garbarata, sedikit di depan ujung luarnya.
 */
export function findAircraftStands(objects: { name: string; object: THREE.Object3D }[]): AircraftStand[] {
  const bridges = objects
    .flatMap(({ name, object }) => {
      const match = JET_BRIDGE.exec(name.replace(/__L2$/, ""));
      if (!match) return [];
      object.updateWorldMatrix(true, false);
      const box = new THREE.Box3().setFromObject(object);
      if (box.isEmpty()) return [];
      return [{ id: match[1].toLowerCase(), box }];
    })
    .sort((left, right) => left.box.min.x - right.box.min.x);

  return bridges
    .filter((_, index) => index % EMPTY_STAND_EVERY !== EMPTY_STAND_EVERY - 2)
    .map(({ id, box }, index) => {
      const doorX = box.min.x;
      const doorZ = box.max.z - 1.4;
      return {
        id,
        nose: [doorX - (AIRCRAFT.radius + 0.25), doorZ - AIRCRAFT.doorFromNose],
        livery: LIVERIES[index % LIVERIES.length],
      };
    });
}
