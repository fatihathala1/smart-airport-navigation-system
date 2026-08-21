// ============================================================================
// PATCH 1 — getRoomAnchor
// File target: src/utils/roomAnchor.ts  (file baru)
//
// Fungsi ini menggantikan penggunaan langsung dest.r / dest.c sebagai
// navigation endpoint. Room menjadi source of truth untuk anchor navigasi.
//
// Tidak ada dependency ke A* atau store — pure function, aman ditest.
// ============================================================================

type RoomBox = { r1: number; c1: number; r2: number; c2: number };

interface DestinationLike {
  id: string;
  r: number;
  c: number;
  room?: RoomBox;
}

/**
 * Tentukan apakah destination berada di lantai 2.
 * Lantai 2 di T1: row 0–32. Lantai 2 di T2: row 0–54.
 * Kita deteksi via prefix ID ("l2_") — lebih reliable dari koordinat.
 */

/**
 * Hitung navigation anchor dari room box.
 *
 * Strategy:
 * - Lantai 1: corridor ada di BAWAH room → anchor = baris r2 (bawah room), kolom tengah
 * - Lantai 2: corridor ada di BAWAH room dalam grid juga (row lebih besar = lebih bawah secara visual)
 *             tapi di T1 lantai 2 row 0–32, corridor-nya ada di ROW BAWAH (row ~20–29)
 *             sehingga strategy sama: ambil r2
 *
 * Fallback: jika room tidak ada, kembalikan r,c asli (perilaku lama).
 * Fallback juga jika kalkulasi menghasilkan koordinat negatif atau di luar batas.
 */
export function getRoomAnchor(
  dest: DestinationLike,
  rows: number,
  cols: number
): { r: number; c: number } {
  // Fallback: tidak ada room → pakai koordinat asli
  if (!dest.room) {
    return { r: dest.r, c: dest.c };
  }

const { c1, r2, c2 } = dest.room;

  // Guard: koordinat negatif (e.g. l2_kan1 T2 dengan c1: -1)
  const safeC1 = Math.max(0, c1);
  const safeC2 = Math.min(cols - 1, c2);
  const safeR2 = Math.min(rows - 1, r2);

  // Anchor kolom: tengah horizontal room
  const anchorC = Math.round((safeC1 + safeC2) / 2);

  // Anchor baris: sisi bawah room (r2), karena corridor biasanya di bawah room
  // Untuk lantai 2 yang row-nya kecil (0–32 / 0–49), r2 > r1 tetap berlaku
  // karena grid origin di kiri atas — r2 = lebih bawah secara visual
  const anchorR = Math.round(safeR2);

  // Clamp ke batas grid
  const clampedR = Math.max(0, Math.min(rows - 1, anchorR));
  const clampedC = Math.max(0, Math.min(cols - 1, anchorC));

  return { r: clampedR, c: clampedC };
}

/**
 * Versi dengan fallback eksplisit ke dest.r / dest.c jika anchor
 * hasil kalkulasi ternyata sama dengan wall (validasi dilakukan di luar,
 * di nearestWalkable).
 *
 * Ini adalah entry point utama yang dipanggil dari handleDestinationClick.
 */
export function resolveNavigationAnchor(
  dest: DestinationLike,
  rows: number,
  cols: number,
  wallSet: Set<string>
): { r: number; c: number } {
  const anchor = getRoomAnchor(dest, rows, cols);

  // Jika anchor hasil kalkulasi valid (walkable) → pakai
  if (!wallSet.has(`${anchor.r},${anchor.c}`)) {
    return anchor;
  }

  // Jika anchor di wall → coba titik asli dest.r / dest.c
  if (!wallSet.has(`${dest.r},${dest.c}`)) {
    return { r: dest.r, c: dest.c };
  }

  // Keduanya di wall → kembalikan anchor, biarkan nearestWalkable handle
  return anchor;
}