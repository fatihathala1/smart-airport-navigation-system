"use client";

import { useMemo, useState } from "react";
import { Layers3, MapPin } from "lucide-react";
import { MapStage } from "@/components/wayfinding/MapStage";
import { floors, spaces } from "@/data/demo-wayfinding";
import type { MapSpace, TerminalCode } from "@/types";

export function AdminMapPanel() {
  const [terminal, setTerminal] = useState<TerminalCode>("T1");
  const [floorId, setFloorId] = useState("T1-L1");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const terminalFloors = floors.filter((floor) => floor.terminal === terminal);
  const visibleSpaces = useMemo(
    () => spaces.filter((space) => space.floorId === floorId),
    [floorId]
  );
  const selected = spaces.find((space) => space.id === selectedId) ?? null;

  const selectTerminal = (nextTerminal: TerminalCode) => {
    setTerminal(nextTerminal);
    setFloorId(`${nextTerminal}-L1`);
    setSelectedId(null);
  };

  const selectSpace = (space: MapSpace) => {
    setSelectedId(space.id);
  };

  return (
    <div className="content-box admin-map-box">
      <div className="box-header admin-map-header">
        <div className="box-title">
          <h2>Peta Terminal Interaktif</h2>
          <p>Pantau ruang, tenant, dan fasilitas tanpa keluar dari portal admin.</p>
        </div>

        <div className="admin-map-selectors" aria-label="Pilih area peta">
          <div className="admin-map-selector-group" aria-label="Pilih terminal">
            {(["T1", "T2"] as TerminalCode[]).map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={terminal === item}
                onClick={() => selectTerminal(item)}
              >
                Terminal {item.slice(1)}
              </button>
            ))}
          </div>
          <div className="admin-map-selector-group" aria-label="Pilih lantai">
            {terminalFloors.map((floor) => (
              <button
                key={floor.id}
                type="button"
                aria-pressed={floorId === floor.id}
                onClick={() => {
                  setFloorId(floor.id);
                  setSelectedId(null);
                }}
              >
                {floor.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="admin-map-summary">
        <span><Layers3 size={15} /> {terminal} &bull; {floorId.endsWith("L1") ? "Lantai 1" : "Lantai 2"}</span>
        <strong>{visibleSpaces.length} lokasi ditampilkan</strong>
      </div>

      <div className="admin-map-canvas">
        <MapStage
          terminal={terminal}
          floorId={floorId}
          spaces={visibleSpaces}
          selectedId={selectedId}
          route={null}
          fromId={null}
          toId={null}
          currentId={null}
          onSelect={selectSpace}
        />
      </div>

      <div className="admin-map-selection" data-empty={!selected}>
        <span className="admin-map-selection-icon"><MapPin size={18} /></span>
        {selected ? (
          <div>
            <small>LOKASI TERPILIH</small>
            <strong>{selected.tenant?.name ?? selected.label}</strong>
            <span>{selected.code} &bull; {selected.category} &bull; {selected.status === "ACTIVE" ? "Aktif" : "Tidak aktif"}</span>
          </div>
        ) : (
          <div>
            <strong>Pilih lokasi pada peta</strong>
            <span>Klik area ruang atau ikon POI untuk melihat ringkasannya.</span>
          </div>
        )}
      </div>
    </div>
  );
}
