"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ChevronRight,
  Clock3,
  Crosshair,
  Navigation,
  QrCode,
  RotateCcw,
  Ruler,
  X,
} from "lucide-react";
import { categories, floors, qrLocations, routeNodes, spaces } from "@/data/demo-wayfinding";
import { facilityShortcuts, findFacilities, readMapSearch } from "@/lib/facility-search";
import { getCategoryLabel, getSpaceLabel } from "@/lib/wayfinding-language";
import { findGridRoute } from "@/lib/grid-route";
import { useMapStore } from "@/store/mapStore";
import type { MapSpace, TerminalCode } from "@/types";
import { MapStage } from "./MapStage";
import { SearchOverlayModal } from "./SearchOverlayModal";
import { WayfindingTutorialModal } from "./WayfindingTutorialModal";
import { SiteHeader } from "@/components/site/SiteHeader";
import styles from "./FullMapShell.module.css";

const tDict = {
  ID: {
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
    onThisFloor: "Fasilitas Lantai Ini",
    tapToFind: "Ketuk untuk mencari di peta.",
    startJourney: "Mulai Perjalanan",
    originInput: "Titik Awal (Origin)",
    finishInput: "Tujuan (Finish)",
    chooseOrigin: "Pilih Titik Awal",
    chooseDestination: "Pilih Tujuan",
    detailJourney: "Rincian Rute",
    chooseDestMap: "Pilih tujuan di peta",
    airQuality: "Indoor Air Quality",
    excellent: "Sangat Baik",
    temp: "Suhu",
    humidity: "Kelembapan",
    refreshNote: "Data diperbarui secara berkala",
    scanQr: "Pindai QR",
    whereAmI: "Posisi Saya",
    resetMap: "Reset Peta",
  },
  EN: {
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
    onThisFloor: "On This Floor",
    tapToFind: "Tap to find on map.",
    startJourney: "Start your Journey",
    originInput: "Start Point",
    finishInput: "Finish Point",
    chooseOrigin: "Area Location",
    chooseDestination: "Area Location",
    detailJourney: "Detail Journey",
    chooseDestMap: "Select destination on map",
    airQuality: "Indoor Air Quality",
    excellent: "Excellent",
    temp: "Temperature",
    humidity: "Humidity",
    refreshNote: "Data refreshes periodically",
    scanQr: "Scan QR",
    whereAmI: "Where Am I?",
    resetMap: "Reset Map",
  },
};

