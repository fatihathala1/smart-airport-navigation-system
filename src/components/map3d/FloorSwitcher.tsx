"use client";

import { FLOOR_BUTTON_ORDER, FLOOR_DEFINITIONS, type FloorAvailability, type FloorId, type FloorView } from "@/lib/map3d/floors";

type FloorSwitcherProps = {
  selected: FloorId | null;
  shownView: FloorView;
  isFallback: boolean;
  availability: FloorAvailability;
  onSelect: (floor: FloorId | null) => void;
};

/**
 * Tombol lantai. Menekan lantai yang sedang aktif membatalkan pilihan,
 * lalu peta kembali ke tampilan gabungan.
 */
export function FloorSwitcher({ selected, shownView, isFallback, availability, onSelect }: FloorSwitcherProps) {
  const caption = selected
    ? FLOOR_DEFINITIONS[selected].label
    : isFallback
      ? "Lantai 1"
      : "2 lantai";

  return (
    <div className={"floor-switcher"} role="group" aria-label="Pilih lantai">
      <div className={"floor-switcher-buttons"}>
        {FLOOR_BUTTON_ORDER.map((floor) => {
          const available = Boolean(availability[floor]);
          const pressed = selected === floor;
          return (
            <button
              key={floor}
              type="button"
              className="floor-switcher-button"
              aria-pressed={pressed}
              disabled={!available}
              title={available ? (pressed ? "Tekan lagi untuk tampilan gabungan" : undefined) : "Model lantai ini belum tersedia"}
              onClick={() => onSelect(pressed ? null : floor)}
            >
              <span className={"floor-switcher-number"}>{floor === "L1" ? "1" : "2"}</span>
              <span className={"floor-switcher-name"}>{FLOOR_DEFINITIONS[floor].label}</span>
            </button>
          );
        })}
      </div>
      <p className={"floor-switcher-caption"} role="status" data-view={shownView}>
        {selected ? "Menampilkan" : "Tampilan"} <strong>{caption}</strong>
      </p>
    </div>
  );
}
