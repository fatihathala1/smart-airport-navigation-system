"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  ChevronRight,
  Clock3,
  Compass,
  MapPin,
  Navigation,
  Plane,
  QrCode,
  Ruler,
  Search,
  ShoppingBag,
  Sparkles,
  Utensils,
  X,
} from "lucide-react";
import { categories, DEMO_DATA_NOTICE, floors, qrLocations, routeNodes, spaces } from "@/data/demo-wayfinding";
import { findGridRoute } from "@/lib/grid-route";
import { useMapStore } from "@/store/mapStore";
import type { MapSpace, TerminalCode } from "@/types";
import { MapStage } from "./MapStage";
import { SplashScreen } from "./SplashScreen";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

// Bilingual Translations Dictionary
const tDict = {
  ID: {
    appTitle: "JUA Interactive Wayfinding",
    appSubtitle: "Bandara Internasional Juanda — Terminal 1 & 2",
    yourLocation: "LOKASI ANDA",
    qrOriginText: "Diperoleh dari Static QR:",
    changeOrigin: "Ganti Titik Awal",
    searchPlaceholder: "Cari gate, check-in, musala, ATM, atau toko...",
    floor: "Lantai",
    terminal: "Terminal",
    nearbyDirectory: "DIREKTORI DEKAT ANDA",
    locations: "Lokasi",
    locationNotFound: "Lokasi tidak ditemukan",
    tryOtherKeywords: "Coba cari kata kunci lain seperti gate, musala, atau ATM.",
    getDirections: "Mulai Petunjuk Arah",
    routeWayfinding: "RUTE WAYFINDING",
    directionsTitle: "Petunjuk Arah Juanda",
    originLabel: "Titik Awal (Origin)",
    destinationLabel: "Tujuan (Destination)",
    distance: "Jarak Tempuh",
    estWalkTime: "Estimasi Jalan",
    startFrom: "Mulai Dari",
    finalDestination: "Tujuan Akhir",
    routeUnavailable: "Rute tidak tersedia",
    routeUnavailableDesc: "Pilihan lokasi awal dan tujuan tidak terhubung jalur publik.",
    simModalTitle: "Simulasi QR Code Bandara",
    simModalDesc: "Pilih salah satu titik QR Standee di Bandara Juanda untuk menguji navigasi berbasis titik lokasi awal otomatis (Static Positioning):",
    statusOpen: "Buka (Operasional)",
    statusClosed: "Tutup Sementara",
    serviceHours: "Jam Layanan",
    location: "Lokasi",
    hours24: "24 Jam Operasional",
  },
  EN: {
    appTitle: "JUA Interactive Wayfinding",
    appSubtitle: "Juanda International Airport — Terminal 1 & 2",
    yourLocation: "YOUR LOCATION",
    qrOriginText: "Obtained from Static QR:",
    changeOrigin: "Change Origin",
    searchPlaceholder: "Search gates, check-in, prayer rooms, ATMs, or shops...",
    floor: "Floor",
    terminal: "Terminal",
    nearbyDirectory: "DIRECTORY NEAR YOU",
    locations: "Locations",
    locationNotFound: "Location not found",
    tryOtherKeywords: "Try searching for gates, prayer rooms, or ATMs.",
    getDirections: "Get Directions",
    routeWayfinding: "WAYFINDING ROUTE",
    directionsTitle: "Juanda Wayfinding Directions",
    originLabel: "Starting Point (Origin)",
    destinationLabel: "Destination",
    distance: "Distance",
    estWalkTime: "Est. Walk Time",
    startFrom: "Start From",
    finalDestination: "Final Destination",
    routeUnavailable: "Route unavailable",
    routeUnavailableDesc: "Selected origin and destination are not connected by public walkways.",
    simModalTitle: "Airport QR Code Simulation",
    simModalDesc: "Select an airport QR Standee location to test static positioning auto-start navigation:",
    statusOpen: "Open (Operational)",
    statusClosed: "Temporarily Closed",
    serviceHours: "Operating Hours",
    location: "Location",
    hours24: "24 Hours Operational",
  },
};

