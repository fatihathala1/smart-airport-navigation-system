"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import {
  ArrowRight,
  Building2,
  Compass,
  MapPin,
  QrCode,
  Search,
  X,
} from "lucide-react";
import { floors, qrLocations, spaces } from "@/data/demo-wayfinding";
import { mapSearchHref, poiCategoryIds } from "@/lib/facility-search";
import {
  getCategoryLabel,
  getQrLocationLabel,
  getSpaceLabel,
} from "@/lib/wayfinding-language";
import { useMapStore } from "@/store/mapStore";
import type { TerminalCode } from "@/types";
import { FacilityShortcuts } from "./FacilityShortcuts";
import { WayfindingFullTutorialSection } from "./WayfindingFullTutorialSection";
import { WayfindingTutorialModal } from "./WayfindingTutorialModal";
import { WayfindingVideoTutorial } from "./WayfindingVideoTutorial";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

const tDict = {
  ID: {
    simModalTitle: "Simulasi QR Code Bandara",
    simModalDesc: "Pilih titik QR standee untuk menetapkan terminal, lantai, dan titik awal navigasi.",
  },
  EN: {
    simModalTitle: "Try an Airport QR Code",
    simModalDesc: "Choose a QR stand to set your terminal, floor, and starting point.",
  },
};

