"use client";

import {
  Building2,
  ChevronRight,
  Compass,
  Navigation,
  Search,
  ShoppingBag,
  Sparkles,
  Utensils,
  X,
} from "lucide-react";
import { categories, routeNodes, spaces } from "@/data/demo-wayfinding";
import { useMapStore } from "@/store/mapStore";
import type { MapSpace } from "@/types";

export function SearchOverlayModal() {
  const store = useMapStore();
  const lang = store.lang;

  if (!store.isSearchOpen) return null;

  const quickCategories = [
    { id: "all", label: lang === "ID" ? "Semua" : "All", icon: Sparkles },
    { id: "office", label: lang === "ID" ? "Kantor & Layanan" : "Services", icon: Building2 },
    { id: "food", label: lang === "ID" ? "Kuliner & Resto" : "Food & Beverage", icon: Utensils },
    { id: "shop", label: lang === "ID" ? "Toko & Retail" : "Shops", icon: ShoppingBag },
    { id: "prayer", label: lang === "ID" ? "Mushola" : "Prayer Room", icon: Compass },
  ];

  const visibleSpaces = spaces.filter((space) => {
    const matchesCategory = store.category === "all" || space.category === store.category;
    const haystack = `${space.label} ${space.code} ${space.tenant?.name ?? ""}`.toLocaleLowerCase("id-ID");
    const queryMatch = !store.query || haystack.includes(store.query.toLocaleLowerCase("id-ID"));
    return matchesCategory && queryMatch;
  });

  const handleSelectSpace = (space: MapSpace) => {
    store.selectSpace(space.id);
    if (space.floorId !== store.floorId) store.setFloorId(space.floorId);
    if (space.terminal !== store.terminal) store.setTerminal(space.terminal);

    // Pan map to space anchor node
    const node = routeNodes.find((n) => n.id === space.anchorNodeId);
    if (node) {
      window.dispatchEvent(
        new CustomEvent("wayfinding:pan-to", {
          detail: { x: node.x, y: node.y, scale: 2.2 },
        })
      );
    }

    // Close search overlay
    store.setIsSearchOpen(false);
  };

  return (
    <div className="modal-overlay search-modal-backdrop" onClick={() => store.setIsSearchOpen(false)}>
      <div className="search-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="search-modal-header">
          <div className="search-modal-title-group">
            <div className="search-modal-icon-badge">
              <Search size={22} />
            </div>
            <div>
              <h3>{lang === "ID" ? "Pencarian Lokasi Bandara" : "Airport Location Search"}</h3>
              <p>{lang === "ID" ? "Cari gate, toko, musala, ATM, atau layanan bandara" : "Search gates, dining, prayer rooms, or airport services"}</p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={() => store.setIsSearchOpen(false)}
            aria-label="Tutup pencarian"
          >
            <X size={18} />
          </button>
        </div>

        {/* Top Controls Area */}
        <div className="search-modal-top-controls">
          {/* Search Bar Input */}
          <div className="search-modal-input-wrapper">
            <Search size={20} />
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
                aria-label="Bersihkan pencarian"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Quick Categories */}
          <div className="search-modal-cats" aria-label="Kategori pencarian">
            {quickCategories.map((cat) => {
              const Icon = cat.icon;
              const isActive = store.category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  className="search-cat-pill"
                  data-active={isActive}
                  onClick={() => store.setCategory(cat.id)}
                >
                  <Icon size={14} style={{ display: "inline-block", marginRight: 6, verticalAlign: "middle" }} />
                  {cat.label}
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
            <span style={{ background: "rgba(255, 255, 255, 0.08)", padding: "3px 10px", borderRadius: "999px", fontSize: "12px", color: "rgba(255, 255, 255, 0.8)", fontWeight: 600 }}>
              {store.terminal} • {store.floorId.endsWith("L1") ? (lang === "ID" ? "Lantai 1" : "Floor 1") : (lang === "ID" ? "Lantai 2" : "Floor 2")}
            </span>
          </div>
        </div>

        {/* Scrollable Results List */}
        <div className="search-modal-results-area">
          {visibleSpaces.length > 0 ? (
            visibleSpaces.map((space) => {
              const categoryObj = categories.find((c) => c.id === space.category);
              const spaceColor = space.mapColor || "#38bdf8";
              return (
                <div
                  key={space.id}
                  className="search-result-item"
                  onClick={() => handleSelectSpace(space)}
                >
                  <div className="search-result-left">
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "12px",
                        background: `${spaceColor}22`,
                        border: `1px solid ${spaceColor}55`,
                        display: "grid",
                        placeItems: "center",
                        color: spaceColor,
                        flexShrink: 0,
                      }}
                    >
                      <Navigation size={18} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                        <span className="search-result-name">{space.tenant?.name ?? space.label}</span>
                        <span className="search-result-code">{space.code}</span>
                      </div>
                      <div className="search-result-meta">
                        {space.terminal} • {space.floorId.endsWith("L1") ? (lang === "ID" ? "Lantai 1" : "Floor 1") : (lang === "ID" ? "Lantai 2" : "Floor 2")} • {categoryObj?.label || space.category}
                      </div>
                    </div>
                  </div>

                  <button type="button" className="search-result-btn">
                    <span>{lang === "ID" ? "Pilih" : "Select"}</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
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
