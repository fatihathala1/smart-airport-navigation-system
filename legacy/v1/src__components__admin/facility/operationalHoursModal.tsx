"use client";

import { useState } from "react";
import type { OperationalHour, DayOfWeek } from "@/types";

// =============================================================================
// TYPES
// =============================================================================

interface DayState {
  day: DayOfWeek;
  isOpen: boolean;
  is24Hours: boolean;
  openTime: string;
  closeTime: string;
}

interface Props {
  facilityId: number;
  initialHours: OperationalHour[];
  onClose: () => void;
  onSaved: (hours: OperationalHour[]) => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DAY_LABELS: Record<DayOfWeek, string> = {
  1: "Senin",
  2: "Selasa",
  3: "Rabu",
  4: "Kamis",
  5: "Jumat",
  6: "Sabtu",
  7: "Minggu",
};

const DAY_SHORT: Record<DayOfWeek, string> = {
  1: "S",
  2: "S",
  3: "R",
  4: "K",
  5: "J",
  6: "S",
  7: "M",
};

const ALL_DAYS: DayOfWeek[] = [1, 2, 3, 4, 5, 6, 7];

// =============================================================================
// HELPERS
// =============================================================================

function buildInitialState(hours: OperationalHour[]): DayState[] {
  return ALL_DAYS.map((day) => {
    const existing = hours.find((h) => h.day === day);
    return {
      day,
      isOpen:    existing?.isOpen    ?? true,
      is24Hours: existing?.is24Hours ?? false,
      openTime:  existing?.openTime  ?? "08:00",
      closeTime: existing?.closeTime ?? "17:00",
    };
  });
}

// =============================================================================
// KOMPONEN UTAMA
// =============================================================================

export default function OperationalHoursModal({
  facilityId,
  initialHours,
  onClose,
  onSaved,
}: Props) {
  const [days, setDays] = useState<DayState[]>(() =>
    buildInitialState(initialHours)
  );

  // Hari yang sedang di-edit di panel bawah (multi-select circle)
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);

  // Apakah sedang di mode edit panel (klik pensil)
  const [editingPanel, setEditingPanel] = useState(false);

  // Form values di panel edit
  const [panelIsOpen,    setPanelIsOpen]    = useState(true);
  const [panelIs24Hours, setPanelIs24Hours] = useState(false);
  const [panelOpenTime,  setPanelOpenTime]  = useState("08:00");
  const [panelCloseTime, setPanelCloseTime] = useState("17:00");

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // ── Buka panel edit untuk 1 hari ─────────────────────────────────────────
  function openEditPanel(day: DayOfWeek) {
    const d = days.find((x) => x.day === day)!;
    setSelectedDays([day]);
    setPanelIsOpen(d.isOpen);
    setPanelIs24Hours(d.is24Hours);
    setPanelOpenTime(d.openTime  || "08:00");
    setPanelCloseTime(d.closeTime || "17:00");
    setEditingPanel(true);
  }

  // ── Toggle hari di circle selector ────────────────────────────────────────
  function toggleDaySelection(day: DayOfWeek) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  // ── Apply panel ke hari yang dipilih ──────────────────────────────────────
  function applyPanel() {
    if (selectedDays.length === 0) return;

    setDays((prev) =>
      prev.map((d) => {
        if (!selectedDays.includes(d.day)) return d;
        return {
          ...d,
          isOpen:    panelIsOpen,
          is24Hours: panelIs24Hours,
          openTime:  panelIsOpen && !panelIs24Hours ? panelOpenTime  : d.openTime,
          closeTime: panelIsOpen && !panelIs24Hours ? panelCloseTime : d.closeTime,
        };
      })
    );

    setEditingPanel(false);
    setSelectedDays([]);
  }

