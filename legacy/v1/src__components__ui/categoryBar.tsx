"use client";

import { useEffect, useState } from "react";
import { useMapStore } from "@/store/mapStore";
import type { Category } from "@/types";


// =============================================================================
// HELPER — render icon sesuai tipe konten
// =============================================================================

/** Deteksi apakah string icon adalah URL/path gambar */
function isImageSrc(icon: string): boolean {
  // Protokol umum & path absolut
  if (
    icon.startsWith("data:image/") ||
    icon.startsWith("http://") ||
    icon.startsWith("https://") ||
    icon.startsWith("blob:") ||
    icon.startsWith("/")
  ) return true;

  // Path relatif dengan ekstensi gambar
  if (/\.(png|jpe?g|gif|webp|avif|svg|ico)(\?.*)?$/i.test(icon)) return true;

  return false;
}

function CategoryIcon({ icon, name }: { icon: string | null; name: string }) {
  if (!icon) {
    return (
      <span className="text-white text-xs font-bold text-center leading-tight px-1">
        {name.slice(0, 3).toUpperCase()}
      </span>
    );
  }

  // SVG markup inline
  if (icon.trimStart().startsWith("<svg")) {
    return (
      <div
        className="w-7 h-7 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:fill-white"
        dangerouslySetInnerHTML={{ __html: icon }}
      />
    );
  }

  // URL atau path gambar (data URI, http/https, blob, path relatif/absolut)
  if (isImageSrc(icon)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={icon} alt={name} className="w-7 h-7 object-contain" />
    );
  }

  // Emoji atau teks pendek
  return (
    <span className="text-2xl leading-none">{icon}</span>
  );
}

export default function CategoryBar() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const activeCategories = useMapStore((s) => s.activeCategories);
  const toggleCategory = useMapStore((s) => s.toggleCategory);
  const clearCategories = useMapStore((s) => s.clearCategories);
  const setIsSearchOpen = useMapStore((s) => s.setIsSearchOpen);
  const activeTerminal   = useMapStore((s) => s.activeTerminal);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        const json = await res.json();
        if (json.success) setCategories(json.data as Category[]);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategories();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-wrap justify-center gap-3 px-4 py-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-2xl bg-gray-200 animate-pulse" />
            <div className="w-10 h-2.5 rounded bg-gray-200 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  const visibleCategories = categories.filter(
    (c) => c.terminals.length === 0 || c.terminals.includes(activeTerminal)
  );

  const allItems = [
    { type: "search" as const },
    { type: "all" as const },
    ...visibleCategories.map((c) => ({ type: "category" as const, data: c })),
  ];

  const half = Math.ceil(allItems.length / 2);
  const rowOne = allItems.slice(0, half);
  const rowTwo = allItems.slice(half);

  const renderAllButton = () => {
    const isAllActive = activeCategories.length === 0;
    return (
      <button
        key="all"
        onClick={clearCategories}
        aria-label="Tampilkan semua kategori"
        aria-pressed={isAllActive}
        className="flex flex-col items-center gap-1 transition-all duration-150 active:scale-95"
      >
        <div
          className={[
            "w-12 h-12 rounded-2xl flex items-center justify-center",
            "transition-all duration-150 hover:scale-105",
            isAllActive
              ? "bg-gray-500 shadow-[0_3px_10px_rgba(0,0,0,0.22)] ring-2 ring-white ring-offset-1 ring-offset-gray-100 scale-110"
              : "bg-gray-300 shadow-[0_2px_6px_rgba(0,0,0,0.14)]",
          ].join(" ")}
        >
          <svg
            className="w-6 h-6 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth={2} />
            <rect x="14" y="3" width="7" height="7" rx="1" strokeWidth={2} />
            <rect x="3" y="14" width="7" height="7" rx="1" strokeWidth={2} />
            <rect x="14" y="14" width="7" height="7" rx="1" strokeWidth={2} />
          </svg>
        </div>
        <span
          className={[
            "text-[10px] font-medium leading-tight text-center w-12",
            isAllActive ? "text-gray-800" : "text-gray-400",
          ].join(" ")}
        >
          Semua
        </span>
      </button>
    );
  };

  const renderSearchButton = () => (
    <button
      key="search"
      onClick={() => setIsSearchOpen(true)}
      aria-label="Buka pencarian fasilitas"
      className="flex flex-col items-center gap-1 transition-all duration-150 active:scale-95"
    >
      <div
        className={[
          "w-12 h-12 rounded-2xl flex items-center justify-center",
          "bg-orange-500",
          "shadow-[0_3px_8px_rgba(249,115,22,0.40)]",
          "hover:scale-105 transition-transform duration-150",
        ].join(" ")}
      >
        <svg
          className="w-6 h-6 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
          />
        </svg>
      </div>
      <span className="text-[10px] text-gray-500 font-medium leading-tight text-center">
        Search
      </span>
    </button>
  );

  const renderCategoryButton = (category: Category) => {
    const isActive = activeCategories.includes(category.id);
    return (
      <button
        key={category.id}
        onClick={() => toggleCategory(category.id)}
        aria-label={`Filter kategori ${category.name}`}
        aria-pressed={isActive}
        className="flex flex-col items-center gap-1 transition-all duration-150 active:scale-95"
      >
        <div
          className={[
            "w-12 h-12 rounded-2xl flex items-center justify-center text-2xl",
            "transition-all duration-150 hover:scale-105",
            isActive
              ? "shadow-[0_3px_10px_rgba(0,0,0,0.22)] ring-2 ring-white ring-offset-1 ring-offset-gray-100 scale-110"
              : "shadow-[0_2px_6px_rgba(0,0,0,0.14)]",
          ].join(" ")}
          style={{ backgroundColor: category.color }}
        >
          <CategoryIcon icon={category.icon} name={category.name} />
        </div>
        <span
          className={[
            "text-[10px] font-medium leading-tight text-center w-12 line-clamp-1",
            isActive ? "text-gray-800" : "text-gray-500",
          ].join(" ")}
        >
          {category.name}
        </span>
      </button>
    );
  };

  return (
    <div className="flex flex-col items-center gap-2 px-4 py-2">
      {/* Baris 1 */}
      <div className="flex gap-3 justify-center">
        {rowOne.map((item) =>
          item.type === "search"
            ? renderSearchButton()
            : item.type === "all"
            ? renderAllButton()
            : renderCategoryButton(item.data)
        )}
      </div>

      {/* Baris 2 */}
      {rowTwo.length > 0 && ( 
        <div className="flex gap-3 justify-center">
          {rowTwo.map((item) =>
            item.type === "search"
              ? renderSearchButton()
              : item.type === "all"
              ? renderAllButton()
              : renderCategoryButton(item.data)
          )}
        </div>
      )}
    </div>
  );
}