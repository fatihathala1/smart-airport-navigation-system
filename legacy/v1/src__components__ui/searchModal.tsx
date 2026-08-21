"use client";

import { useEffect, useRef, useState } from "react";
import { useMapStore } from "@/store/mapStore";
import type { Category, FacilityWithRelations } from "@/types";

const KEYBOARD_LETTERS: string[][] = [
  ["Q","W","E","R","T","Y","U","I","O","P"],
  ["A","S","D","F","G","H","J","K","L"],
  ["Z","X","C","V","B","N","M"],
];

const KEYBOARD_NUMBERS: string[][] = [
  ["1","2","3","4","5","6","7","8","9","0"],
  ["-","_","@","#","&","(",")","/"],
  [".","!","?","'",'"',",",";"],
];

// =============================================================================
// HELPER — render icon sesuai format (SVG inline, URL/path gambar, emoji, teks)
// =============================================================================

function isImageSrc(icon: string): boolean {
  if (
    icon.startsWith("data:image/") ||
    icon.startsWith("http://") ||
    icon.startsWith("https://") ||
    icon.startsWith("blob:") ||
    icon.startsWith("/")
  ) return true;
  if (/\.(png|jpe?g|gif|webp|avif|svg|ico)(\?.*)?$/i.test(icon)) return true;
  return false;
}

function CategoryIcon({
  icon,
  name,
  size = "md",
}: {
  icon: string | null;
  name: string;
  size?: "md" | "lg";
}) {
  const imgCls   = size === "lg" ? "w-8 h-8 object-contain" : "w-6 h-6 object-contain";
  const svgCls   = size === "lg" ? "w-8 h-8" : "w-6 h-6";
  const emojiCls = size === "lg" ? "text-3xl leading-none" : "text-2xl leading-none";

  if (!icon) {
    return (
      <span className="text-white text-xs font-bold text-center leading-tight px-1">
        {name.slice(0, 3).toUpperCase()}
      </span>
    );
  }

  if (icon.trimStart().startsWith("<svg")) {
    return (
      <div
        className={`flex items-center justify-center ${svgCls} [&>svg]:w-full [&>svg]:h-full [&>svg]:fill-white`}
        dangerouslySetInnerHTML={{ __html: icon }}
      />
    );
  }

  if (isImageSrc(icon)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={icon} alt={name} className={imgCls} />;
  }

  return <span className={emojiCls}>{icon}</span>;
}