  // ── Save ke API ────────────────────────────────────────────────────────────
  async function handleSave() {
    setError(null);
    setLoading(true);

    try {
      const payload = days.map((d) => ({
        day:       d.day,
        isOpen:    d.isOpen,
        is24Hours: d.is24Hours,
        openTime:  d.isOpen && !d.is24Hours ? d.openTime  : null,
        closeTime: d.isOpen && !d.is24Hours ? d.closeTime : null,
      }));

      const res  = await fetch(`/api/facilities/${facilityId}/hours`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!json.success) {
        setError(json.error ?? "Gagal menyimpan jam operasional.");
        return;
      }

      onSaved(json.data);
      onClose();
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  // ── Render status per hari ─────────────────────────────────────────────────
  function renderStatus(d: DayState): string {
    if (!d.isOpen)    return "Tutup";
    if (d.is24Hours)  return "24 Jam";
    if (d.openTime && d.closeTime) return `${d.openTime} – ${d.closeTime}`;
    return "—";
  }

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50">
      <div className="relative bg-[#dce8f5] rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex flex-col items-center text-gray-500 hover:text-gray-800 transition"
        >
          <span className="text-2xl leading-none">✕</span>
          <span className="text-[10px] mt-0.5">Close</span>
        </button>

        <h2 className="text-lg font-bold text-gray-800">Jam Buka</h2>

        {/* ── List 7 hari ── */}
        {!editingPanel && (
          <div className="flex flex-col gap-2">
            {days.map((d) => (
              <div
                key={d.day}
                className="flex items-center justify-between bg-white rounded-xl px-4 py-2.5"
              >
                <span className="text-sm font-medium text-gray-700 w-20">
                  {DAY_LABELS[d.day]}
                </span>
                <span
                  className={[
                    "text-sm flex-1 text-center font-medium",
                    !d.isOpen ? "text-red-500" : "text-gray-700",
                  ].join(" ")}
                >
                  {renderStatus(d)}
                </span>
                <button
                  onClick={() => openEditPanel(d.day)}
                  className="ml-2 text-gray-400 hover:text-blue-500 transition text-base"
                  title={`Edit ${DAY_LABELS[d.day]}`}
                >
                  ✎
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── Panel edit hari ── */}
        {editingPanel && (
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-gray-700 text-center">
              Pilih hari &amp; waktu
            </h3>

            {/* Circle selector */}
            <div className="flex justify-center gap-2">
              {ALL_DAYS.map((day) => (
                <button
                  key={day}
                  onClick={() => toggleDaySelection(day)}
                  className={[
                    "w-9 h-9 rounded-full text-sm font-semibold transition border-2",
                    selectedDays.includes(day)
                      ? "bg-blue-500 border-blue-500 text-white"
                      : "bg-white border-gray-200 text-gray-600 hover:border-blue-300",
                  ].join(" ")}
                >
                  {DAY_SHORT[day]}
                </button>
              ))}
            </div>

            {/* Checkbox open 24 jam & closed */}
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={panelIs24Hours}
                  onChange={(e) => {
                    setPanelIs24Hours(e.target.checked);
                    if (e.target.checked) setPanelIsOpen(true);
                  }}
                  className="w-4 h-4 accent-blue-500"
                />
                <span className="text-sm text-gray-700">Open 24 Hours</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!panelIsOpen}
                  onChange={(e) => {
                    setPanelIsOpen(!e.target.checked);
                    if (e.target.checked) setPanelIs24Hours(false);
                  }}
                  className="w-4 h-4 accent-red-500"
                />
                <span className="text-sm text-gray-700">Closed</span>
              </label>
            </div>

            {/* Input jam — hanya tampil kalau buka dan tidak 24 jam */}
            {panelIsOpen && !panelIs24Hours && (
              <div className="flex gap-3">
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-xs text-gray-500 font-medium">
                    Jam Buka
                  </label>
                  <input
                    type="time"
                    value={panelOpenTime}
                    onChange={(e) => setPanelOpenTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-center font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-xs text-gray-500 font-medium">
                    Jam Tutup
                  </label>
                  <input
                    type="time"
                    value={panelCloseTime}
                    onChange={(e) => setPanelCloseTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-center font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>
            )}

            {/* Actions panel */}
            <div className="flex gap-3">
              <button
                onClick={() => { setEditingPanel(false); setSelectedDays([]); }}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={applyPanel}
                disabled={selectedDays.length === 0}
                className="flex-1 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition disabled:opacity-50"
              >
                Terapkan
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-sm text-red-500 text-center">{error}</p>
        )}

        {/* Save / Cancel — hanya di list view */}
        {!editingPanel && (
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-red-400 hover:bg-red-500 text-white text-sm font-medium transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition disabled:opacity-60"
            >
              {loading ? "Menyimpan..." : "Save"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}