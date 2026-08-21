"use client";

import { useMapStore } from "@/store/mapStore";
import { DAY_LABELS } from "@/types";
import type { DayOfWeek, OperationalHour } from "@/types";

export default function POIDetailPopup() {
  const selectedFacility      = useMapStore((s) => s.selectedFacility);
  const clearSelectedFacility = useMapStore((s) => s.clearSelectedFacility);
  const isRouteOpen           = useMapStore((s) => s.isRouteOpen);
  const setIsRouteOpen        = useMapStore((s) => s.setIsRouteOpen);

  if (!selectedFacility) return null;

  const jsDay = new Date().getDay();
  const todayDay: DayOfWeek = jsDay === 0 ? 7 : (jsDay as DayOfWeek);

  const todayHour: OperationalHour | undefined =
    selectedFacility.operationalHours.find((h) => h.day === todayDay);

  const formatJamHariIni = (): string => {
    if (!todayHour)                               return "—";
    if (!todayHour.isOpen)                        return "Tutup";
    if (todayHour.is24Hours)                      return "24 Jam";
    if (todayHour.openTime && todayHour.closeTime)
      return `${todayHour.openTime} – ${todayHour.closeTime}`;
    return "—";
  };

  const jamLabel = todayHour
    ? `${DAY_LABELS[todayDay]}: ${formatJamHariIni()}`
    : "Jam tidak tersedia";

  const handleRouteClick = () => {
    // FIX: JANGAN panggil clearSelectedFacility() di sini.
    // RoutePanel membutuhkan selectedFacility untuk:
    // 1. Kalkulasi A* (gridRow/gridCol sebagai tujuan)
    // 2. Menampilkan nama & kategori tujuan di UI
    // Jika di-clear, RoutePanel guard `if (!selectedFacility) return null` langsung aktif
    // dan panel tidak pernah tampil meski isRouteOpen = true.
    setIsRouteOpen(true);
  };

  const handleClose = () => clearSelectedFacility();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={`Detail ${selectedFacility.name}`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Wrapper: modal + tombol Close di luar (kanan atas) */}
      <div className="relative z-10 flex items-start gap-3 mx-4 animate-in fade-in zoom-in-95 duration-150">

        {/* ── Modal utama ── */}
        <div
          className={[
            "w-[clamp(480px,55vw,680px)]",
            "bg-[#dce9f5] rounded-2xl shadow-2xl",
            "p-5 flex flex-col gap-4",
          ].join(" ")}
        >
          <div className="flex gap-4">

            {/* ── Kolom kiri: foto + tombol rute ── */}
            <div className="flex flex-col gap-3 w-[clamp(140px,30%,200px)] shrink-0">
            {/* Foto / placeholder */}
            <div
              className="flex-1 min-h-[clamp(120px,18vw,180px)] rounded-xl overflow-hidden border border-slate-200"
              aria-label="Foto fasilitas"
            >
              {selectedFacility.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedFacility.photo}
                  alt={selectedFacility.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-white flex flex-col items-center justify-center gap-2 text-slate-300">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-10 h-10"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
                    />
                  </svg>
                  <span className="text-[clamp(10px,1vw,12px)] text-slate-400">
                    Foto belum tersedia
                  </span>
                </div>
              )}
            </div>

              {/* Tombol rute */}
              <button
                onClick={handleRouteClick}
                disabled={isRouteOpen}
                aria-label={
                  isRouteOpen
                    ? "Panel rute sudah terbuka"
                    : "Tunjukkan arah ke fasilitas ini"
                }
                className={[
                  "w-full min-h-13 rounded-xl",
                  "text-[clamp(13px,1.4vw,15px)] font-semibold",
                  "transition-colors duration-150",
                  isRouteOpen
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                    : "bg-[#7a9bbf] hover:bg-[#6a8caf] active:bg-[#5a7c9f] text-white shadow-sm",
                ].join(" ")}
              >
                {isRouteOpen ? "✅ Rute Terbuka" : "Tunjukkan arah"}
              </button>
            </div>

            {/* ── Kolom kanan: info fasilitas ── */}
            <div className="flex-1 flex flex-col gap-3 min-w-0">

              {/* Nama fasilitas */}
              <div className="flex flex-col gap-0.5">
                <h2
                  className={[
                    "text-[clamp(18px,2.2vw,26px)] font-bold text-slate-800 leading-tight",
                    "border-b-2 border-slate-300 pb-1",
                  ].join(" ")}
                >
                  {selectedFacility.name}
                </h2>
                <span
                  className="inline-flex items-center gap-1 text-[clamp(11px,1.1vw,13px)] font-medium mt-0.5"
                  style={{ color: selectedFacility.category.color }}
                >
                {selectedFacility.category.icon && (
                  selectedFacility.category.icon.trimStart().startsWith("<svg") ? (
                    <span
                      className="w-4 h-4 inline-flex [&>svg]:w-full [&>svg]:h-full"
                      style={{ color: selectedFacility.category.color }}
                      dangerouslySetInnerHTML={{ __html: selectedFacility.category.icon }}
                    />
                  ) : selectedFacility.category.icon.startsWith("data:") || selectedFacility.category.icon.startsWith("http") || selectedFacility.category.icon.startsWith("/") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selectedFacility.category.icon} alt="" className="w-4 h-4 object-contain" />
                  ) : (
                    <span>{selectedFacility.category.icon}</span>
                  )
                )}{" "}{selectedFacility.category.name}
                </span>
              </div>

              {/* Kode tempat */}
              <div
                className={[
                  "flex items-center gap-2 px-3 py-2",
                  "bg-white rounded-xl border border-slate-200",
                ].join(" ")}
              >
                <span className="text-slate-400 text-sm shrink-0">📍</span>
                <div className="flex flex-col leading-tight">
                  <span className="text-[clamp(10px,1vw,11px)] text-slate-400 font-medium uppercase tracking-wide">
                    Kode Tempat
                  </span>
                  <span className="text-[clamp(13px,1.4vw,15px)] text-slate-700 font-semibold">
                    {selectedFacility.code || "—"}
                  </span>
                </div>
                <span className="ml-auto text-[clamp(11px,1.1vw,13px)] text-slate-500 bg-slate-100 rounded-lg px-2 py-0.5">
                  {selectedFacility.floor.label}
                </span>
              </div>

              {/* Jam buka hari ini */}
              <div
                className={[
                  "flex items-center gap-2 px-3 py-2",
                  "bg-white rounded-xl border border-slate-200",
                ].join(" ")}
              >
                <span className="text-slate-400 text-sm shrink-0">🕐</span>
                <div className="flex flex-col leading-tight">
                  <span className="text-[clamp(10px,1vw,11px)] text-slate-400 font-medium uppercase tracking-wide">
                    Jam Buka
                  </span>
                  <span
                    className={[
                      "text-[clamp(13px,1.4vw,15px)] font-semibold",
                      todayHour?.isOpen === false ? "text-red-500" : "text-slate-700",
                    ].join(" ")}
                  >
                    {jamLabel}
                  </span>
                </div>
              </div>

              {/* Deskripsi */}
              <div
                className={[
                  "flex-1 px-3 py-2",
                  "bg-white rounded-xl border border-slate-200",
                  "min-h-[clamp(60px,8vw,90px)]",
                ].join(" ")}
              >
                <span className="block text-[clamp(10px,1vw,11px)] text-slate-400 font-medium uppercase tracking-wide mb-1">
                  Deskripsi
                </span>
                <p className="text-[clamp(12px,1.3vw,14px)] text-slate-600 leading-relaxed">
                  {selectedFacility.description ?? (
                    <span className="text-slate-300 italic">
                      Deskripsi belum tersedia
                    </span>
                  )}
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* ── Tombol Close — di luar modal ── */}
        <div className="flex flex-col items-center gap-1 mt-0">
          <button
            onClick={handleClose}
            aria-label="Tutup detail fasilitas"
            className={[
              "flex flex-col items-center justify-center gap-0.5",
              "min-w-15 min-h-15 rounded-2xl",
              "bg-white/90 hover:bg-white shadow-md",
              "text-slate-600 hover:text-slate-800",
              "transition-colors duration-150",
              "px-2 py-2",
            ].join(" ")}
          >
            <svg
              className="w-7 h-7"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="text-[11px] font-semibold tracking-wide leading-none">
              Close
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}