export function WayfindingShell() {
  const pageRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showQrModal, setShowQrModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const store = useMapStore();
  const lang = store.lang;
  const t = tDict[lang];

  useGSAP(
    () => {
      const scope = pageRef.current;
      if (!scope) return;

      const allSections = gsap.utils.toArray<HTMLElement>("[data-scroll-reveal]", scope);
      const heroSection = scope.querySelector<HTMLElement>(".roamora-hero");
      const sections = allSections.filter((section) => section !== heroSection);
      const liftWindow = scope.querySelector<HTMLElement>("[data-lift-window]");
      const media = gsap.matchMedia();

      media.add(
        {
          motionAllowed: "(prefers-reduced-motion: no-preference)",
          reduceMotion: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          const { reduceMotion } = context.conditions as { reduceMotion: boolean };

          if (reduceMotion) {
            allSections.forEach((section) => {
              const children = section.querySelectorAll<HTMLElement>("[data-reveal-child]");
              gsap.set(section, { clearProps: "all" });
              if (children.length) gsap.set(children, { clearProps: "all" });
            });
            if (liftWindow) gsap.set(liftWindow, { clearProps: "all" });
            return;
          }

          // The first viewport plays as soon as Home mounts, without waiting for
          // the user to cross a ScrollTrigger boundary.
          if (heroSection) {
            const heroChildren = Array.from(
              heroSection.querySelectorAll<HTMLElement>("[data-reveal-child]")
            );
            const intro = gsap.timeline();

            intro.fromTo(
              heroSection,
              {
                autoAlpha: 0,
                scale: 1.012,
                transformOrigin: "center center",
                willChange: "transform, opacity",
              },
              {
                autoAlpha: 1,
                scale: 1,
                duration: 1.6,
                ease: "power2.out",
                clearProps: "transform,opacity,visibility,willChange",
              }
            );

            if (heroChildren.length) {
              intro.fromTo(
                heroChildren,
                { autoAlpha: 0, y: 42, scale: 0.985, willChange: "transform, opacity" },
                {
                  autoAlpha: 1,
                  y: 0,
                  scale: 1,
                  duration: 1.5,
                  stagger: 0.22,
                  ease: "power3.out",
                  clearProps: "transform,opacity,visibility,willChange",
                },
                0.28
              );
            }
          }

          sections.forEach((section, index) => {
            const children = Array.from(
              section.querySelectorAll<HTMLElement>("[data-reveal-child]")
            );
            const targets = children.length ? children : [section];

            const prepareHidden = (direction: 1 | -1) => {
              gsap.killTweensOf(targets);
              gsap.set(targets, {
                autoAlpha: 0,
                y: 34 * direction,
                scale: 0.992,
              });
            };

            const fadeOut = (direction: 1 | -1) => {
              gsap.killTweensOf(targets);
              gsap.to(targets, {
                autoAlpha: 0,
                y: 28 * direction,
                scale: 0.994,
                duration: 1.15,
                stagger: children.length
                  ? { each: 0.07, from: direction === 1 ? "start" : "end" }
                  : 0,
                ease: "power2.out",
                overwrite: "auto",
              });
            };

            const reveal = (direction: 1 | -1) => {
              gsap.killTweensOf(targets);
              gsap.fromTo(
                targets,
                {
                  autoAlpha: 0,
                  y: 34 * direction,
                  scale: 0.992,
                  willChange: "transform, opacity",
                },
                {
                  autoAlpha: 1,
                  y: 0,
                  scale: 1,
                  duration: 1.45,
                  stagger: children.length
                    ? { each: 0.14, from: direction === 1 ? "start" : "end" }
                    : 0,
                  ease: "power2.out",
                  overwrite: "auto",
                  onComplete: () => gsap.set(targets, { clearProps: "willChange" }),
                }
              );
            };

            prepareHidden(1);

            ScrollTrigger.create({
              trigger: section,
              start: "clamp(top 88%)",
              end: "clamp(bottom 12%)",
              refreshPriority: index,
              onEnter: () => reveal(1),
              onEnterBack: () => reveal(-1),
              onLeave: () => fadeOut(-1),
              onLeaveBack: () => fadeOut(1),
            });
          });

          if (liftWindow) {
            const resetLift = () => {
              gsap.killTweensOf(liftWindow);
              gsap.set(liftWindow, {
                autoAlpha: 0.94,
                y: 112,
                scale: 0.988,
              });
            };

            const liftIntoView = (fromY: number) => {
              gsap.killTweensOf(liftWindow);
              gsap.fromTo(
                liftWindow,
                {
                  autoAlpha: 0.94,
                  y: fromY,
                  scale: 0.988,
                  willChange: "transform, opacity",
                },
                {
                  autoAlpha: 1,
                  y: 0,
                  scale: 1,
                  duration: 1.45,
                  ease: "power3.out",
                  overwrite: "auto",
                  onComplete: () => gsap.set(liftWindow, { clearProps: "willChange" }),
                }
              );
            };

            resetLift();

            ScrollTrigger.create({
              trigger: liftWindow,
              start: "clamp(top 90%)",
              end: "clamp(bottom 10%)",
              onEnter: () => liftIntoView(112),
              onEnterBack: () => liftIntoView(-36),
              onLeaveBack: resetLift,
            });
          }
        }
      );

      // ── Tutorial section pin: freezes when step 4 hits the bottom of viewport,
      // then the dark video card scrolls upward and overlaps from below ──
      const tutorialSection = scope.querySelector<HTMLElement>("#panduan-lengkap");
      if (tutorialSection) {
        ScrollTrigger.create({
          trigger: tutorialSection,
          // Pin activates when the BOTTOM of the tutorial (step 4) reaches the
          // BOTTOM of the viewport — NOT at the start.
          start: "bottom bottom",
          // Keep pinned for one full viewport height of scroll distance so the
          // video section has room to rise up and fully cover the tutorial.
          end: "+=100%",
          pin: true,
          // pinSpacing:false = don't push content down; the video section stays
          // at its DOM position and naturally scrolls upward over the frozen tutorial.
          pinSpacing: false,
          anticipatePin: 1,
        });
      }

      const refreshFrame = window.requestAnimationFrame(() => ScrollTrigger.refresh());

      return () => {
        window.cancelAnimationFrame(refreshFrame);
        media.revert();
      };
    },
    { scope: pageRef }
  );

  // Quick POI Dock Items bilingual
  const quickDockItems = useMemo(
    () => poiCategoryIds.map((id) => ({ id, label: getCategoryLabel(id, lang) })),
    [lang]
  );

  // Sync location from URL param (e.g. ?location=demo-t1-arrival)
  useEffect(() => {
    const locationId = searchParams.get("location");
    if (!locationId) return;
    const location = qrLocations.find((item) => item.locationId === locationId);
    if (!location) return;
    const actions = useMapStore.getState();
    actions.setTerminal(location.terminal);
    actions.setFloorId(location.floorId);
    actions.setCurrentNodeId(location.nodeId);
  }, [searchParams]);

  const terminalFloors = floors.filter((floor) => floor.terminal === store.terminal);

  const currentOriginSpace = spaces.find((space) => space.anchorNodeId === store.currentNodeId);

  const openSearch = () => {
    router.push(mapSearchHref(store.terminal, store.category, store.query, true));
  };

  const setSimulatedQrLocation = (loc: (typeof qrLocations)[0]) => {
    store.setTerminal(loc.terminal);
    store.setFloorId(loc.floorId);
    store.setCurrentNodeId(loc.nodeId);
    setShowQrModal(false);
  };


  return (
    <div ref={pageRef} className="wayfinding-page">
      <SiteHeader />

      <main className="wayfinding-shell">
        {/* Roamora Hero Section */}
        <section
          className="roamora-hero"
          data-scroll-reveal
          style={{ opacity: 0, visibility: "hidden" }}
        >
          <div className="roamora-hero-backdrop" />
          <div className="roamora-hero-content">
            <div className="roamora-hero-copy" data-reveal-child>
              <h1 className="roamora-hero-title">
                Explore <span className="roamora-blue-text">Juanda Airport</span>
              </h1>

              <p className="roamora-hero-subtitle">
                {lang === "ID"
                  ? "Temukan gate, musala, kuliner, dan dapatkan petunjuk arah di Terminal 1 & 2."
                  : "Find gates, prayer rooms, restaurants, shops, and walking directions in Terminals 1 and 2."}
              </p>
            </div>

            <div className="roamora-hero-actions" data-reveal-child>
              <button
                type="button"
                className="roamora-cta-btn"
                onClick={() => {
                  document.getElementById("facility-shortcuts")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
                }}
              >
                <span>{lang === "ID" ? "Jelajahi Sekarang" : "Explore Now"}</span>
                <span className="roamora-cta-arrow">
                  <ArrowRight size={15} />
                </span>
              </button>
            </div>

            {/* Search & Navigation Card Widget */}
            <div
              className="roamora-floating-widget"
              aria-label={lang === "ID" ? "Pencarian dan kontrol navigasi" : "Search and navigation controls"}
              data-reveal-child
            >
            {/* Field 1: Where to? / Origin */}
            <div className="roamora-widget-col" onClick={() => setShowQrModal(true)} title={lang === "ID" ? "Klik untuk ganti posisi QR awal" : "Click to change QR origin"}>
              <div className="roamora-col-icon">
                <MapPin size={20} />
              </div>
              <div className="roamora-col-copy">
                <span className="roamora-col-label">{lang === "ID" ? "Lokasi Anda?" : "Your Location"}</span>
                <strong className="roamora-col-val">
                  {currentOriginSpace
                    ? getSpaceLabel(currentOriginSpace, lang)
                    : (lang === "ID" ? "Pilih titik awal" : "Choose starting point")}
                </strong>
              </div>
            </div>

            <span className="roamora-widget-divider" />

            {/* Field 2: Search Destination */}
            <div className="roamora-widget-col search-col">
              <div className="roamora-col-icon">
                <Search size={20} />
              </div>
              <div className="roamora-col-copy">
                <span className="roamora-col-label">{lang === "ID" ? "Cari Tujuan" : "Search Destination"}</span>
                <input
                  className="roamora-widget-input"
                  value={store.query}
                  onChange={(e) => store.setQuery(e.target.value)}
                  aria-label={lang === "ID" ? "Cari tujuan" : "Search destination"}
                  onKeyDown={(event) => { if (event.key === "Enter") openSearch(); }}
                  placeholder={lang === "ID" ? "Cari gate, musala, ATM..." : "Search gates, prayer rooms, ATMs..."}
                />
              </div>
              {store.query && (
                <button type="button" className="roamora-clear-btn" onClick={() => store.setQuery("")}>
                  <X size={15} />
                </button>
              )}
            </div>

            <span className="roamora-widget-divider" />

            {/* Field 3: Terminal & Floor Switcher */}
            <div className="roamora-widget-col">
              <div className="roamora-col-icon">
                <Building2 size={20} />
              </div>
              <div className="roamora-col-copy">
                <span className="roamora-col-label">{lang === "ID" ? "Terminal & Lantai" : "Terminal & Floor"}</span>
                <div className="roamora-inline-switches">
                  <select
                    aria-label={lang === "ID" ? "Terminal pencarian" : "Search terminal"}
                    value={store.terminal}
                    onChange={(e) => store.setTerminal(e.target.value as TerminalCode)}
                    className="roamora-widget-select"
                  >
                    <option value="T1">Terminal 1</option>
                    <option value="T2">Terminal 2</option>
                  </select>
                  <select
                    aria-label={lang === "ID" ? "Lantai awal peta" : "Initial map floor"}
                    value={store.floorId}
                    onChange={(e) => store.setFloorId(e.target.value)}
                    className="roamora-widget-select"
                  >
                    {terminalFloors.map((f) => (
                      <option key={f.id} value={f.id}>
                        {lang === "ID" ? f.label : f.label.replace("Lantai", "Floor")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <span className="roamora-widget-divider" />

            {/* Field 4: Category Filter */}
            <div className="roamora-widget-col">
              <div className="roamora-col-icon">
                <Compass size={20} />
              </div>
              <div className="roamora-col-copy">
                <span className="roamora-col-label">{lang === "ID" ? "Kategori POI" : "Categories"}</span>
                <select
                  aria-label={lang === "ID" ? "Kategori pencarian" : "Search category"}
                  value={store.category}
                  onChange={(e) => store.setCategory(e.target.value)}
                  className="roamora-widget-select"
                >
                  {quickDockItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Search Submit Button */}
            <button
              type="button"
              className="roamora-search-submit-btn"
              onClick={openSearch}
            >
              <span>{lang === "ID" ? "Cari Lokasi" : "Find Locations"}</span>
              <Search size={16} />
            </button>
            </div>

          </div>
        </section>

        {/* Explore Section */}
        <section className="explore-section">
          <FacilityShortcuts />

          <div className="section-overlap-stack">
            {/* Tutorial section — position:sticky inside, freezes in place */}
            <WayfindingFullTutorialSection
              onOpenSearchModal={openSearch}
              onOpenQrModal={() => setShowQrModal(true)}
              onOpenHelpModal={() => setShowHelpModal(true)}
            />
            {/* Video section — position:relative, z-index:10 — slides UP over tutorial */}
            <WayfindingVideoTutorial />
          </div>


        </section>
      </main>

      {/* Simulated QR Location Scanner Modal */}
      {showQrModal && (
        <div className="modal-overlay" onClick={() => setShowQrModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t.simModalTitle}</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowQrModal(false)}
                aria-label={lang === "ID" ? "Tutup modal" : "Close dialog"}
              >
                <X size={18} />
              </button>
            </div>
            <p style={{ color: "var(--ink-muted)", fontSize: "13px", marginTop: 0, marginBottom: 16 }}>
              {t.simModalDesc}
            </p>
            <div className="qr-preset-list">
              {qrLocations.map((loc) => (
                <button
                  key={loc.locationId}
                  type="button"
                  className="qr-preset-item"
                  onClick={() => setSimulatedQrLocation(loc)}
                >
                  <div>
                    <strong>{getQrLocationLabel(loc.label, lang)}</strong>
                    <small>
                      {loc.terminal} •{" "}
                      {loc.floorId.endsWith("L1")
                        ? lang === "ID"
                          ? "Lantai 1"
                          : "Floor 1"
                        : lang === "ID"
                        ? "Lantai 2"
                        : "Floor 2"}
                    </small>
                  </div>
                  <QrCode size={20} style={{ color: "var(--accent-strong)" }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tutorial & Help Modal */}
      <WayfindingTutorialModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        onOpenQrModal={() => setShowQrModal(true)}
        onOpenSearchModal={openSearch}
      />
      <SiteFooter />
    </div>
  );
}