export function WayfindingShell() {
  const searchParams = useSearchParams();
  const [showQrModal, setShowQrModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [currentDateStr, setCurrentDateStr] = useState("");
  const store = useMapStore();
  const lang = store.lang;
  const t = tDict[lang];

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const daysID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
      const monthsID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agust", "Sep", "Okt", "Nov", "Des"];
      const daysEN = ["Thursday", "Friday", "Saturday", "Sunday", "Monday", "Tuesday", "Wednesday"];
      const monthsEN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

      const day = lang === "ID" ? daysID[now.getDay()] : daysEN[now.getDay()];
      const month = lang === "ID" ? monthsID[now.getMonth()] : monthsEN[now.getMonth()];
      const dateNum = now.getDate();

      setCurrentDateStr(`${day}, ${dateNum} ${month}`);
      setCurrentTime(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }));
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [lang]);

  // Quick POI Dock Items bilingual
  const quickDockItems = useMemo(
    () => [
      { id: "all", label: lang === "ID" ? "Semua" : "All", icon: Sparkles },
      { id: "office", label: lang === "ID" ? "Kantor & Layanan" : "Offices & Services", icon: Building2 },
      { id: "food", label: lang === "ID" ? "Makanan & Minuman" : "Food & Beverage", icon: Utensils },
      { id: "shop", label: lang === "ID" ? "Toko & Fashion" : "Shops & Apparel", icon: ShoppingBag },
      { id: "prayer", label: lang === "ID" ? "Mushola" : "Prayer Room", icon: Compass },
    ],
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

  const visibleSpaces = useMemo(() => {
    return spaces.filter((space) => {
      const matchesFloor = space.floorId === store.floorId;
      const matchesCategory = store.category === "all" || space.category === store.category;
      const haystack = `${space.label} ${space.code} ${space.tenant?.name ?? ""}`.toLocaleLowerCase("id-ID");
      return matchesFloor && matchesCategory && haystack.includes(store.query.toLocaleLowerCase("id-ID"));
    });
  }, [store.floorId, store.category, store.query]);

  const selected = spaces.find((space) => space.id === store.selectedSpaceId) ?? null;
  const terminalSpaces = spaces.filter((space) => space.terminal === store.terminal && space.status === "ACTIVE");

  const currentOriginSpace =
    terminalSpaces.find((space) => space.anchorNodeId === store.fromNodeId) ??
    terminalSpaces.find((space) => space.anchorNodeId === store.currentNodeId) ??
    terminalSpaces[0];

  const routeFrom = terminalSpaces.find((space) => space.anchorNodeId === store.fromNodeId);
  const routeTo = terminalSpaces.find((space) => space.anchorNodeId === store.toNodeId);

  const computeRoute = (fromId: string, toId: string) => {
    const result = findGridRoute(
      routeNodes.find((node) => node.id === fromId),
      routeNodes.find((node) => node.id === toId)
    );
    store.setRoute(result, result ? "ready" : "no-route");
    if (result?.nodes[0]) store.setFloorId(result.nodes[0].floorId);
  };

  const startDirections = (space: MapSpace) => {
    const from = store.currentNodeId ?? `${store.terminal}-ENTRANCE-NODE`;
    store.setFromNodeId(from);
    store.setToNodeId(space.anchorNodeId);
    computeRoute(from, space.anchorNodeId);
  };

  const selectSpace = (space: MapSpace) => {
    store.selectSpace(space.id);
    if (space.floorId !== store.floorId) store.setFloorId(space.floorId);
  };

  const setSimulatedQrLocation = (loc: (typeof qrLocations)[0]) => {
    store.setTerminal(loc.terminal);
    store.setFloorId(loc.floorId);
    store.setCurrentNodeId(loc.nodeId);
    setShowQrModal(false);
  };

  const routeFloorIds = [...new Set(store.route?.nodes.map((node) => node.floorId) ?? [])];

  return (
    <div className="wayfinding-page">
      {/* Animated 1.5s Splash Screen */}
      <SplashScreen />

      <SiteHeader />

      <main className="wayfinding-shell">
        {/* Roamora Hero Section */}
        <section className="roamora-hero">
          <div className="roamora-hero-backdrop" />
          <div className="roamora-hero-content">
            <h1 className="roamora-hero-title">
              Explore <span className="roamora-blue-text">Juanda Airport</span>
            </h1>

            <p className="roamora-hero-subtitle">
              {lang === "ID"
                ? "Temukan gate, musala, kuliner, dan dapatkan petunjuk arah di Terminal 1 & 2."
                : "Find gates, lounges, dining, and get walking directions across Terminal 1 & 2."}
            </p>

            <div className="roamora-hero-actions">
              <button
                type="button"
                className="roamora-cta-btn"
                onClick={() => {
                  const target = visibleSpaces[0];
                  if (target) selectSpace(target);
                  document.getElementById("map-explorer")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <span>{lang === "ID" ? "Jelajahi Sekarang" : "Explore Now"}</span>
                <span className="roamora-cta-arrow">
                  <ArrowRight size={15} />
                </span>
              </button>
            </div>
          </div>

          {/* Roamora Floating Search & Navigation Card Widget */}
          <div className="roamora-floating-widget" aria-label="Pencarian & Kontrol Navigasi">
            {/* Field 1: Where to? / Origin */}
            <div className="roamora-widget-col" onClick={() => setShowQrModal(true)} title={lang === "ID" ? "Klik untuk ganti posisi QR awal" : "Click to change QR origin"}>
              <div className="roamora-col-icon">
                <MapPin size={20} />
              </div>
              <div className="roamora-col-copy">
                <span className="roamora-col-label">{lang === "ID" ? "Lokasi Anda?" : "Where to?"}</span>
                <strong className="roamora-col-val">
                  {currentOriginSpace?.tenant?.name ??
                    currentOriginSpace?.label ??
                    `Terminal ${store.terminal} Entrance`}
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
                  placeholder={lang === "ID" ? "Cari gate, musala, ATM..." : "Search gates, lounges..."}
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
                    value={store.terminal}
                    onChange={(e) => store.setTerminal(e.target.value as TerminalCode)}
                    className="roamora-widget-select"
                  >
                    <option value="T1">Terminal 1</option>
                    <option value="T2">Terminal 2</option>
                  </select>
                  <select
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
              onClick={() => {
                if (visibleSpaces.length > 0) {
                  selectSpace(visibleSpaces[0]);
                }
                document.getElementById("map-explorer")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <span>{lang === "ID" ? "Cari Rute" : "Search"}</span>
              <Search size={16} />
            </button>
          </div>
        </section>

        {/* Explore Section */}
        <section className="explore-section">
          <div className="explore-heading">
            <span>JELAJAHI TERMINAL</span>
            <h2>Mari Jelajahi!</h2>
          </div>

          {/* Stitch UI Map Dashboard Stage Container */}
          <div className="stitch-dashboard-container" id="map-explorer">
            {/* Header Section */}
            <header className="stitch-header">
              {/* Location / Space Selector Badge */}
              <div
                className="stitch-location-badge"
                onClick={() => setShowQrModal(true)}
                title={lang === "ID" ? "Klik untuk memilih posisi awal" : "Click to select origin point"}
              >
                <div>
                  <h2 className="stitch-loc-title">
                    {selected?.tenant?.name ??
                      selected?.label ??
                      currentOriginSpace?.tenant?.name ??
                      currentOriginSpace?.label ??
                      `Terminal ${store.terminal} Entrance`}
                  </h2>
                  <p className="stitch-loc-sub">
                    {store.floorId.endsWith("L1")
                      ? lang === "ID"
                        ? "Lantai 1"
                        : "1st Floor"
                      : lang === "ID"
                      ? "Lantai 2"
                      : "2nd Floor"}
                  </p>
                </div>
                <ChevronRight size={18} className="stitch-arrow-icon" />
              </div>

              {/* Date, Time & How do I use this? Button */}
              <div className="stitch-header-right">
                <div className="stitch-time-block">
                  <div className="stitch-date-label">
                    <span>{currentDateStr.split(",")[0] || "Thursday"}</span>
                    <small>{currentDateStr.split(",")[1] || "September 28"}</small>
                  </div>
                  <div className="stitch-time-display">
                    <span className="pulse-dot" />
                    <h1>{currentTime || "3:27 PM"}</h1>
                  </div>
                </div>

                <button
                  type="button"
                  className="stitch-help-btn"
                  onClick={() => setShowHelpModal(true)}
                  title={lang === "ID" ? "Panduan penggunaan peta" : "Map user guide"}
                >
                  <span>{lang === "ID" ? "Cara Pakai\nPeta?" : "How do I\nuse this?"}</span>
                  <div className="help-icon-circle">
                    <ArrowRight size={14} />
                  </div>
                </button>
              </div>
            </header>

            {/* Main Dashboard Layout Grid */}
            <div className="stitch-main-grid">
              {/* Left Sidebar */}
              <aside className="stitch-sidebar-left">
                {/* Air Quality Widget */}
                <section className="stitch-card air-quality-card">
                  <div className="card-header">
                    <h3>Indoor Air Quality</h3>
                    <span className="status-excellent">{lang === "ID" ? "Sangat Baik" : "Excellent"}</span>
                  </div>

                  <div className="air-bar-track">
                    <div className="bar-seg bg-cyan" />
                    <div className="bar-seg bg-green" />
                    <div className="bar-seg bg-yellow" />
                    <div className="bar-seg bg-red" />
                    <div className="bar-pointer" />
                  </div>

                  <div className="air-metrics">
                    <div>
                      <p>{lang === "ID" ? "Suhu" : "Temperature"}</p>
                      <strong>24°C / 75°F</strong>
                    </div>
                    <div className="metric-divider" />
                    <div>
                      <p>{lang === "ID" ? "Kelembapan" : "Humidity"}</p>
                      <strong>56%</strong>
                    </div>
                  </div>

                  <p className="refresh-note">
                    {lang === "ID" ? "Data diperbarui secara berkala" : "Data refreshes periodically"}
                  </p>
                </section>

                {/* Journey Input Section */}
                <section className="stitch-card journey-card">
                  <h3>{lang === "ID" ? "Mulai Perjalanan" : "Start your Journey"}</h3>
                  <div
                    className="journey-input-box"
                    onClick={() => setShowQrModal(true)}
                    title={lang === "ID" ? "Klik untuk ganti posisi QR awal" : "Click to change QR start location"}
                  >
                    <label>{lang === "ID" ? "Titik Awal (Origin)" : "Start Point"}</label>
                    <input
                      readOnly
                      value={currentOriginSpace?.tenant?.name ?? currentOriginSpace?.label ?? `Terminal ${store.terminal} Entrance`}
                      placeholder={lang === "ID" ? "Pilih Titik Awal" : "Area Location"}
                    />
                  </div>

                  <div
                    className="journey-input-box"
                    onClick={() => {
                      const input = document.querySelector('.roamora-widget-input') as HTMLInputElement;
                      input?.focus();
                    }}
                    title={lang === "ID" ? "Klik untuk mencari lokasi tujuan" : "Click to search destination"}
                  >
                    <label>{lang === "ID" ? "Tujuan (Finish)" : "Finish Point"}</label>
                    <input
                      readOnly
                      value={selected?.tenant?.name ?? selected?.label ?? (store.query || (lang === "ID" ? "Pilih Lokasi Tujuan" : "Area Location"))}
                      placeholder={lang === "ID" ? "Pilih Tujuan" : "Area Location"}
                    />
                  </div>
                </section>

                {/* Detail Journey Timeline */}
                <section className="stitch-card journey-timeline-card">
                  <h3>{lang === "ID" ? "Rincian Rute" : "Detail Journey"}</h3>
                  <div className="timeline-container">
                    <div className="timeline-line" />
                    <ul className="timeline-steps">
                      {store.routeStatus === "ready" && store.route ? (
                        store.route.nodes.map((node, idx) => {
                          const spaceForNode = spaces.find((s) => s.anchorNodeId === node.id);
                          return (
                            <li key={node.id} className="timeline-step">
                              <div
                                className={`step-dot ${
                                  idx === 0
                                    ? "origin"
                                    : idx === store.route!.nodes.length - 1
                                    ? "active"
                                    : "mid"
                                }`}
                              />
                              <span>
                                {spaceForNode?.tenant?.name ??
                                  spaceForNode?.label ??
                                  (idx === 0
                                    ? currentOriginSpace?.label ?? "Pintu Masuk"
                                    : idx === store.route!.nodes.length - 1
                                    ? selected?.label ?? "Tujuan"
                                    : `Titik Rute ${idx + 1}`)}
                              </span>
                            </li>
                          );
                        })
                      ) : (
                        <>
                          <li className="timeline-step">
                            <div className="step-dot origin" />
                            <span>{currentOriginSpace?.tenant?.name ?? currentOriginSpace?.label ?? "Security 01"}</span>
                          </li>
                          {selected ? (
                            <li className="timeline-step">
                              <div className="step-dot active" />
                              <span>{selected.tenant?.name ?? selected.label}</span>
                            </li>
                          ) : (
                            <li className="timeline-step">
                              <div className="step-dot mid" />
                              <span style={{ opacity: 0.65 }}>
                                {lang === "ID" ? "Pilih tujuan di peta" : "Select destination on map"}
                              </span>
                            </li>
                          )}
                        </>
                      )}
                    </ul>
                  </div>
                </section>
              </aside>

              {/* Center Interactive Vector Map Canvas */}
              <div className="stitch-map-stage-wrapper">
                <MapStage
                  terminal={store.terminal}
                  floorId={store.floorId}
                  spaces={visibleSpaces}
                  selectedId={store.selectedSpaceId}
                  route={store.route}
                  fromId={store.fromNodeId}
                  toId={store.toNodeId}
                  currentId={store.currentNodeId}
                  onSelect={selectSpace}
                />

                {/* Interactive Floating Details & Wayfinding Sheet inside Map Stage */}
                {(selected || store.routeStatus !== "idle") && (
                  <aside
                    className="detail-sheet"
                    aria-label={store.routeStatus === "idle" ? "Detail lokasi" : "Detail rute"}
                  >
                    <button
                      type="button"
                      className="sheet-close"
                      onClick={() => {
                        store.selectSpace(null);
                        store.clearRoute();
                      }}
                      aria-label="Tutup panel"
                    >
                      <X size={20} />
                    </button>

                    {store.routeStatus === "idle" && selected && (
                      <>
                        <span className="space-code">{selected.code}</span>
                        {selected.icon && (
                          <span
                            className="detail-location-icon"
                            style={{ backgroundImage: `url("${selected.icon}")` }}
                            role="img"
                            aria-label={`Ikon ${selected.label}`}
                          />
                        )}
                        <span className="detail-category">
                          <i style={{ background: selected.mapColor ?? "var(--accent)" }} />
                          {categories.find((category) => category.id === selected.category)?.label ?? "Facility"}
                        </span>
                        <h1>{selected.tenant?.name ?? selected.label}</h1>
                        {selected.tenant && <p className="space-subtitle">{selected.label}</p>}
                        <p>{selected.description}</p>
                        <dl className="detail-facts">
                          <div>
                            <dt>Status</dt>
                            <dd>{selected.status === "ACTIVE" ? t.statusOpen : t.statusClosed}</dd>
                          </div>
                          <div>
                            <dt>{t.serviceHours}</dt>
                            <dd>{selected.tenant?.hours ?? t.hours24}</dd>
                          </div>
                          <div>
                            <dt>{t.location}</dt>
                            <dd>
                              {selected.terminal} •{" "}
                              {selected.floorId.endsWith("L1")
                                ? lang === "ID"
                                  ? "Lantai 1"
                                  : "Floor 1"
                                : lang === "ID"
                                ? "Lantai 2"
                                : "Floor 2"}
                            </dd>
                          </div>
                        </dl>
                        <button
                          type="button"
                          className="primary-action"
                          onClick={() => startDirections(selected)}
                          disabled={selected.status !== "ACTIVE"}
                        >
                          <Navigation size={19} /> {t.getDirections} <ChevronRight size={17} />
                        </button>
                      </>
                    )}

                    {store.routeStatus !== "idle" && (
                      <>
                        <span className="space-code">{t.routeWayfinding}</span>
                        <h1>{t.directionsTitle}</h1>

                        <label className="route-field">
                          <span>{t.originLabel}</span>
                          <select
                            value={store.fromNodeId ?? ""}
                            onChange={(event) => {
                              store.setFromNodeId(event.target.value);
                              if (store.toNodeId) computeRoute(event.target.value, store.toNodeId);
                            }}
                          >
                            {terminalSpaces.map((space) => (
                              <option key={space.id} value={space.anchorNodeId}>
                                {space.tenant?.name ?? space.label}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="route-field">
                          <span>{t.destinationLabel}</span>
                          <select
                            value={store.toNodeId ?? ""}
                            onChange={(event) => {
                              store.setToNodeId(event.target.value);
                              if (store.fromNodeId) computeRoute(store.fromNodeId, event.target.value);
                            }}
                          >
                            {terminalSpaces.map((space) => (
                              <option key={space.id} value={space.anchorNodeId}>
                                {space.tenant?.name ?? space.label}
                              </option>
                            ))}
                          </select>
                        </label>

                        {store.routeStatus === "ready" && store.route ? (
                          <>
                            <div className="route-metrics">
                              <div>
                                <Ruler size={19} />
                                <strong>{store.route.totalDistanceMeters} m</strong>
                                <span>{t.distance}</span>
                              </div>
                              <div>
                                <Clock3 size={19} />
                                <strong>~{store.route.estimatedMinutes} Mnt</strong>
                                <span>{t.estWalkTime}</span>
                              </div>
                            </div>

                            <div className="route-progress" aria-label="Ringkasan rute">
                              <div>
                                <span>A</span>
                                <p>
                                  <small>{t.startFrom}</small>
                                  <strong>{routeFrom?.tenant?.name ?? routeFrom?.label ?? "Main Entrance"}</strong>
                                </p>
                              </div>
                              <div>
                                <span>B</span>
                                <p>
                                  <small>{t.finalDestination}</small>
                                  <strong>{routeTo?.tenant?.name ?? routeTo?.label ?? "Destination"}</strong>
                                </p>
                              </div>
                            </div>

                            {routeFloorIds.length > 1 && (
                              <div className="route-floor-tabs">
                                {routeFloorIds.map((id) => (
                                  <button
                                    key={id}
                                    type="button"
                                    aria-pressed={store.floorId === id}
                                    onClick={() => store.setFloorId(id)}
                                  >
                                    {id.endsWith("L1")
                                      ? lang === "ID"
                                        ? "Lantai 1"
                                        : "Floor 1"
                                      : lang === "ID"
                                      ? "Lantai 2"
                                      : "Floor 2"}
                                  </button>
                                ))}
                              </div>
                            )}

                            {store.route.connectorInstructions.map((instruction) => (
                              <p key={instruction} className="connector-note">
                                <Navigation size={17} /> {instruction}
                              </p>
                            ))}
                          </>
                        ) : (
                          <div className="empty-state no-route">
                            <AlertTriangle size={24} />
                            <strong>{t.routeUnavailable}</strong>
                            <span>{t.routeUnavailableDesc}</span>
                          </div>
                        )}
                      </>
                    )}
                  </aside>
                )}
              </div>

              {/* Right Sidebar - On This Floor POI Filters */}
              <aside className="stitch-sidebar-right">
                <div className="stitch-card legend-card">
                  <h3>{lang === "ID" ? "Fasilitas Lantai Ini" : "On This Floor"}</h3>
                  <p>{lang === "ID" ? "Ketuk untuk mencari di peta." : "Tap to find on map."}</p>

                  <div className="floor-poi-buttons">
                    <button
                      type="button"
                      className="poi-filter-btn"
                      onClick={() => {
                        store.setCategory("all");
                        store.setQuery(lang === "ID" ? "toilet" : "restroom");
                      }}
                    >
                      <div className="icon-badge"><div className="square-dot" /></div>
                      <span>{lang === "ID" ? "Rest Rooms" : "Rest Rooms"}</span>
                    </button>

                    <button
                      type="button"
                      className="poi-filter-btn"
                      onClick={() => {
                        store.setCategory("office");
                        store.setQuery(lang === "ID" ? "layanan" : "child");
                      }}
                    >
                      <div className="icon-badge"><div className="circle-dot" /></div>
                      <span>{lang === "ID" ? "Child Care Area" : "Child Care Area"}</span>
                    </button>

                    <button
                      type="button"
                      className="poi-filter-btn"
                      onClick={() => {
                        store.setCategory("all");
                        store.setQuery(lang === "ID" ? "tangga" : "stairs");
                      }}
                    >
                      <div className="icon-badge">
                        <svg className="w-3.5 h-3.5 transform -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M4 8h16M4 16h16" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                        </svg>
                      </div>
                      <span>{lang === "ID" ? "Stairs" : "Stairs"}</span>
                    </button>

                    <button
                      type="button"
                      className="poi-filter-btn"
                      onClick={() => {
                        store.setCategory("all");
                        store.setQuery(lang === "ID" ? "lift" : "elevator");
                      }}
                    >
                      <div className="icon-badge">
                        <div className="elevator-ic" />
                      </div>
                      <span>{lang === "ID" ? "Elevators" : "Elevators"}</span>
                    </button>

                    <button
                      type="button"
                      className="poi-filter-btn"
                      onClick={() => {
                        store.setCategory("prayer");
                        store.setQuery("");
                      }}
                    >
                      <div className="icon-badge"><Compass size={14} /></div>
                      <span>{lang === "ID" ? "Mushola" : "Prayer Room"}</span>
                    </button>
                  </div>
                </div>
              </aside>
            </div>

            {/* Bottom Action Footer Bar */}
            <footer className="stitch-footer-actions">
              <button
                type="button"
                className="btn-action-blue"
                onClick={() => setShowQrModal(true)}
              >
                <QrCode size={18} />
                <span>Scan QR</span>
              </button>

              <div className="right-action-group">
                <button
                  type="button"
                  className="btn-action-blue"
                  onClick={() => {
                    if (store.currentNodeId) {
                      const originSpace = spaces.find((s) => s.anchorNodeId === store.currentNodeId);
                      if (originSpace) selectSpace(originSpace);
                    }
                  }}
                >
                  <span>Where Am I?</span>
                </button>

                <button
                  type="button"
                  className="btn-action-blue"
                  onClick={() => {
                    store.selectSpace(null);
                    store.clearRoute();
                    store.setQuery("");
                    store.setCategory("all");
                  }}
                >
                  <Navigation size={16} />
                  <span>Reset Map</span>
                </button>
              </div>
            </footer>
          </div>

          <section className="airport-insights" aria-labelledby="airport-insights-title">
            <div className="insights-heading">
              <span>Temukan Lebih Banyak</span>
              <h2 id="airport-insights-title">Insight Bandara Juanda</h2>
            </div>
            <div className="insights-layout">
              <div className="insights-photo" role="img" aria-label="Pemandangan perjalanan" />
              <div className="insights-grid">
                <article className="insight-item">
                  <span className="insight-item-icon"><ShoppingBag size={22} /></span>
                  <div>
                    <h3>Tenant Favorit</h3>
                    <p>Temukan pilihan tenant yang paling sering dikunjungi.</p>
                  </div>
                </article>
                <article className="insight-item">
                  <span className="insight-item-icon"><Plane size={22} /></span>
                  <div>
                    <h3>Lokasi Peristirahatan</h3>
                    <p>Temukan area nyaman untuk beristirahat sebelum penerbangan.</p>
                  </div>
                </article>
                <article className="insight-item">
                  <span className="insight-item-icon"><Sparkles size={22} /></span>
                  <div>
                    <h3>Lokasi Insight</h3>
                    <p>Ruang disabilitas, fasilitas penting, dan layanan lainnya.</p>
                  </div>
                </article>
              </div>
            </div>
          </section>
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
                aria-label="Tutup modal"
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
                    <strong>{loc.label}</strong>
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

      {/* Help Modal - How do I use this? */}
      {showHelpModal && (
        <div className="modal-overlay" onClick={() => setShowHelpModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{lang === "ID" ? "Panduan Navigasi Peta Interaktif" : "Map Wayfinding Guide"}</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowHelpModal(false)}
                aria-label="Tutup modal"
              >
                <X size={18} />
              </button>
            </div>
            <div className="help-modal-body">
              <div className="help-step-item">
                <div className="help-step-num">1</div>
                <div>
                  <strong>{lang === "ID" ? "Cari Lokasi atau Pilih dari Peta" : "Search or Select Destination"}</strong>
                  <p>{lang === "ID" ? "Ketik nama gate, toko, musala, atau klik langsung polygon area di denah." : "Type a location in the search bar or click any room shape on the map vector."}</p>
                </div>
              </div>
              <div className="help-step-item">
                <div className="help-step-num">2</div>
                <div>
                  <strong>{lang === "ID" ? "Scan QR Standee Fisik" : "Scan QR Standee Location"}</strong>
                  <p>{lang === "ID" ? "Tekan tombol Scan QR untuk menyesuaikan lokasi keberadaan Anda saat ini secara presisi." : "Tap Scan QR to position your starting point based on airport QR standees."}</p>
                </div>
              </div>
              <div className="help-step-item">
                <div className="help-step-num">3</div>
                <div>
                  <strong>{lang === "ID" ? "Petunjuk Arah Dijkstra" : "Interactive Directions"}</strong>
                  <p>{lang === "ID" ? "Dapatkan jalur rute terpendek, estimasi waktu jalan, serta instruksi lintas lantai (lift/tangga)." : "Get real-time shortest path routing with distance, ETA, and floor connector steps."}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <SiteFooter />
    </div>
  );
}