export default function SearchModal() {
  const isSearchOpen = useMapStore((s) => s.isSearchOpen);
  const setIsSearchOpen = useMapStore((s) => s.setIsSearchOpen);
  const setSelectedFacility = useMapStore((s) => s.setSelectedFacility);
  const activeTerminal = useMapStore((s) => s.activeTerminal);
  // activeFloor dihapus dari store — tidak dipakai lagi

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FacilityWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);

  const [keyboardMode, setKeyboardMode] = useState<"letters" | "numbers">("letters");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        const json = await res.json();
        if (json.success) setCategories(json.data as Category[]);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (isSearchOpen) {
      setQuery("");
      setActiveCategoryId(null);
      setKeyboardMode("letters");
    }
  }, [isSearchOpen]);

  useEffect(() => {
    if (!isSearchOpen) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          terminal: activeTerminal,
          // floor parameter dihapus — activeFloor tidak ada di store
        });
        if (query.length > 0) params.set("search", query);
        if (activeCategoryId !== null) params.set("category", String(activeCategoryId));

        const res = await fetch(`/api/facilities?${params.toString()}`);
        const json = await res.json();
        if (json.success) setResults(json.data as FacilityWithRelations[]);
      } catch (err) {
        console.error("Failed to fetch facilities:", err);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, activeCategoryId, activeTerminal, isSearchOpen]);

  const handleKeyPress = (letter: string) => setQuery((prev) => prev + letter);
  const handleBackspace = () => setQuery((prev) => prev.slice(0, -1));
  const handleSpace = () => setQuery((prev) => prev + " ");
  const handleClose = () => setIsSearchOpen(false);
  const handleClearQuery = () => setQuery("");

  const handleSelectFacility = (facility: FacilityWithRelations) => {
    // Tutup modal dulu (setIsSearchOpen(false) TIDAK mereset selectedFacility),
    // baru set facility — POIDetailPopup muncul karena selectedFacility !== null.
    setIsSearchOpen(false);
    setSelectedFacility(facility);
  };

  if (!isSearchOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Cari fasilitas"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />

      {/* Wrapper modal + tombol close */}
      <div className="relative z-10 flex items-start gap-3">

        {/* ── Modal utama ── */}
        <div
          className={[
            "w-[clamp(480px,80vw,660px)]",
            "bg-[#dce9f5] rounded-2xl overflow-hidden",
            "flex flex-col",
            "shadow-[0_24px_60px_-8px_rgba(0,0,0,0.45),0_8px_20px_-4px_rgba(0,0,0,0.25)]",
            "ring-1 ring-white/50",
            "animate-in fade-in zoom-in-95 duration-150",
          ].join(" ")}
        >
          {/* ── Baris kategori ── */}
          <div className="flex gap-3 overflow-x-auto px-4 pt-4 pb-3 [&::-webkit-scrollbar]:hidden">
            {/* Semua */}
            <button
              onClick={() => setActiveCategoryId(null)}
              aria-pressed={activeCategoryId === null}
              className="shrink-0 flex flex-col items-center gap-1 transition-transform duration-150 active:scale-95"
            >
              <div
                className={[
                  "w-14 h-14 rounded-2xl flex items-center justify-center text-3xl",
                  "shadow-[0_4px_10px_rgba(0,0,0,0.18)]",
                  "transition-all duration-150",
                  activeCategoryId === null
                    ? "bg-sky-500 ring-2 ring-sky-300 ring-offset-2 ring-offset-[#dce9f5] scale-110"
                    : "bg-sky-400 hover:scale-105",
                ].join(" ")}
              >
                🗺️
              </div>
              <span className="text-[11px] text-gray-600 font-medium leading-tight text-center w-14 truncate">
                Semua
              </span>
            </button>

            {categories.map((category) => {
              const isActive = activeCategoryId === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategoryId(isActive ? null : category.id)}
                  aria-pressed={isActive}
                  className="shrink-0 flex flex-col items-center gap-1 transition-transform duration-150 active:scale-95"
                >
                  <div
                    className={[
                      "w-14 h-14 rounded-2xl flex items-center justify-center text-3xl",
                      "shadow-[0_4px_10px_rgba(0,0,0,0.18)]",
                      "transition-all duration-150",
                      isActive
                        ? "ring-2 ring-white ring-offset-2 ring-offset-[#dce9f5] scale-110"
                        : "hover:scale-105",
                    ].join(" ")}
                    style={{ backgroundColor: category.color }}
                  >
                    <CategoryIcon icon={category.icon} name={category.name} size="lg" />
                  </div>
                  <span className="text-[11px] text-gray-600 font-medium leading-tight text-center w-14 line-clamp-2">
                    {category.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── Grid hasil ── */}
          <div
            className={[
              "mx-3 mb-2 rounded-xl overflow-hidden",
              "bg-[#e8f1f9]",
              "shadow-[inset_0_2px_8px_rgba(0,0,0,0.12),inset_0_1px_3px_rgba(0,0,0,0.08)]",
              "ring-1 ring-black/5",
            ].join(" ")}
          >
            <div className="overflow-y-auto h-55 p-2 pr-1 [&::-webkit-scrollbar]:hidden">
              {/* Loading skeleton */}
              {isLoading && (
                <div className="grid grid-cols-5 gap-1.5">
                  {Array.from({ length: 15 }).map((_, i) => (
                    <div key={i} className="h-10 rounded-lg bg-white/70 animate-pulse" />
                  ))}
                </div>
              )}

              {/* Hasil */}
              {!isLoading && results.length > 0 && (
                <div className="grid grid-cols-5 gap-1.25">
                  {results.map((facility) => (
                    <button
                      key={facility.id}
                      onClick={() => handleSelectFacility(facility)}
                      className={[
                        "flex flex-col justify-center items-start text-left",
                        "h-10 px-2.5 rounded-lg",
                        "bg-white hover:bg-sky-50 active:bg-sky-100",
                        "shadow-[0_1px_3px_rgba(0,0,0,0.07)]",
                        "hover:shadow-[0_3px_8px_rgba(0,0,0,0.11)]",
                        "active:shadow-sm",
                        "transition-all duration-150",
                        "border-l-[3px] border border-white/60",
                        "overflow-hidden",
                      ].join(" ")}
                      style={{ borderLeftColor: facility.category?.color ?? "#38bdf8" }}
                    >
                      <span className="text-gray-800 text-[9.5px] font-semibold leading-tight line-clamp-1 w-full tracking-tight">
                        {facility.name}
                      </span>
                      {facility.description && (
                        <span className="text-gray-400 text-[8px] leading-tight line-clamp-1 w-full mt-0.5">
                          {facility.description}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Tidak ditemukan */}
              {!isLoading && results.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-2 h-full text-gray-400">
                  <span className="text-3xl" aria-hidden="true">🔍</span>
                  <p className="text-sm text-center">Fasilitas tidak ditemukan</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Search bar ── */}
          <div className="flex justify-center px-4 mb-3">
            <div
              className={[
                "flex items-center gap-2 px-4 py-2.5 w-[55%]",
                "bg-white rounded-full",
                "shadow-[0_2px_8px_rgba(0,0,0,0.12),inset_0_1px_3px_rgba(0,0,0,0.06)]",
                "ring-1 ring-black/5",
              ].join(" ")}
            >
              <svg
                className="shrink-0 w-4 h-4 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                />
              </svg>
              <span className="flex-1 text-[clamp(13px,1.5vw,16px)] text-gray-700 min-w-0 truncate">
                {query || <span className="text-gray-400">Search</span>}
              </span>
              {query.length > 0 && (
                <button
                  onClick={handleClearQuery}
                  aria-label="Hapus pencarian"
                  className="shrink-0 w-6 h-6 rounded-full bg-gray-400 hover:bg-gray-500 flex items-center justify-center shadow-sm transition-colors duration-150"
                >
                  <svg
                    className="w-3.5 h-3.5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={3}
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* ── Virtual keyboard ── */}
          <div className="bg-[#b8cfe0] px-3 pb-4 pt-3 flex flex-col gap-2 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
            {/* Letter / Number rows */}
            {(keyboardMode === "letters" ? KEYBOARD_LETTERS : KEYBOARD_NUMBERS).map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-1.5 justify-center">
                {/* Middle row of letters gets auto side padding to center the 9-key row */}
                {row.map((key) => (
                  <button
                    key={key}
                    onClick={() => handleKeyPress(key)}
                    aria-label={`Ketik ${key}`}
                    className={[
                      "flex-1 min-h-11 rounded-lg",
                      "bg-white hover:bg-sky-50",
                      "text-gray-800 font-bold",
                      "text-[clamp(12px,1.4vw,16px)]",
                      "shadow-[0_3px_0_#94a3b8,0_1px_3px_rgba(0,0,0,0.15)]",
                      "border border-gray-200/80",
                      "active:translate-y-0.5 active:shadow-[0_1px_0_#94a3b8]",
                      "transition-all duration-75",
                    ].join(" ")}
                  >
                    {key}
                  </button>
                ))}
              </div>
            ))}

            {/* Bottom action row: [123/?] [SPACE] [⌫] */}
            <div className="flex gap-1.5 justify-center">
              {/* Mode toggle */}
              <button
                onClick={() => setKeyboardMode((m) => m === "letters" ? "numbers" : "letters")}
                aria-label={keyboardMode === "letters" ? "Beralih ke angka" : "Beralih ke huruf"}
                className={[
                  "min-h-11 px-3 rounded-lg",
                  "bg-[#9ab4cc] hover:bg-[#8aa4bc]",
                  "text-gray-800 font-bold text-[11px]",
                  "shadow-[0_3px_0_#7a98b0,0_1px_3px_rgba(0,0,0,0.15)]",
                  "border border-gray-300/60",
                  "active:translate-y-0.5 active:shadow-[0_1px_0_#7a98b0]",
                  "transition-all duration-75 whitespace-nowrap",
                ].join(" ")}
              >
                {keyboardMode === "letters" ? "123" : "ABC"}
              </button>

              {/* Space */}
              <button
                onClick={handleSpace}
                aria-label="Spasi"
                className={[
                  "flex-1 min-h-11 rounded-lg",
                  "bg-white hover:bg-sky-50",
                  "text-gray-400 font-medium text-[12px]",
                  "shadow-[0_3px_0_#94a3b8,0_1px_3px_rgba(0,0,0,0.15)]",
                  "border border-gray-200/80",
                  "active:translate-y-0.5 active:shadow-[0_1px_0_#94a3b8]",
                  "transition-all duration-75",
                ].join(" ")}
              >
                space
              </button>

              {/* Backspace */}
              <button
                onClick={handleBackspace}
                aria-label="Hapus karakter"
                className={[
                  "min-h-11 px-4 rounded-lg",
                  "bg-[#9ab4cc] hover:bg-[#8aa4bc]",
                  "text-gray-700",
                  "shadow-[0_3px_0_#7a98b0,0_1px_3px_rgba(0,0,0,0.15)]",
                  "border border-gray-300/60",
                  "active:translate-y-0.5 active:shadow-[0_1px_0_#7a98b0]",
                  "transition-all duration-75 flex items-center justify-center",
                ].join(" ")}
              >
                <svg
                  className="w-5 h-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6H8.5a2.5 2.5 0 0 0-2.5 2.5v7a2.5 2.5 0 0 0 2.5 2.5H12l7-6-7-6Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="m15 10-2 2m0 0-2 2m2-2 2 2m-2-2-2-2" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* ── Tombol Close — di luar modal ── */}
        <button
          onClick={handleClose}
          aria-label="Tutup pencarian"
          className={[
            "flex flex-col items-center justify-center gap-1",
            "w-16 min-h-16 rounded-2xl mt-1",
            "bg-white hover:bg-gray-50 text-gray-700",
            "shadow-[0_8px_24px_rgba(0,0,0,0.20),0_2px_6px_rgba(0,0,0,0.12)]",
            "ring-1 ring-white/60",
            "transition-all duration-150 active:scale-95",
            "text-[12px] font-semibold",
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
          Close
        </button>

      </div>
    </div>
  );
}