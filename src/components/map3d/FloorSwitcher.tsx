"use client";

import { FLOOR_BUTTON_ORDER, FLOOR_LABELS, type FloorId, type FloorView } from "@/lib/map3d/floors";
import { useMapStore } from "@/store/mapStore";

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
  const lang = useMapStore((state) => state.lang);
  const floorName = (floor: FloorId) => lang === "EN" ? (floor === "L1" ? "1st Floor" : "2nd Floor") : FLOOR_LABELS[floor];
  const viewName = view === "ALL"
    ? (floors.length > 1 ? (lang === "EN" ? "All floors" : "Semua lantai") : floorName(floors[0] ?? "L1"))
    : floorName(view);
  return (
    <div className={"floor-switcher"} role="group" aria-label={lang === "EN" ? "Select floor" : "Pilih lantai"}>
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
              title={available ? (pressed ? (lang === "EN" ? "Press again to show all floors" : "Tekan lagi untuk menampilkan semua lantai") : undefined) : (lang === "EN" ? "This floor model is not available" : "Model lantai ini belum tersedia")}
              onClick={() => onSelect(pressed ? "ALL" : floor)}
            >
              <span className={"floor-switcher-number"}>{floor === "L1" ? "1" : "2"}</span>
              <span className={"floor-switcher-name"}>{floorName(floor)}</span>
            </button>
          );
        })}
      </div>
      <p className={"floor-switcher-caption"} role="status" data-view={view}>
        {view === "ALL" ? (lang === "EN" ? "View" : "Tampilan") : (lang === "EN" ? "Showing" : "Menampilkan")} <strong>{viewName}</strong>
      </p>
    </div>
  );
}
