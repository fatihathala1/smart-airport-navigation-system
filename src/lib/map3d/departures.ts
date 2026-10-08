/**
 * Area check-in Terminal 1 beserta maskapai yang dilayani.
 * Ubah isi file ini saat pembagian counter berubah. Komponen tidak perlu disentuh.
 *
 * Logo: taruh file di `public/airlines/<slug>.svg` (atau `.png`). Selama file belum ada,
 * kartu menampilkan inisial nama maskapai.
 */
export type CounterRange = { from: number; to: number };

export type DepartureAirline = {
  slug: string;
  name: string;
  /** Diisi jika maskapai punya rentang counter sendiri di dalam area. */
  counters?: CounterRange;
};

export type DepartureArea = {
  number: 1 | 2 | 3 | 4;
  counters: CounterRange;
  /** false = area sedang tidak beroperasi dan tidak bisa dipilih. */
  active: boolean;
  /** Keterangan singkat di bawah judul area. */
  note?: string;
  airlines: DepartureAirline[];
};

export const DEPARTURE_AREAS: DepartureArea[] = [
  {
    number: 1,
    counters: { from: 1, to: 23 },
    active: true,
    airlines: [
      { slug: "garuda-indonesia", name: "Garuda Indonesia", counters: { from: 1, to: 7 } },
      { slug: "citilink", name: "Citilink", counters: { from: 8, to: 19 } },
      { slug: "pelita-air", name: "Pelita Air", counters: { from: 20, to: 23 } },
    ],
  },
  {
    number: 2,
    counters: { from: 24, to: 36 },
    active: false,
    airlines: [],
  },
  {
    number: 3,
    counters: { from: 37, to: 59 },
    active: true,
    note: "Pesawat kelompok kecil",
    airlines: [
      { slug: "batik-air", name: "Batik Air" },
      { slug: "sriwijaya-air", name: "Sriwijaya Air" },
      { slug: "super-air-jet", name: "Super Air Jet" },
      { slug: "susi-air", name: "Susi Air" },
    ],
  },
  {
    number: 4,
    counters: { from: 60, to: 83 },
    active: true,
    airlines: [
      { slug: "lion-air", name: "Lion Air" },
      { slug: "super-air-jet", name: "Super Air Jet" },
      { slug: "transnusa", name: "TransNusa" },
    ],
  },
];

export function formatCounterRange({ from, to }: CounterRange): string {
  return from === to ? `Counter ${from}` : `Counter ${from}–${to}`;
}
