"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ChevronRight, Clock3, MapPin, Navigation, Ruler, Search, ShieldCheck, Wifi, WifiOff, X } from "lucide-react";
import { categories, DEMO_DATA_NOTICE, floors, qrLocations, routeEdges, routeNodes, spaces } from "@/data/demo-wayfinding";
import { findShortestRoute } from "@/lib/dijkstra";
import { useMapStore } from "@/store/mapStore";
import type { MapSpace, TerminalCode } from "@/types";
import { MapStage } from "./MapStage";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

export function WayfindingShell() {
  const searchParams = useSearchParams();
  const [qrDismissed, setQrDismissed] = useState(false);
  const [online, setOnline] = useState(true);
  const store = useMapStore();

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);

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

  const locationId = searchParams.get("location");
  const qrLocation = qrLocations.find((item) => item.locationId === locationId);
  const qrMessage = qrDismissed || !locationId ? null : qrLocation ? `Lokasi awal diatur ke ${qrLocation.label}.` : "Kode lokasi tidak dikenali. Pilih titik asal secara manual.";

  const terminalFloors = floors.filter((floor) => floor.terminal === store.terminal);
  const visibleSpaces = useMemo(() => spaces.filter((space) => {
    const matchesFloor = space.floorId === store.floorId;
    const matchesCategory = store.category === "all" || space.category === store.category;
    const haystack = `${space.label} ${space.code} ${space.tenant?.name ?? ""}`.toLocaleLowerCase("id-ID");
    return matchesFloor && matchesCategory && haystack.includes(store.query.toLocaleLowerCase("id-ID"));
  }), [store.floorId, store.category, store.query]);
  const selected = spaces.find((space) => space.id === store.selectedSpaceId) ?? null;
  const terminalSpaces = spaces.filter((space) => space.terminal === store.terminal && space.status === "ACTIVE");
  const routeFrom = terminalSpaces.find((space) => space.anchorNodeId === store.fromNodeId);
  const routeTo = terminalSpaces.find((space) => space.anchorNodeId === store.toNodeId);

  const computeRoute = (fromId: string, toId: string) => {
    const result = findShortestRoute(
      routeNodes.filter((node) => node.id.startsWith(store.terminal)),
      routeEdges.filter((edge) => edge.id.startsWith(store.terminal)),
      fromId,
      toId,
    );
    store.setRoute(result, result ? "ready" : "no-route");
    if (result?.nodes[0]) store.setFloorId(result.nodes[0].floorId);
  };

  const startDirections = (space: MapSpace) => {
    const from = store.currentNodeId ?? `${store.terminal}-L1-ENTRANCE`;
    store.setFromNodeId(from);
    store.setToNodeId(space.anchorNodeId);
    computeRoute(from, space.anchorNodeId);
  };

  const selectSpace = (space: MapSpace) => {
    store.selectSpace(space.id);
    if (space.floorId !== store.floorId) store.setFloorId(space.floorId);
  };

  const routeFloorIds = [...new Set(store.route?.nodes.map((node) => node.floorId) ?? [])];

  return (
    <div className="wayfinding-page">
      <SiteHeader />
      <main className="wayfinding-shell">
        <section className="wayfinding-controlbar" aria-label="Kontrol navigasi bandara">
        <div className="wayfinding-title">
          <MapPin size={20} aria-hidden="true" />
          <span><strong>Airport Wayfinding</strong><small>Bandara Internasional Juanda</small></span>
        </div>
        <div className="terminal-switch" aria-label="Pilih terminal">
          {(["T1", "T2"] as TerminalCode[]).map((terminal) => (
            <button key={terminal} type="button" aria-pressed={store.terminal === terminal} onClick={() => store.setTerminal(terminal)}><span>Terminal</span> {terminal.slice(1)}</button>
          ))}
        </div>
        <div className="header-actions">
          <span className="connection-pill" data-online={online}>{online ? <Wifi size={15} /> : <WifiOff size={15} />}<span>{online ? "Online" : "Offline"}</span></span>
          <Link className="admin-link" href="/admin"><ShieldCheck size={16} /><span>Portal admin</span></Link>
        </div>
        </section>

      <section className="toolbar">
        <label className="search-field">
          <Search size={20} aria-hidden="true" />
          <span className="sr-only">Cari lokasi</span>
          <input value={store.query} onChange={(event) => store.setQuery(event.target.value)} placeholder="Cari gate, toilet, makanan, atau toko" />
          {store.query && <button type="button" onClick={() => store.setQuery("")} aria-label="Hapus pencarian"><X size={18} /></button>}
        </label>
        <div className="floor-switch" aria-label="Pilih lantai">
          {terminalFloors.map((floor) => <button key={floor.id} type="button" aria-pressed={store.floorId === floor.id} onClick={() => store.setFloorId(floor.id)}>{floor.label}</button>)}
        </div>
      </section>

      <nav className="category-strip" aria-label="Kategori lokasi">
        {categories.map((category) => <button key={category.id} type="button" aria-pressed={store.category === category.id} onClick={() => store.setCategory(category.id)}>{category.label}</button>)}
      </nav>

      {!online && <div className="status-banner" role="status"><WifiOff size={18} /> Anda sedang offline. Peta demo tetap tersedia, tetapi data terbaru mungkin belum dimuat.</div>}
      {qrMessage && <div className="status-banner" role="status"><MapPin size={18} /> {qrMessage}<button type="button" onClick={() => setQrDismissed(true)} aria-label="Tutup pesan"><X size={18} /></button></div>}

      <div className="workspace">
        <aside className="search-panel" aria-label="Hasil pencarian">
          <div className="panel-heading"><div><span>Direktori</span><strong>Lokasi terminal</strong></div><small>{visibleSpaces.length} hasil</small></div>
          <div className="result-list">
            {visibleSpaces.length ? visibleSpaces.map((space) => (
              <button key={space.id} type="button" className="result-row" data-active={space.id === selected?.id} onClick={() => selectSpace(space)}>
                <span className="result-icon"><MapPin size={17} /></span>
                <span className="result-copy"><strong>{space.tenant?.name ?? space.label}</strong><small>{space.label} • {space.code}</small></span>
                <span className="result-floor">{space.floorId.endsWith("L1") ? "L1" : "L2"}<ChevronRight size={15} /></span>
              </button>
            )) : <div className="empty-state"><Search size={24} /><strong>Lokasi tidak ditemukan</strong><span>Coba kata kunci atau kategori lain.</span></div>}
          </div>
          <p className="data-notice"><AlertTriangle size={15} /> {DEMO_DATA_NOTICE}</p>
        </aside>

        <MapStage terminal={store.terminal} floorId={store.floorId} spaces={visibleSpaces} selectedId={store.selectedSpaceId} route={store.route} fromId={store.fromNodeId} toId={store.toNodeId} currentId={store.currentNodeId} onSelect={selectSpace} />

        {(selected || store.routeStatus !== "idle") && (
          <aside className="detail-sheet" aria-label={store.routeStatus === "idle" ? "Detail lokasi" : "Detail rute"}>
            <button type="button" className="sheet-close" onClick={() => { store.selectSpace(null); store.clearRoute(); }} aria-label="Tutup panel"><X size={20} /></button>
            {store.routeStatus === "idle" && selected && (
              <>
                <span className="space-code">{selected.code}</span>
                <h1>{selected.tenant?.name ?? selected.label}</h1>
                {selected.tenant && <p className="space-subtitle">{selected.label}</p>}
                <p>{selected.description}</p>
                <dl className="detail-facts">
                  <div><dt>Status</dt><dd>{selected.status === "ACTIVE" ? "Buka" : "Tutup sementara"}</dd></div>
                  <div><dt>Jam</dt><dd>{selected.tenant?.hours ?? "Perlu data resmi"}</dd></div>
                  <div><dt>Lantai</dt><dd>{selected.floorId.endsWith("L1") ? "Lantai 1" : "Lantai 2"}</dd></div>
                </dl>
                <button type="button" className="primary-action" onClick={() => startDirections(selected)} disabled={selected.status !== "ACTIVE"}><Navigation size={19} /> Mulai petunjuk arah <ChevronRight size={17} /></button>
              </>
            )}
            {store.routeStatus !== "idle" && (
              <>
                <span className="space-code">Navigasi aktif</span>
                <h1>Petunjuk arah</h1>
                <label className="route-field"><span>Dari</span><select value={store.fromNodeId ?? ""} onChange={(event) => { store.setFromNodeId(event.target.value); if (store.toNodeId) computeRoute(event.target.value, store.toNodeId); }}>
                  {terminalSpaces.map((space) => <option key={space.id} value={space.anchorNodeId}>{space.tenant?.name ?? space.label}</option>)}
                </select></label>
                <label className="route-field"><span>Ke</span><select value={store.toNodeId ?? ""} onChange={(event) => { store.setToNodeId(event.target.value); if (store.fromNodeId) computeRoute(store.fromNodeId, event.target.value); }}>
                  {terminalSpaces.map((space) => <option key={space.id} value={space.anchorNodeId}>{space.tenant?.name ?? space.label}</option>)}
                </select></label>
                {store.routeStatus === "ready" && store.route ? (
                  <>
                    <div className="route-metrics">
                      <div><Ruler size={19} /><strong>{store.route.totalDistanceMeters} m</strong><span>Jarak</span></div>
                      <div><Clock3 size={19} /><strong>Sekitar {store.route.estimatedMinutes} mnt</strong><span>Waktu jalan</span></div>
                    </div>
                    <div className="route-progress" aria-label="Ringkasan rute">
                      <div><span>A</span><p><small>Mulai dari</small><strong>{routeFrom?.tenant?.name ?? routeFrom?.label ?? "Pintu masuk"}</strong></p></div>
                      <div><span>B</span><p><small>Tujuan</small><strong>{routeTo?.tenant?.name ?? routeTo?.label ?? "Lokasi tujuan"}</strong></p></div>
                    </div>
                    {routeFloorIds.length > 1 && <div className="route-floor-tabs">{routeFloorIds.map((id) => <button key={id} type="button" aria-pressed={store.floorId === id} onClick={() => store.setFloorId(id)}>{id.endsWith("L1") ? "Lantai 1" : "Lantai 2"}</button>)}</div>}
                    {store.route.connectorInstructions.map((instruction) => <p key={instruction} className="connector-note"><Navigation size={17} /> {instruction}</p>)}
                  </>
                ) : <div className="empty-state no-route"><AlertTriangle size={24} /><strong>Rute tidak tersedia</strong><span>Coba titik asal lain. Jalur tertutup atau bukan akses publik tidak digunakan.</span></div>}
              </>
            )}
          </aside>
        )}
      </div>
      </main>
      <SiteFooter />
    </div>
  );
}
