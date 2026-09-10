"use client";

import {
  Building2,
  ChevronRight,
  Compass,
  MapPin,
  Search,
  ShoppingBag,
  Utensils,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { spaces } from "@/data/demo-wayfinding";
import { getCategoryLabel, getSpaceLabel } from "@/lib/wayfinding-language";
import { useMapStore } from "@/store/mapStore";
import type { MapSpace, TerminalCode } from "@/types";
import { facilityShortcuts, findFacilities } from "@/lib/facility-search";

const resultCategoryIcons: Record<string, LucideIcon> = {
  entrance: MapPin,
  office: Building2,
  food: Utensils,
  shop: ShoppingBag,
  prayer: Compass,
};

export function SearchOverlayModal() {
  const store = useMapStore();
  const lang = store.lang;

  if (!store.isSearchOpen) return null;

  const quickCategories = [
    { id: "all", label: lang === "ID" ? "Semua" : "All", icon: null },
    { id: "office", label: lang === "ID" ? "Kantor & Layanan" : "Services", icon: Building2 },
    { id: "food", label: lang === "ID" ? "Kuliner & Resto" : "Food & Beverage", icon: Utensils },
    { id: "shop", label: lang === "ID" ? "Toko & Retail" : "Shops", icon: ShoppingBag },
    ...facilityShortcuts.filter((item) => item.id !== "food").map((item) => ({ id: item.id, label: item[lang], icon: null })),
  ];

  const visibleSpaces = findFacilities(spaces, store.terminal, store.category, store.query);

  const handleSelectSpace = (space: MapSpace) => {
    if (space.terminal !== store.terminal) store.setTerminal(space.terminal);
    store.clearRoute();
    store.setFloorId(space.floorId);
    store.selectSpace(space.id);
    store.setIsSearchOpen(false);
  };

  return (
    <div className="modal-overlay search-modal-backdrop" onClick={() => store.setIsSearchOpen(false)}>
      <div className="search-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="search-modal-header">
          <div className="search-modal-title-group">
            <div>
              <span className="search-modal-eyebrow">
                {lang === "ID" ? "Direktori terminal" : "Terminal directory"}
              </span>
              <h3>{lang === "ID" ? "Cari lokasi" : "Find a location"}</h3>
              <p>{lang === "ID" ? "Gate, tenant, layanan, dan fasilitas Bandara Juanda." : "Gates, tenants, services, and facilities at Juanda Airport."}</p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={() => store.setIsSearchOpen(false)}
            aria-label={lang === "ID" ? "Tutup pencarian" : "Close search"}
          >
            <X size={18} />
          </button>
        </div>

        {/* Top Controls Area */}
        <div className="search-modal-top-controls">
          {/* Search Bar Input */}
          <div className="search-modal-input-wrapper">
            <Search size={20} aria-hidden="true" />
            <input
              type="text"
              className="search-modal-input"
              value={store.query}
              onChange={(e) => store.setQuery(e.target.value)}
              placeholder={lang === "ID" ? "Ketik nama lokasi, gate, musala..." : "Type location, gate, prayer room..."}
              autoFocus
            />
            {store.query && (
              <button
                type="button"
                className="search-input-clear-btn"
                onClick={() => store.setQuery("")}
                aria-label={lang === "ID" ? "Bersihkan pencarian" : "Clear search"}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Quick Categories */}
          <div className="search-modal-cats" aria-label={lang === "ID" ? "Kategori pencarian" : "Search categories"}>
            {quickCategories.map((cat) => {
              const Icon = cat.icon;
              const isActive = store.category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  className="search-cat-pill"
                  data-category={cat.id}
                  data-active={isActive}
                  aria-pressed={isActive}
                  onClick={() => { store.setCategory(cat.id); store.setQuery(""); }}
                >
                  {Icon && (
                    <span className="search-cat-icon" aria-hidden="true">
                      <Icon size={15} />
                    </span>
                  )}
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Results Header */}
          <div className="search-modal-results-info">
            <span>
              {lang === "ID"
                ? `${visibleSpaces.length} lokasi ditemukan`
                : `${visibleSpaces.length} locations found`}
            </span>
            <label className="search-results-floor">
              <span className="sr-only">{lang === "ID" ? "Terminal pencarian" : "Search terminal"}</span>
              <select aria-label={lang === "ID" ? "Terminal pencarian" : "Search terminal"} value={store.terminal} onChange={(event) => store.setTerminal(event.target.value as TerminalCode)} style={{ background: "#243b4d", color: "white", border: "1px solid #547084", borderRadius: 6, padding: 8 }}>
                <option value="T1">Terminal 1</option><option value="T2">Terminal 2</option>
              </select>
              {lang === "ID" ? " - Semua lantai" : " - All floors"}
            </label>
          </div>
        </div>

        {/* Scrollable Results List */}
        <div className="search-modal-results-area">
          {visibleSpaces.length > 0 ? (
            visibleSpaces.map((space) => {
              const categoryLabel = getCategoryLabel(space.category, lang);
              const ResultIcon = resultCategoryIcons[space.category] ?? MapPin;
              return (
                <button
                  type="button"
                  key={space.id}
                  className="search-result-item"
                  onClick={() => handleSelectSpace(space)}
                >
                  <div className="search-result-left">
                    <div className="search-result-icon" data-category={space.category}>
                      <ResultIcon size={18} />
                    </div>
                    <div className="search-result-copy">
                      <div className="search-result-heading">
                        <span className="search-result-name">{getSpaceLabel(space, lang)}</span>
                        <span className="search-result-code" aria-label={`${lang === "ID" ? "Kode lokasi" : "Location code"}: ${space.code}`}>
                          {space.code}
                        </span>
                      </div>
                      <div className="search-result-meta">
                        {space.terminal} • {space.floorId.endsWith("L1") ? (lang === "ID" ? "Lantai 1" : "Floor 1") : (lang === "ID" ? "Lantai 2" : "Floor 2")} • {categoryLabel}
                      </div>
                    </div>
                  </div>

                  <span className="search-result-btn">
                    <span>{lang === "ID" ? "Pilih" : "Select"}</span>
                    <ChevronRight size={14} />
                  </span>
                </button>
              );
            })
          ) : (
            <div style={{ textAlign: "center", padding: "32px 16px", color: "rgba(255,255,255,0.6)" }}>
              <p style={{ margin: 0, fontWeight: 600, fontSize: "15px", color: "#fff" }}>
                {lang === "ID" ? "Tidak ada lokasi yang cocok" : "No matching locations found"}
              </p>
              <p style={{ margin: "6px 0 0", fontSize: "13px" }}>
                {lang === "ID"
                  ? "Coba cari dengan kata kunci lain seperti Gate, Musala, ATM, atau Resto."
                  : "Try searching with keywords like Gate, Prayer, ATM, or Restaurant."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
