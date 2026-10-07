"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, Compass, MapPin, Search, X } from "lucide-react";
import { ExploreSection } from "./ExploreSection";
import { WayfindingFullTutorialSection } from "./WayfindingFullTutorialSection";
import { WayfindingVideoTutorial } from "./WayfindingVideoTutorial";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { useMapStore } from "@/store/mapStore";

export function WayfindingShell() {
  const router = useRouter();
  const facilityRef = useRef<HTMLElement>(null);
  const [query, setQuery] = useState("");
  const lang = useMapStore((state) => state.lang);
  const openMap = () => router.push(query.trim() ? `/map?q=${encodeURIComponent(query.trim())}` : "/map");

  return (
    <div className="wayfinding-page">
      <SiteHeader />
      <main className="wayfinding-shell">
        <section className="roamora-hero" aria-labelledby="home-title">
          <div className="roamora-hero-backdrop" />
          <div className="roamora-hero-content">
            <div className="roamora-hero-copy">
              <h1 id="home-title" className="roamora-hero-title">
                Explore <span className="roamora-blue-text">Juanda Airport</span>
              </h1>
              <p className="roamora-hero-subtitle">
                {lang === "ID"
                  ? "Jelajahi Terminal 1 lantai dasar dalam 3D, pilih titik awal dan tujuan, lalu lihat jalurnya."
                  : "Explore Terminal 1 ground floor in 3D, choose your start and destination, then see the route."}
              </p>
            </div>
            <div className="roamora-hero-actions">
              <button type="button" className="roamora-cta-btn" onClick={() => facilityRef.current?.scrollIntoView({ behavior: "smooth" })}>
                <span>{lang === "ID" ? "Jelajahi Sekarang" : "Explore Now"}</span>
                <span className="roamora-cta-arrow"><ArrowRight size={15} aria-hidden="true" /></span>
              </button>
            </div>
            <div className="roamora-floating-widget" aria-label={lang === "ID" ? "Pencarian dan navigasi peta" : "Map search and navigation"}>
              <div className="roamora-widget-col">
                <div className="roamora-col-icon"><MapPin size={20} aria-hidden="true" /></div>
                <div className="roamora-col-copy">
                  <span className="roamora-col-label">{lang === "ID" ? "Titik awal" : "Start point"}</span>
                  <strong className="roamora-col-val">{lang === "ID" ? "Pilih di peta 3D" : "Choose on 3D map"}</strong>
                </div>
              </div>
              <span className="roamora-widget-divider" />
              <div className="roamora-widget-col search-col">
                <div className="roamora-col-icon"><Search size={20} aria-hidden="true" /></div>
                <div className="roamora-col-copy">
                  <label className="roamora-col-label" htmlFor="home-map-search">{lang === "ID" ? "Cari building" : "Find a building"}</label>
                  <input id="home-map-search" className="roamora-widget-input" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") openMap(); }} placeholder={lang === "ID" ? "Contoh: T1-GF-01" : "Example: T1-GF-01"} />
                </div>
                {query && <button type="button" className="roamora-clear-btn" onClick={() => setQuery("")} aria-label={lang === "ID" ? "Hapus pencarian" : "Clear search"}><X size={15} /></button>}
              </div>
              <span className="roamora-widget-divider" />
              <div className="roamora-widget-col">
                <div className="roamora-col-icon"><Building2 size={20} aria-hidden="true" /></div>
                <div className="roamora-col-copy">
                  <span className="roamora-col-label">{lang === "ID" ? "Cakupan peta" : "Map coverage"}</span>
                  <strong className="roamora-col-val">{lang === "ID" ? "Terminal 1 · Lantai Dasar" : "Terminal 1 · Ground Floor"}</strong>
                </div>
              </div>
              <span className="roamora-widget-divider" />
              <div className="roamora-widget-col">
                <div className="roamora-col-icon"><Compass size={20} aria-hidden="true" /></div>
                <div className="roamora-col-copy">
                  <span className="roamora-col-label">{lang === "ID" ? "Navigasi" : "Navigation"}</span>
                  <strong className="roamora-col-val">{lang === "ID" ? "Pilih tujuan di peta" : "Choose destination on map"}</strong>
                </div>
              </div>
              <button type="button" className="roamora-search-submit-btn" onClick={openMap}>
                <span>{lang === "ID" ? "Buka Peta" : "Open Map"}</span><Search size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>
        <section className="explore-section" ref={facilityRef}>
          <ExploreSection />
          <div className="section-overlap-stack">
            <WayfindingFullTutorialSection />
            <WayfindingVideoTutorial />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