export function FullMapShell() {
  const searchParams = useSearchParams();
  const [showQrModal, setShowQrModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const originDialog = useRef<HTMLDialogElement>(null);
  const [pendingDestination, setPendingDestination] = useState<MapSpace | null>(null);
  const [currentTime, setCurrentTime] = useState("");
  const [currentDateStr, setCurrentDateStr] = useState("");
  const store = useMapStore();
  useEffect(() => {
    if (pendingDestination) originDialog.current?.showModal();
    else originDialog.current?.close();
  }, [pendingDestination]);

  const lang = store.lang;
  const t = tDict[lang];

  useEffect(() => {
    if (searchParams.get("help") !== "true") return;
    const timer = window.setTimeout(() => setShowHelpModal(true), 0);
    return () => window.clearTimeout(timer);
  }, [searchParams]);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const daysID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
      const monthsID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agust", "Sep", "Okt", "Nov", "Des"];
      const daysEN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const monthsEN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const day = lang === "ID" ? daysID[now.getDay()] : daysEN[now.getDay()];
      const month = lang === "ID" ? monthsID[now.getMonth()] : monthsEN[now.getMonth()];
      setCurrentDateStr(`${day}, ${now.getDate()} ${month}`);
      setCurrentTime(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }));
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [lang]);

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

  useEffect(() => {
    if (!["terminal", "category", "q", "directory"].some((key) => searchParams.has(key))) return;
    const actions = useMapStore.getState();
    const filter = readMapSearch(searchParams, actions.terminal);
    const qr = qrLocations.find((item) => item.locationId === searchParams.get("location"));
    const terminal = qr?.terminal ?? filter.terminal;
    actions.setTerminal(terminal);
    actions.selectSpace(null);
    actions.clearRoute();
    actions.setQuery(filter.query);
    actions.setCategory(filter.category);
    const matches = findFacilities(spaces, terminal, filter.category, filter.query);
    const currentFloor = useMapStore.getState().floorId;
    if (!matches.some((space) => space.floorId === currentFloor) && matches[0]) actions.setFloorId(matches[0].floorId);
    actions.setIsSearchOpen(searchParams.get("directory") === "true");
  }, [searchParams]);

  const matchingSpaces = useMemo(() => findFacilities(spaces, store.terminal, store.category, store.query), [store.terminal, store.category, store.query]);
  const visibleSpaces = useMemo(() => matchingSpaces.filter((space) => space.floorId === store.floorId), [matchingSpaces, store.floorId]);

  const selected = spaces.find((s) => s.id === store.selectedSpaceId) ?? null;
  const terminalSpaces = spaces.filter((s) => s.terminal === store.terminal && s.status === "ACTIVE");
  const currentOriginSpace =
    terminalSpaces.find((s) => s.anchorNodeId === store.fromNodeId) ??
    terminalSpaces.find((s) => s.anchorNodeId === store.currentNodeId);
  const routeFrom = terminalSpaces.find((s) => s.anchorNodeId === store.fromNodeId);
  const routeTo = terminalSpaces.find((s) => s.anchorNodeId === store.toNodeId);

  const computeRoute = (fromId: string, toId: string) => {
    const result = findGridRoute(
      routeNodes.find((n) => n.id === fromId),
      routeNodes.find((n) => n.id === toId)
    );
    store.setRoute(result, result ? "ready" : "no-route");
    if (result?.nodes[0]) store.setFloorId(result.nodes[0].floorId);
  };

  const startDirections = (space: MapSpace) => {
    const from = store.fromNodeId ?? store.currentNodeId;
    if (!from) { setPendingDestination(space); return; }
    store.setFromNodeId(from);
    store.setToNodeId(space.anchorNodeId);
    computeRoute(from, space.anchorNodeId);
  };

  const selectSpace = (space: MapSpace) => {
    store.clearRoute();
    store.selectSpace(space.id);
    if (space.floorId !== store.floorId) store.setFloorId(space.floorId);
  };

  const changeCategory = (category: string) => {
    store.selectSpace(null);
    store.clearRoute();
    store.setCategory(category);
    store.setQuery("");
    const matches = findFacilities(spaces, store.terminal, category);
    if (!matches.some((space) => space.floorId === store.floorId) && matches[0]) store.setFloorId(matches[0].floorId);
  };

  const setSimulatedQrLocation = (loc: (typeof qrLocations)[0]) => {
    store.setTerminal(loc.terminal);
    store.setFloorId(loc.floorId);
    store.setCurrentNodeId(loc.nodeId);
    setShowQrModal(false);
  };

  const routeFloorIds = [...new Set(store.route?.nodes.map((n) => n.floorId) ?? [])];

  return (
    <div className={`wayfinding-page full-screen-page ${styles.root}`}>
      <SiteHeader />

      <main className="wayfinding-shell full-screen-shell">

        {/* ── LAYER 0: Full-screen background map canvas ── */}
        <div className="fs-map-bg">
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
            overview
          />
        </div>

        {/* ── LAYER 1: Floating Header HUD ── */}
        <header className="fs-hud-header">
          <button
            type="button"
            className="stitch-location-badge"
            onClick={() => setShowQrModal(true)}
            title={lang === "ID" ? "Klik untuk memilih posisi awal" : "Click to select origin point"}
          >
            <div>
              <h2 className="stitch-loc-title">
                {selected?.tenant?.name ?? selected?.label ?? currentOriginSpace?.tenant?.name ?? currentOriginSpace?.label ?? (lang === "ID" ? "Pilih titik awal" : "Choose starting point")}
              </h2>
              <p className="stitch-loc-sub">
                {store.floorId.endsWith("L1") ? (lang === "ID" ? "Lantai 1" : "1st Floor") : (lang === "ID" ? "Lantai 2" : "2nd Floor")}
              </p>
            </div>
            <ChevronRight size={18} className="stitch-arrow-icon" />
          </button>

          <div className="stitch-header-right">
            <div className="stitch-time-block">
              <div className="stitch-date-label">
                <span>{currentDateStr.split(",")[0] || "Monday"}</span>
                <small>{currentDateStr.split(",")[1] || " 31 Aug"}</small>
              </div>
              <div className="stitch-time-display">
                <span className="pulse-dot" />
                <h1>{currentTime || "9:04 PM"}</h1>
              </div>
            </div>
          </div>
        </header>

        {/* ── LAYER 1: LEFT Sidebar – Air Quality + Journey + Route ── */}
        <aside className="fs-sidebar-left">
          {/* Air Quality Widget */}
          <section className="stitch-card air-quality-card">
            <div className="card-header">
              <h3>{t.airQuality}</h3>
              <span className="status-excellent">{t.excellent}</span>
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
                <p>{t.temp}</p>
                <strong>24°C / 75°F</strong>
              </div>
              <div className="metric-divider" />
              <div>
                <p>{t.humidity}</p>
                <strong>56%</strong>
              </div>
            </div>
            <p className="refresh-note">{t.refreshNote}</p>
          </section>

          {/* Journey Input */}
          <section className="stitch-card journey-card">
            <h3>{t.startJourney}</h3>
            <button type="button" className="journey-input-box" onClick={() => setShowQrModal(true)} title={lang === "ID" ? "Klik untuk ganti posisi QR awal" : "Click to change QR start location"}>
              <span className="journey-field-label">{t.originInput}</span>
              <span className="journey-field-value">{currentOriginSpace?.tenant?.name ?? currentOriginSpace?.label ?? (lang === "ID" ? "Pilih titik awal" : "Choose starting point")}</span>
              <ChevronRight size={15} />
            </button>
            <button type="button" className="journey-input-box" onClick={() => store.setIsSearchOpen(true)} title={lang === "ID" ? "Pilih lokasi di peta" : "Select location on map"}>
              <span className="journey-field-label">{t.finishInput}</span>
              <span className="journey-field-value" data-placeholder={!selected && !store.query}>{selected?.tenant?.name ?? selected?.label ?? (store.query || t.chooseDestination)}</span>
              <ChevronRight size={15} />
            </button>
          </section>

          {/* Route Timeline */}
          <section className="stitch-card journey-timeline-card">
            <h3>{t.detailJourney}</h3>
            <div className="timeline-container">
              <div className="timeline-line" />
              <ul className="timeline-steps">
                {store.routeStatus === "ready" && store.route ? (
                  store.route.nodes.map((node, idx) => {
                    const spaceForNode = spaces.find((s) => s.anchorNodeId === node.id);
                    return (
                      <li key={node.id} className="timeline-step">
                        <div className={`step-dot ${idx === 0 ? "origin" : idx === store.route!.nodes.length - 1 ? "active" : "mid"}`} />
                        <span>{spaceForNode?.tenant?.name ?? spaceForNode?.label ?? (idx === 0 ? currentOriginSpace?.label ?? "Pintu Masuk" : idx === store.route!.nodes.length - 1 ? selected?.label ?? "Tujuan" : `Titik Rute ${idx + 1}`)}</span>
                      </li>
                    );
                  })
                ) : (
                  <>
                    <li className="timeline-step">
                      <div className="step-dot origin" />
                      <span>{currentOriginSpace?.tenant?.name ?? currentOriginSpace?.label ?? (lang === "ID" ? "Pilih titik awal" : "Choose starting point")}</span>
                    </li>
                    {selected ? (
                      <li className="timeline-step">
                        <div className="step-dot active" />
                        <span>{selected.tenant?.name ?? selected.label}</span>
                      </li>
                    ) : (
                      <li className="timeline-step">
                        <div className="step-dot mid" />
                        <span className="timeline-placeholder">{t.chooseDestMap}</span>
                      </li>
                    )}
                  </>
                )}
              </ul>
            </div>
          </section>
        </aside>

        {/* ── LAYER 1: RIGHT Sidebar – Fasilitas Lantai Ini ── */}
        <aside className="fs-sidebar-right" aria-label={lang === "ID" ? "Direktori fasilitas" : "Facility directory"}>
          <div className={`stitch-card legend-card ${styles.directory}`}>
            <h3>{lang === "ID" ? "Cari fasilitas" : "Find facilities"}</h3>
            <label>Terminal
              <select aria-label="Terminal" value={store.terminal} onChange={(event) => { store.setTerminal(event.target.value as TerminalCode); }}>
                <option value="T1">Terminal 1</option><option value="T2">Terminal 2</option>
              </select>
            </label>
            <label>{lang === "ID" ? "Lantai peta" : "Map floor"}
              <select value={store.floorId} onChange={(event) => { store.selectSpace(null); store.setFloorId(event.target.value); }}>
                {floors.filter((floor) => floor.terminal === store.terminal).map((floor) => <option key={floor.id} value={floor.id}>{lang === "ID" ? floor.label : `Floor ${floor.number}`}</option>)}
              </select>
            </label>
            <label>{lang === "ID" ? "Fasilitas" : "Facility"}
              <select value={store.category} onChange={(event) => changeCategory(event.target.value)}>
                <option value="all">{lang === "ID" ? "Semua fasilitas" : "All facilities"}</option>
                {facilityShortcuts.map((item) => <option key={item.id} value={item.id}>{item[lang]}</option>)}
                <option value="shop">{getCategoryLabel("shop", lang)}</option>
                <option value="office">{getCategoryLabel("office", lang)}</option>
                <option value="entrance">{getCategoryLabel("entrance", lang)}</option>
              </select>
            </label>
            <p role="status">{getCategoryLabel(store.category, lang)} &middot; {matchingSpaces.length} {lang === "ID" ? "lokasi di" : "locations in"} {store.terminal}</p>
            <p>{lang === "ID" ? "Daftar mencakup semua lantai. Pilih lokasi untuk melihatnya di peta." : "Results include all floors. Select a location to view it on the map."}</p>
            {store.query && <button type="button" className={styles.result} onClick={() => store.setQuery("")}>{lang === "ID" ? "Hapus kata pencarian" : "Clear search"}: {store.query} <X size={14} /></button>}
            <div className={styles.results}>
              {matchingSpaces.map((space) => <button type="button" className={styles.result} key={space.id} aria-pressed={store.selectedSpaceId === space.id} onClick={() => selectSpace(space)}>
                <strong>{getSpaceLabel(space, lang)}</strong>
                <small>{lang === "ID" ? "Lantai" : "Floor"} {space.floorId.endsWith("L1") ? "1" : "2"}{space.status !== "ACTIVE" ? (lang === "ID" ? " - Tutup sementara" : " - Temporarily closed") : ""}</small>
              </button>)}
              {!matchingSpaces.length && <div className={styles.empty}>
                <strong>{lang === "ID" ? "Lokasi belum tersedia" : "Locations not yet available"}</strong>
                <p>{lang === "ID" ? "Belum ada lokasi yang sesuai dalam data terminal ini. Coba kategori atau terminal lain." : "No matching locations are listed for this terminal. Try another category or terminal."}</p>
                <button type="button" className={styles.result} onClick={() => changeCategory("all")}>{lang === "ID" ? "Lihat semua fasilitas" : "View all facilities"}</button>
              </div>}
            </div>
          </div>
        </aside>

        {/* ── LAYER 2: Floating Detail / Route Sheet ── */}
        {(selected || store.routeStatus !== "idle") && (
          <aside className="fs-detail-sheet" aria-label={store.routeStatus === "idle" ? "Detail lokasi" : "Detail rute"}>
            <button type="button" className="sheet-close" onClick={() => { store.selectSpace(null); store.clearRoute(); }} aria-label="Tutup panel">
              <X size={20} />
            </button>

            {store.routeStatus === "idle" && selected && (
              <>
                <span className="space-code">{selected.code}</span>
                {selected.icon && (<span className="detail-location-icon" style={{ backgroundImage: `url("${selected.icon}")` }} role="img" aria-label={`Ikon ${selected.label}`} />)}
                <span className="detail-category">
                  <i style={{ background: selected.mapColor ?? "var(--accent)" }} />
                  {categories.find((c) => c.id === selected.category)?.label ?? "Facility"}
                </span>
                <h1>{selected.tenant?.name ?? selected.label}</h1>
                {selected.tenant && <p className="space-subtitle">{selected.label}</p>}
                <p>{selected.description}</p>
                <dl className="detail-facts">
                  <div><dt>Status</dt><dd>{selected.status === "ACTIVE" ? t.statusOpen : t.statusClosed}</dd></div>
                  <div><dt>{t.serviceHours}</dt><dd>{selected.tenant?.hours ?? t.hours24}</dd></div>
                  <div><dt>{t.location}</dt><dd>{selected.terminal} • {selected.floorId.endsWith("L1") ? (lang === "ID" ? "Lantai 1" : "Floor 1") : (lang === "ID" ? "Lantai 2" : "Floor 2")}</dd></div>
                </dl>
                <button type="button" className="primary-action" onClick={() => startDirections(selected)} disabled={selected.status !== "ACTIVE"}>
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
                  <select value={store.fromNodeId ?? ""} onChange={(e) => { store.setFromNodeId(e.target.value); if (store.toNodeId) computeRoute(e.target.value, store.toNodeId); }}>
                    {terminalSpaces.map((s) => (<option key={s.id} value={s.anchorNodeId}>{s.tenant?.name ?? s.label}</option>))}
                  </select>
                </label>
                <label className="route-field">
                  <span>{t.destinationLabel}</span>
                  <select value={store.toNodeId ?? ""} onChange={(e) => { store.setToNodeId(e.target.value); if (store.fromNodeId) computeRoute(store.fromNodeId, e.target.value); }}>
                    {terminalSpaces.map((s) => (<option key={s.id} value={s.anchorNodeId}>{s.tenant?.name ?? s.label}</option>))}
                  </select>
                </label>
                {store.routeStatus === "ready" && store.route ? (
                  <>
                    <div className="route-metrics">
                      <div><Ruler size={19} /><strong>{store.route.totalDistanceMeters} m</strong><span>{t.distance}</span></div>
                      <div><Clock3 size={19} /><strong>~{store.route.estimatedMinutes} Mnt</strong><span>{t.estWalkTime}</span></div>
                    </div>
                    <div className="route-progress" aria-label="Ringkasan rute">
                      <div><span>A</span><p><small>{t.startFrom}</small><strong>{routeFrom?.tenant?.name ?? routeFrom?.label ?? "Main Entrance"}</strong></p></div>
                      <div><span>B</span><p><small>{t.finalDestination}</small><strong>{routeTo?.tenant?.name ?? routeTo?.label ?? "Destination"}</strong></p></div>
                    </div>
                    {routeFloorIds.length > 1 && (
                      <div className="route-floor-tabs">
                        {routeFloorIds.map((id) => (
                          <button key={id} type="button" aria-pressed={store.floorId === id} onClick={() => store.setFloorId(id)}>
                            {id.endsWith("L1") ? (lang === "ID" ? "Lantai 1" : "Floor 1") : (lang === "ID" ? "Lantai 2" : "Floor 2")}
                          </button>
                        ))}
                      </div>
                    )}
                    {store.route.connectorInstructions.map((instruction) => (
                      <p key={instruction} className="connector-note"><Navigation size={17} /> {instruction}</p>
                    ))}
                  </>
                ) : (
                  <div className="empty-state no-route"><AlertTriangle size={24} /><strong>{t.routeUnavailable}</strong><span>{t.routeUnavailableDesc}</span></div>
                )}
              </>
            )}
          </aside>
        )}

        {/* ── LAYER 1: Floating Footer Actions ── */}
        <footer className="fs-hud-footer">
          <button type="button" className="btn-action-blue" data-variant="primary" aria-label={t.scanQr} onClick={() => setShowQrModal(true)}>
            <QrCode size={18} /><span>{t.scanQr}</span>
          </button>
          <div className="right-action-group">
            <button type="button" className="btn-action-blue" data-variant="secondary" aria-label={t.whereAmI} onClick={() => {
              const nodeId = store.currentNodeId ?? store.fromNodeId;
              if (!nodeId) { setShowQrModal(true); return; }

              // Find the node position in the routeNodes list
              const node = routeNodes.find((n) => n.id === nodeId);
              if (node) {
                // Switch to the correct floor first
                if (node.floorId !== store.floorId) store.setFloorId(node.floorId);

                // Dispatch a custom event so MapStage can pan to this coordinate
                window.dispatchEvent(new CustomEvent("wayfinding:pan-to", {
                  detail: { x: node.x, y: node.y, scale: 2.5 },
                }));
              }

              // Also try to open the space detail if a space is anchored here
              const spaceAtNode = spaces.find((s) => s.anchorNodeId === nodeId);
              if (spaceAtNode) selectSpace(spaceAtNode);
            }}>
              <Crosshair size={17} /><span>{t.whereAmI}</span>
            </button>
            <button type="button" className="btn-action-blue" data-variant="secondary" aria-label={t.resetMap} onClick={() => {
              store.selectSpace(null); store.clearRoute(); store.setQuery(""); store.setCategory("all");
            }}>
              <RotateCcw size={16} /><span>{t.resetMap}</span>
            </button>
          </div>
        </footer>

      </main>

      <dialog ref={originDialog} className={styles.originDialog} aria-labelledby="origin-dialog-title" onCancel={() => setPendingDestination(null)}>
        <button type="button" className="modal-close" onClick={() => setPendingDestination(null)} aria-label={lang === "ID" ? "Tutup pilihan titik awal" : "Close starting point selection"}><X size={20} /></button>
        <h2 id="origin-dialog-title">{lang === "ID" ? "Pilih titik awal" : "Choose your starting point"}</h2>
        <p>{lang === "ID" ? "Posisimu belum diketahui. Pilih lokasi awal untuk menuju" : "Your position is not set. Choose a starting point to reach"} {pendingDestination && getSpaceLabel(pendingDestination, lang)}.</p>
        <div className={styles.results}>
          {terminalSpaces.map((space) => <button type="button" key={space.id} className={styles.result} onClick={() => {
            if (!pendingDestination) return;
            store.setFromNodeId(space.anchorNodeId);
            store.setToNodeId(pendingDestination.anchorNodeId);
            computeRoute(space.anchorNodeId, pendingDestination.anchorNodeId);
            setPendingDestination(null);
          }}><strong>{getSpaceLabel(space, lang)}</strong><small>{lang === "ID" ? "Lantai" : "Floor"} {space.floorId.endsWith("L1") ? "1" : "2"}</small></button>)}
        </div>
      </dialog>

      {/* QR Modal */}
      {showQrModal && (
        <div className="modal-overlay" onClick={() => setShowQrModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t.simModalTitle}</h3>
              <button type="button" className="modal-close" onClick={() => setShowQrModal(false)} aria-label="Tutup modal"><X size={18} /></button>
            </div>
            <p style={{ color: "var(--ink-muted)", fontSize: "13px", marginTop: 0, marginBottom: 16 }}>{t.simModalDesc}</p>
            <div className="qr-preset-list">
              {qrLocations.map((loc) => (
                <button key={loc.locationId} type="button" className="qr-preset-item" onClick={() => setSimulatedQrLocation(loc)}>
                  <div>
                    <strong>{loc.label}</strong>
                    <small>{loc.terminal} • {loc.floorId.endsWith("L1") ? (lang === "ID" ? "Lantai 1" : "Floor 1") : (lang === "ID" ? "Lantai 2" : "Floor 2")}</small>
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
      />

      {/* Search Overlay Modal */}
      <SearchOverlayModal />
    </div>
  );
}
