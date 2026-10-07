import { GROUND_FLOOR_MODEL_URL } from "@/lib/map3d/assets";

/**
 * Tampilan lantai Terminal 1.
 *
 * Taruh tiga file GLB berikut di `public/models/`. Nama file bebas diganti di sini,
 * dan tidak ada kode lain yang perlu diubah.
 *   - t1-lantai-1.glb   : Lantai 1 saja
 *   - t1-lantai-2.glb   : Lantai 2 saja
 *   - t1-gabungan.glb   : Lantai 1 + Lantai 2 (tampilan bawaan saat tidak ada lantai dipilih)
 *
 * Selama file baru belum ada, tampilan memakai model lantai dasar yang sudah ada
 * supaya peta tidak kosong.
 */
export type FloorId = "L1" | "L2";
export type FloorView = FloorId | "ALL";

export type FloorDefinition = {
  view: FloorView;
  /** Label di tombol. */
  label: string;
  /** Kandidat file, dicoba berurutan. */
  candidates: string[];
  /** Rute dan pencarian titik awal hanya aktif pada model yang graf navigasinya sudah dibuat. */
  routable: boolean;
};

export const FLOOR_VERSION = "20261007";

export const FLOOR_DEFINITIONS: Record<FloorView, FloorDefinition> = {
  L1: {
    view: "L1",
    label: "Lantai 1",
    candidates: [`/models/t1-lantai-1.glb?v=${FLOOR_VERSION}`, GROUND_FLOOR_MODEL_URL],
    routable: true,
  },
  L2: {
    view: "L2",
    label: "Lantai 2",
    candidates: [`/models/t1-lantai-2.glb?v=${FLOOR_VERSION}`],
    routable: false,
  },
  ALL: {
    view: "ALL",
    label: "Gabungan",
    candidates: [`/models/t1-gabungan.glb?v=${FLOOR_VERSION}`],
    routable: false,
  },
};

/** Urutan tombol dari atas ke bawah, sesuai posisi lantai di gedung. */
export const FLOOR_BUTTON_ORDER: FloorId[] = ["L2", "L1"];

export type FloorAvailability = Record<FloorView, string | null>;

export const EMPTY_FLOOR_AVAILABILITY: FloorAvailability = { L1: null, L2: null, ALL: null };

/** Mengembalikan URL pertama yang benar-benar ada di server, atau null. */
export async function probeFloorModel(candidates: string[], signal?: AbortSignal): Promise<string | null> {
  for (const url of candidates) {
    try {
      const response = await fetch(url, { method: "HEAD", cache: "no-store", signal });
      if (response.ok) return url;
    } catch {
      if (signal?.aborted) return null;
    }
  }
  return null;
}

/**
 * Model yang ditampilkan untuk pilihan pengguna.
 * `selected === null` berarti tidak ada lantai yang ditekan, jadi tampil gabungan.
 * Jika file gabungan belum ada, jatuh ke Lantai 1 supaya peta tetap berfungsi.
 */
export function resolveFloorView(selected: FloorId | null, availability: FloorAvailability): { view: FloorView; url: string | null; isFallback: boolean } {
  const wanted: FloorView = selected ?? "ALL";
  const direct = availability[wanted];
  if (direct) return { view: wanted, url: direct, isFallback: false };
  if (wanted === "ALL" && availability.L1) return { view: "L1", url: availability.L1, isFallback: true };
  return { view: wanted, url: null, isFallback: false };
}
