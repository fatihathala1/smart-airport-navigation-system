"use client";

import { FLOOR_BUTTON_ORDER, FLOOR_LABELS, floorViewLabel, type FloorId, type FloorView } from "@/lib/map3d/floors";

type FloorSwitcherProps = {
  view: FloorView;
  /** Lantai yang ada pada model yang dimuat. */
  floors: readonly FloorId[];
  onSelect: (view: FloorView) => void;
};

/**
 * Tombol lantai. Menekan lantai yang sedang aktif membatalkan pilihan,
 * lalu peta kembali menampilkan semua lantai.
 */
export function FloorSwitcher({ view, floors, onSelect }: FloorSwitcherProps) {
  return (
    <div className={"floor-switcher"} role="group" aria-label="Pilih lantai">
      <div className={"floor-switcher-buttons"}>
        {FLOOR_BUTTON_ORDER.map((floor) => {
          const available = floors.includes(floor);
          const pressed = view === floor;
          return (
            <button
              key={floor}
              type="button"
              className="floor-switcher-button"
              aria-pressed={pressed}
              disabled={!available}
              title={available ? (pressed ? "Tekan lagi untuk menampilkan semua lantai" : undefined) : "Model lantai ini belum tersedia"}
              onClick={() => onSelect(pressed ? "ALL" : floor)}
            >
              <span className={"floor-switcher-number"}>{floor === "L1" ? "1" : "2"}</span>
              <span className={"floor-switcher-name"}>{FLOOR_LABELS[floor]}</span>
            </button>
          );
        })}
      </div>
      <p className={"floor-switcher-caption"} role="status" data-view={view}>
        {view === "ALL" ? "Tampilan" : "Menampilkan"} <strong>{floorViewLabel(view, floors)}</strong>
      </p>
    </div>
  );
}
