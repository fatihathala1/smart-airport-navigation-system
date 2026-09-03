"use client";

import { useEffect, useRef } from "react";
import { terminals, routeNodes } from "@/data/demo-wayfinding";
import type { DijkstraResult, MapSpace, TerminalCode } from "@/types";
import { BaseMapLayer } from "@/components/map-layers/BaseMapLayer";
import { MarkerLayer } from "@/components/map-layers/MarkerLayer";
import { POILayer } from "@/components/map-layers/POILayer";
import { RouteLayer } from "@/components/map-layers/RouteLayer";
import { SpaceLayer } from "@/components/map-layers/SpaceLayer";
import { useMapStore } from "@/store/mapStore";

export function MapStage({
  terminal,
  floorId,
  spaces,
  selectedId,
  route,
  fromId,
  toId,
  currentId,
  onSelect,
  overview = false,
}: {
  terminal: TerminalCode;
  floorId: string;
  spaces: MapSpace[];
  selectedId: string | null;
  route: DijkstraResult | null;
  fromId: string | null;
  toId: string | null;
  currentId: string | null;
  onSelect: (space: MapSpace) => void;
  overview?: boolean;
}) {
  const lang = useMapStore((state) => state.lang);
  const layerRef = useRef<SVGGElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const transformRef = useRef(
    overview
      ? { x: 310, y: 217, scale: 0.38 }
      : { x: 0, y: 0, scale: 1.2 }
  );
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
    const nextScale = Math.min(12.0, Math.max(0.1, current.scale + delta));
    const ratio = nextScale / current.scale;
    transformRef.current = {
      x: focus.x - (focus.x - current.x) * ratio,
      y: focus.y - (focus.y - current.y) * ratio,
      scale: nextScale,
    };
    applyTransform();
  };

  // Reset transform when terminal or floor changes
  useEffect(() => {
    const initialView = overview
      ? { x: 310, y: 217, scale: 0.38 }
      : { x: 0, y: 0, scale: 1.2 };
    transformRef.current = initialView;
    layerRef.current?.setAttribute(
      "transform",
      `translate(${initialView.x} ${initialView.y}) scale(${initialView.scale})`
    );
  }, [terminal, floorId, overview]);

  // Listen for pan-to events (e.g. from "Where Am I?" button)
  useEffect(() => {
    const handlePanTo = (event: Event) => {
      const { x, y, scale: targetScale } = (event as CustomEvent<{ x: number; y: number; scale: number }>).detail;
      const s = Math.min(12, Math.max(0.1, targetScale));
      transformRef.current = {
        x: 500 - x * s,
        y: 350 - y * s,
        scale: s,
      };
      applyTransform();
    };
    window.addEventListener("wayfinding:pan-to", handlePanTo);
    return () => window.removeEventListener("wayfinding:pan-to", handlePanTo);
  }, []);

  // Pan to selected space
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

  // Fit route in view
  useEffect(() => {
    const points = route?.nodes.filter((node) => node.floorId === floorId) ?? [];
    if (points.length < 2) return;
    const minX = Math.min(...points.map((point) => point.x));
    const maxX = Math.max(...points.map((point) => point.x));
    const minY = Math.min(...points.map((point) => point.y));
    const maxY = Math.max(...points.map((point) => point.y));
    const scale = Math.min(
      2.35,
      Math.max(1, Math.min(780 / Math.max(180, maxX - minX), 360 / Math.max(120, maxY - minY)))
    );
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
    <section className="map-stage" aria-label={lang === "ID" ? "Peta interaktif terminal" : "Interactive terminal map"}>
      <svg
        ref={svgRef}
        viewBox="0 0 1000 700"
        preserveAspectRatio="xMidYMid slice"
        role="application"
        aria-label={lang === "ID" ? "Gunakan sentuhan atau mouse untuk menggeser dan memperbesar peta" : "Use touch or a mouse to move and zoom the map"}
        onWheel={(event) => {
          event.preventDefault();
          zoom(event.deltaY > 0 ? -0.25 : 0.25, clientToMap(event.clientX, event.clientY));
        }}
        onPointerDown={(event) => {
          if ((event.target as Element).closest(".map-space, .map-poi")) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          const point = clientToMap(event.clientX, event.clientY);
          const t = transformRef.current;
          dragRef.current = {
            pointerId: event.pointerId,
            x: point.x,
            y: point.y,
            originX: t.x,
            originY: t.y,
          };
        }}
        onPointerMove={(event) => {
          const drag = dragRef.current;
          if (!drag || drag.pointerId !== event.pointerId) return;
          const point = clientToMap(event.clientX, event.clientY);
          transformRef.current.x = drag.originX + (point.x - drag.x);
          transformRef.current.y = drag.originY + (point.y - drag.y);
          applyTransform();
        }}
        onPointerUp={(event) => {
          if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
        }}
        onPointerCancel={() => {
          dragRef.current = null;
        }}
      >
        <g ref={layerRef}>
          <BaseMapLayer
            asset={floorMap.asset}
            label={`${terminal} ${floorId}`}
            imageWidth={floorMap.imageWidth}
            imageHeight={floorMap.imageHeight}
            crop={floorMap.crop}
          />
          <SpaceLayer spaces={spaces} selectedId={selectedId} onSelect={onSelect} lang={lang} />
          <RouteLayer route={route} floorId={floorId} />
          <POILayer spaces={spaces} nodes={visibleNodes} selectedId={selectedId} onSelect={onSelect} lang={lang} />
          <MarkerLayer
            nodes={visibleNodes}
            routeNodes={route?.nodes.filter((node) => node.floorId === floorId)}
            fromId={fromId}
            toId={toId}
            currentId={currentId}
          />
        </g>
      </svg>
    </section>
  );
}
