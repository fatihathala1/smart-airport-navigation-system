import type { Point2 } from "./walkable-grid";

/**
 * Deteksi lantai dari geometri, bukan dari nama objek.
 *
 * Model GLB berikutnya belum tentu memakai konvensi penamaan yang sama
 * (`area_visitor`, `tembok_pilar`, `DOOR__`). Modul ini mengenali lantai dari
 * bentuknya: segitiga yang hampir datar, menghadap ke atas, dan luasnya besar.
 * Ketinggian segitiga-segitiga itu dikelompokkan menjadi tingkat lantai.
 */
export type SurfaceTriangle = {
  /** Koordinat dunia, urutan sesuai geometri sumber. */
  vertices: [[number, number, number], [number, number, number], [number, number, number]];
  /** Luas proyeksi pada bidang XZ. */
  area: number;
  /** Ketinggian rata-rata. */
  y: number;
};

export type FloorLevel = {
  /** Ketinggian acuan lantai, rata-rata berbobot luas. */
  y: number;
  /** Total luas permukaan datar pada tingkat ini. */
  area: number;
  /** Rentang ketinggian segitiga yang masuk tingkat ini. */
  minY: number;
  maxY: number;
};

/** Segitiga dianggap datar bila beda tinggi antar titiknya di bawah nilai ini. */
export const FLAT_TRIANGLE_TOLERANCE = 0.12;

/** Beda tinggi maksimum antar permukaan yang masih dianggap satu lantai. */
export const LEVEL_MERGE_TOLERANCE = 0.45;

export function triangleAreaXZ(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
  c: readonly [number, number, number],
) {
  return Math.abs((b[0] - a[0]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[0] - a[0])) / 2;
}

/**
 * Kelompokkan permukaan datar menjadi tingkat lantai.
 *
 * Tingkat diurutkan dari yang terluas, sehingga pemanggil dapat memakai
 * elemen pertama sebagai lantai utama tanpa menebak ketinggian.
 */
export function detectFloorLevels(
  surfaces: SurfaceTriangle[],
  options: { mergeTolerance?: number; minAreaRatio?: number } = {},
): FloorLevel[] {
  const mergeTolerance = options.mergeTolerance ?? LEVEL_MERGE_TOLERANCE;
  const minAreaRatio = options.minAreaRatio ?? 0.08;
  if (!surfaces.length) return [];

  const sorted = [...surfaces].sort((left, right) => left.y - right.y);
  const clusters: { minY: number; maxY: number; area: number; weighted: number }[] = [];
  for (const surface of sorted) {
    const current = clusters.at(-1);
    if (current && surface.y - current.minY <= mergeTolerance) {
      current.maxY = Math.max(current.maxY, surface.y);
      current.area += surface.area;
      current.weighted += surface.y * surface.area;
      continue;
    }
    clusters.push({ minY: surface.y, maxY: surface.y, area: surface.area, weighted: surface.y * surface.area });
  }

  const largest = Math.max(...clusters.map((cluster) => cluster.area));
  return clusters
    .filter((cluster) => cluster.area >= largest * minAreaRatio)
    .map((cluster) => ({
      y: cluster.area > 0 ? cluster.weighted / cluster.area : cluster.minY,
      area: cluster.area,
      minY: cluster.minY,
      maxY: cluster.maxY,
    }))
    .sort((left, right) => right.area - left.area);
}

/**
 * Tinggi ruang bebas di atas sebuah lantai. Dibatasi oleh lantai berikutnya
 * supaya pelat lantai 2 tidak dihitung sebagai penghalang di lantai 1.
 */
export function headroomFor(level: FloorLevel, levels: FloorLevel[], preferred: number): number {
  const above = levels
    .map((candidate) => candidate.minY)
    .filter((y) => y > level.maxY + 0.5)
    .sort((left, right) => left - right)[0];
  if (above === undefined) return preferred;
  return Math.max(0.5, Math.min(preferred, above - level.y - 0.15));
}

/** Pusat sebuah footprint, dipakai untuk menguji keterjangkauan. */
export function footprintCenter(footprint: { minX: number; maxX: number; minZ: number; maxZ: number }): Point2 {
  return [(footprint.minX + footprint.maxX) / 2, (footprint.minZ + footprint.maxZ) / 2];
}
