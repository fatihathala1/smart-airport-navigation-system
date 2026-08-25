"use client";

import { useEffect, useRef } from "react";
import { Layers3, LocateFixed, Minus, Plus } from "lucide-react";
import { terminals, routeNodes } from "@/data/demo-wayfinding";
import type { DijkstraResult, MapSpace, TerminalCode } from "@/types";
import { BaseMapLayer } from "@/components/map-layers/BaseMapLayer";
import { MarkerLayer } from "@/components/map-layers/MarkerLayer";
import { POILayer } from "@/components/map-layers/POILayer";
import { RouteLayer } from "@/components/map-layers/RouteLayer";
import { SpaceLayer } from "@/components/map-layers/SpaceLayer";

export function MapStage({ terminal, floorId, spaces, selectedId, route, fromId, toId, currentId, onSelect }: {
  terminal: TerminalCode; floorId: string; spaces: MapSpace[]; selectedId: string | null; route: DijkstraResult | null; fromId: string | null; toId: string | null; currentId: string | null; onSelect: (space: MapSpace) => void;
}) {
  const layerRef = useRef<SVGGElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const transformRef = useRef({ x: 0, y: 0, scale: 1 });
  const dragRef = useRef<{ pointerId: number; x: number; y: number; originX: number; originY: number } | null>(null);
  const applyTransform = () => {
    const value = transformRef.current;
    layerRef.current?.setAttribute("transform", `translate(${value.x} ${value.y}) scale(${value.scale})`);
  };

  const clientToMap = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    const matrix = svg?.getScreenCTM();
    if (!svg || !matrix) return { x: 500, y: 350 };
    const point = svg.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    return point.matrixTransform(matrix.inverse());
  };

  const zoom = (delta: number, focus = { x: 500, y: 350 }) => {
    const current = transformRef.current;
    const nextScale = Math.min(2.8, Math.max(1, current.scale + delta));
    const ratio = nextScale / current.scale;
    transformRef.current = {
      x: focus.x - (focus.x - current.x) * ratio,
      y: focus.y - (focus.y - current.y) * ratio,
      scale: nextScale,
    };
    applyTransform();
  };
  const reset = () => { transformRef.current = { x: 0, y: 0, scale: 1 }; applyTransform(); };

  useEffect(() => {
    transformRef.current = { x: 0, y: 0, scale: 1 };
    layerRef.current?.setAttribute("transform", "translate(0 0) scale(1)");
  }, [terminal, floorId]);

  useEffect(() => {
    if (!selectedId || route) return;
    const selected = spaces.find((space) => space.id === selectedId);
    if (!selected?.mapPoint) return;
    const scale = 1.65;
    transformRef.current = {
      x: 500 - selected.mapPoint.x * scale,
      y: 350 - selected.mapPoint.y * scale,
      scale,
    };
    applyTransform();
  }, [route, selectedId, spaces]);

  useEffect(() => {
    const points = route?.nodes.filter((node) => node.floorId === floorId) ?? [];
    if (points.length < 2) return;
    const minX = Math.min(...points.map((point) => point.x));
    const maxX = Math.max(...points.map((point) => point.x));
    const minY = Math.min(...points.map((point) => point.y));
    const maxY = Math.max(...points.map((point) => point.y));
    const scale = Math.min(2.35, Math.max(1, Math.min(780 / Math.max(180, maxX - minX), 360 / Math.max(120, maxY - minY))));
    transformRef.current = {
      x: 500 - ((minX + maxX) / 2) * scale,
      y: 350 - ((minY + maxY) / 2) * scale,
      scale,
    };
    applyTransform();
  }, [floorId, route]);
  const visibleNodes = routeNodes.filter((node) => node.floorId === floorId);
  const terminalMap = terminals.find((item) => item.code === terminal)!;
  const floorMap = terminalMap.floorMaps[floorId];
  return (
    <section className="map-stage" aria-label="Peta interaktif terminal">
      <div className="map-context">
        <span><Layers3 size={14} /> Peta terminal</span>
        <strong>{terminalMap.name} <i /> {floorId.endsWith("L1") ? "Lantai 1" : "Lantai 2"}</strong>
      </div>
      <svg
        ref={svgRef}
        viewBox="0 0 1000 700"
        preserveAspectRatio="xMidYMid slice"
        role="application"
        aria-label="Gunakan sentuhan atau mouse untuk menggeser dan memperbesar peta"
        onWheel={(event) => { event.preventDefault(); zoom(event.deltaY > 0 ? -0.14 : 0.14, clientToMap(event.clientX, event.clientY)); }}
        onPointerDown={(event) => { if ((event.target as Element).closest(".map-space, .map-poi")) return; event.currentTarget.setPointerCapture(event.pointerId); const point = clientToMap(event.clientX, event.clientY); const t = transformRef.current; dragRef.current = { pointerId: event.pointerId, x: point.x, y: point.y, originX: t.x, originY: t.y }; }}
        onPointerMove={(event) => { const drag = dragRef.current; if (!drag || drag.pointerId !== event.pointerId) return; const point = clientToMap(event.clientX, event.clientY); transformRef.current.x = drag.originX + (point.x - drag.x); transformRef.current.y = drag.originY + (point.y - drag.y); applyTransform(); }}
        onPointerUp={(event) => { if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null; }}
        onPointerCancel={() => { dragRef.current = null; }}
      >
        <g ref={layerRef}>
          <BaseMapLayer
            asset={floorMap.asset}
            label={`${terminal} ${floorId}`}
            imageWidth={floorMap.imageWidth}
            imageHeight={floorMap.imageHeight}
            crop={floorMap.crop}
          />
          <SpaceLayer spaces={spaces} selectedId={selectedId} onSelect={onSelect} />
          <RouteLayer route={route} floorId={floorId} />
          <POILayer spaces={spaces} nodes={visibleNodes} selectedId={selectedId} onSelect={onSelect} />
          <MarkerLayer nodes={visibleNodes} routeNodes={route?.nodes.filter((node) => node.floorId === floorId)} fromId={fromId} toId={toId} currentId={currentId} />
        </g>
      </svg>
      <div className="map-controls" aria-label="Kontrol peta">
        <button type="button" onClick={() => zoom(0.2)} aria-label="Perbesar peta"><Plus size={20} /></button>
        <button type="button" onClick={() => zoom(-0.2)} aria-label="Perkecil peta"><Minus size={20} /></button>
        <button type="button" onClick={reset} aria-label="Atur ulang posisi peta"><LocateFixed size={20} /></button>
      </div>
      <div className="map-color-key" aria-label="Arti warna bangunan">
        <span><i style={{ background: "#8e9091" }} /> Kantor</span>
        <span><i style={{ background: "#d89a0b" }} /> Makanan & minuman</span>
        <span><i style={{ background: "#dd0fc9" }} /> Toko pakaian</span>
        <span><i style={{ background: "#0f9a55" }} /> Mushola</span>
      </div>
      <div className="map-legend" aria-label="Legenda peta"><span><i className="legend-route" /> Rute</span><span><i className="legend-poi" /> Lokasi</span></div>
    </section>
  );
}
