import type * as THREE from "three";

/**
 * Lantai Terminal 1.
 *
 * Kedua lantai berada dalam satu file GLB (`t1-gabungan.glb`, dibuat oleh
 * `scripts/merge-floors.mjs`). Isi tiap lantai dikelompokkan di bawah node
 * `LEVEL__L1` dan `LEVEL__L2`. Tombol lantai hanya menyembunyikan grup lantai
 * lain, jadi model tidak dimuat ulang dan rute yang sedang aktif tetap ada.
 */
export type FloorId = "L1" | "L2";
export type FloorView = FloorId | "ALL";

export const FLOOR_LABELS: Record<FloorId, string> = {
  L1: "Lantai 1",
  L2: "Lantai 2",
};

/** Urutan tombol dari atas ke bawah, sesuai posisi lantai di gedung. */
export const FLOOR_BUTTON_ORDER: FloorId[] = ["L2", "L1"];

/** Urutan dari bawah ke atas. */
export const FLOOR_ORDER: FloorId[] = ["L1", "L2"];

const LEVEL_GROUP_NAME = /^LEVEL__(L[12])$/;

export function levelGroupName(floor: FloorId) {
  return `LEVEL__${floor}`;
}

/**
 * Lantai tempat sebuah objek berada, dibaca dari grup `LEVEL__` di atasnya.
 * Model lama yang hanya berisi lantai dasar tidak punya grup ini, jadi
 * dianggap Lantai 1.
 */
export function floorOfObject(object: THREE.Object3D): FloorId {
  for (let current: THREE.Object3D | null = object; current; current = current.parent) {
    const match = LEVEL_GROUP_NAME.exec(current.name);
    if (match) return match[1] as FloorId;
  }
  return "L1";
}

/** Lantai yang tersedia pada model yang sedang dimuat. */
export function floorsInModel(root: THREE.Object3D): FloorId[] {
  const found = FLOOR_ORDER.filter((floor) => root.getObjectByName(levelGroupName(floor)));
  return found.length ? found : ["L1"];
}

export function floorViewLabel(view: FloorView, floors: readonly FloorId[]) {
  if (view !== "ALL") return FLOOR_LABELS[view];
  return floors.length > 1 ? "Semua lantai" : FLOOR_LABELS[floors[0] ?? "L1"];
}
