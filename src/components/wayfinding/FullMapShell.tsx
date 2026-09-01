"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  Clock3,
  Compass,
  Navigation,
  QrCode,
  Ruler,
  X,
} from "lucide-react";
import { categories, qrLocations, routeNodes, spaces } from "@/data/demo-wayfinding";
import { findGridRoute } from "@/lib/grid-route";
import { useMapStore } from "@/store/mapStore";
import type { MapSpace } from "@/types";
import { MapStage } from "./MapStage";
import { SearchOverlayModal } from "./SearchOverlayModal";
import { WayfindingTutorialModal } from "./WayfindingTutorialModal";
import { SiteHeader } from "@/components/site/SiteHeader";

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
  },
};

export function FullMapShell() {
  const searchParams = useSearchParams();
  const [showQrModal, setShowQrModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [currentDateStr, setCurrentDateStr] = useState("");
  const store = useMapStore();
  const lang = store.lang;
  const t = tDict[lang];

  useEffect(() => {
    if (searchParams.get("help") === "true") setShowHelpModal(true);
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

  const visibleSpaces = useMemo(() => {
    return spaces.filter((space) => {
      const matchesFloor = space.floorId === store.floorId;
      const matchesCategory = store.category === "all" || space.category === store.category;
      const haystack = `${space.label} ${space.code} ${space.tenant?.name ?? ""}`.toLocaleLowerCase("id-ID");
      return matchesFloor && matchesCategory && haystack.includes(store.query.toLocaleLowerCase("id-ID"));
    });
  }, [store.floorId, store.category, store.query]);

  const selected = spaces.find((s) => s.id === store.selectedSpaceId) ?? null;
  const terminalSpaces = spaces.filter((s) => s.terminal === store.terminal && s.status === "ACTIVE");
  const currentOriginSpace =
    terminalSpaces.find((s) => s.anchorNodeId === store.fromNodeId) ??
    terminalSpaces.find((s) => s.anchorNodeId === store.currentNodeId) ??
    terminalSpaces[0];
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

  const routeFloorIds = [...new Set(store.route?.nodes.map((n) => n.floorId) ?? [])];

  return (
    <div className="wayfinding-page full-screen-page">
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
          />
        </div>

        {/* ── LAYER 1: Floating Header HUD ── */}
        <header className="fs-hud-header">
          <div
            className="stitch-location-badge"
            onClick={() => setShowQrModal(true)}
            title={lang === "ID" ? "Klik untuk memilih posisi awal" : "Click to select origin point"}
          >
            <div>
              <h2 className="stitch-loc-title">
                {selected?.tenant?.name ?? selected?.label ?? currentOriginSpace?.tenant?.name ?? currentOriginSpace?.label ?? `Terminal ${store.terminal} Entrance`}
              </h2>
              <p className="stitch-loc-sub">
                {store.floorId.endsWith("L1") ? (lang === "ID" ? "Lantai 1" : "1st Floor") : (lang === "ID" ? "Lantai 2" : "2nd Floor")}
              </p>
            </div>
            <ChevronRight size={18} className="stitch-arrow-icon" />
          </div>

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
            <button type="button" className="stitch-help-btn" onClick={() => setShowHelpModal(true)}>
              <span>{lang === "ID" ? "Cara Pakai\nPeta?" : "How do I\nuse this?"}</span>
              <div className="help-icon-circle"><ArrowRight size={14} /></div>
            </button>
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
            <div className="journey-input-box" onClick={() => setShowQrModal(true)} title={lang === "ID" ? "Klik untuk ganti posisi QR awal" : "Click to change QR start location"}>
              <label>{t.originInput}</label>
              <input readOnly value={currentOriginSpace?.tenant?.name ?? currentOriginSpace?.label ?? `Terminal ${store.terminal} Entrance`} placeholder={t.chooseOrigin} />
            </div>
            <div className="journey-input-box" title={lang === "ID" ? "Pilih lokasi di peta" : "Select location on map"}>
              <label>{t.finishInput}</label>
              <input readOnly value={selected?.tenant?.name ?? selected?.label ?? (store.query || t.chooseDestination)} placeholder={t.chooseDestination} />
            </div>
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
                      <span>{currentOriginSpace?.tenant?.name ?? currentOriginSpace?.label ?? "Pintu Masuk T1"}</span>
                    </li>
                    {selected ? (
                      <li className="timeline-step">
                        <div className="step-dot active" />
                        <span>{selected.tenant?.name ?? selected.label}</span>
                      </li>
                    ) : (
                      <li className="timeline-step">
                        <div className="step-dot mid" />
                        <span style={{ opacity: 0.65 }}>{t.chooseDestMap}</span>
                      </li>
                    )}
                  </>
                )}
              </ul>
            </div>
          </section>
        </aside>

        {/* ── LAYER 1: RIGHT Sidebar – Fasilitas Lantai Ini ── */}
        <aside className="fs-sidebar-right">
          <div className="stitch-card legend-card">
            <h3>{t.onThisFloor}</h3>
            <p>{t.tapToFind}</p>
            <div className="floor-poi-buttons">
              <button type="button" className="poi-filter-btn" onClick={() => { store.setCategory("all"); store.setQuery(lang === "ID" ? "toilet" : "restroom"); }}>
                <div className="icon-badge"><div className="square-dot" /></div>
                <span>Rest Rooms</span>
              </button>
              <button type="button" className="poi-filter-btn" onClick={() => { store.setCategory("office"); store.setQuery(lang === "ID" ? "layanan" : "child"); }}>
                <div className="icon-badge"><div className="circle-dot" /></div>
                <span>Child Care Area</span>
              </button>
              <button type="button" className="poi-filter-btn" onClick={() => { store.setCategory("all"); store.setQuery(lang === "ID" ? "tangga" : "stairs"); }}>
                <div className="icon-badge">
                  <svg className="w-3.5 h-3.5 transform -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M4 8h16M4 16h16" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                </div>
                <span>Stairs</span>
              </button>
              <button type="button" className="poi-filter-btn" onClick={() => { store.setCategory("all"); store.setQuery(lang === "ID" ? "lift" : "elevator"); }}>
                <div className="icon-badge"><div className="elevator-ic" /></div>
                <span>Elevators</span>
              </button>
              <button type="button" className="poi-filter-btn" onClick={() => { store.setCategory("prayer"); store.setQuery(""); }}>
                <div className="icon-badge"><Compass size={14} /></div>
                <span>{lang === "ID" ? "Mushola" : "Prayer Room"}</span>
              </button>
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
          <button type="button" className="btn-action-blue" onClick={() => setShowQrModal(true)}>
            <QrCode size={18} /><span>Scan QR</span>
          </button>
          <div className="right-action-group">
            <button type="button" className="btn-action-blue" onClick={() => {
              // Use currentNodeId, or fall back to the terminal entrance
              const nodeId = store.currentNodeId ?? `${store.terminal}-ENTRANCE-NODE`;

              // Ensure the current node is set in the store (shows the blue origin pin)
              if (!store.currentNodeId) {
                store.setCurrentNodeId(nodeId);
              }

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
              <span>Where Am I?</span>
            </button>
            <button type="button" className="btn-action-blue" onClick={() => {
              store.selectSpace(null); store.clearRoute(); store.setQuery(""); store.setCategory("all");
            }}>
              <Navigation size={16} /><span>Reset Map</span>
            </button>
          </div>
        </footer>

      </main>

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
