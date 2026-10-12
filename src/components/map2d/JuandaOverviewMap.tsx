"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import "leaflet/dist/leaflet.css";
import { JUANDA_CENTER, JUANDA_TERMINALS } from "@/lib/map2d/juanda-terminals";
import { useMapStore } from "@/store/mapStore";
import styles from "./JuandaOverviewMap.module.css";

const BASE_STYLE = { color: "#0369a1", weight: 2, fillColor: "#0ea5e9", fillOpacity: 0.35 };
const HOVER_STYLE = { color: "#fbbf24", weight: 3, fillColor: "#fbbf24", fillOpacity: 0.45 };

export function JuandaOverviewMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const lang = useMapStore((state) => state.lang);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let disposed = false;
    let cleanup = () => {};

    import("leaflet").then((L) => {
      if (disposed) return;
      const map = L.map(container, { center: JUANDA_CENTER, zoom: 16, scrollWheelZoom: false, zoomSnap: 0.25, zoomControl: true, attributionControl: true });

      const googleHybrid = L.tileLayer("https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}", {
        maxZoom: 20,
        subdomains: ["0", "1", "2", "3"],
        attribution: "&copy; Google Maps",
      });
      const googleStreet = L.tileLayer("https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
        maxZoom: 20,
        subdomains: ["0", "1", "2", "3"],
        attribution: "&copy; Google Maps",
      });
      googleHybrid.addTo(map);
      L.control.layers(
        {
          [lang === "ID" ? "Google Satelit" : "Google Satellite"]: googleHybrid,
          [lang === "ID" ? "Google Peta" : "Google Street"]: googleStreet,
        },
        {},
        { position: "topright" },
      ).addTo(map);

      const allBounds = L.latLngBounds([]);
      for (const terminal of JUANDA_TERMINALS) {
        const polygon = L.polygon(terminal.polygon, { ...BASE_STYLE, className: styles.terminal });
        polygon.bindTooltip(
          `<strong>${terminal.name}</strong><br/>${lang === "ID" ? "Klik untuk masuk peta 3D" : "Click to open the 3D map"}`,
          { permanent: true, direction: "top", className: styles.tooltip, offset: [0, -6] },
        );
        polygon.on("mouseover", () => polygon.setStyle(HOVER_STYLE));
        polygon.on("mouseout", () => polygon.setStyle(BASE_STYLE));
        if (terminal.href) {
          const href = terminal.href;
          polygon.on("click", () => router.push(href));
        }
        polygon.addTo(map);
        allBounds.extend(polygon.getBounds());
      }
      if (allBounds.isValid()) map.fitBounds(allBounds, { padding: [48, 64] });

      cleanup = () => map.remove();
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, [lang, router]);

  return <div ref={containerRef} className={styles.map} role="region" aria-label={lang === "ID" ? "Peta Bandara Juanda. Klik area Terminal 1 untuk membuka peta 3D." : "Juanda Airport map. Click Terminal 1 to open the 3D map."} />;
}
