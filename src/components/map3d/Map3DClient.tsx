"use client";

import dynamic from "next/dynamic";
import { useMapStore } from "@/store/mapStore";

const AirportWayfinding = dynamic(
  () => import("./AirportWayfinding").then((module) => module.AirportWayfinding),
  {
    ssr: false,
    loading: () => <main className="map3d-loading" role="status">Memuat peta 3D Terminal 1...</main>,
  },
);

export function Map3DClient() {
  const lang = useMapStore((state) => state.lang);
  return (
    <div className="map3d-root">
      <AirportWayfinding />
      <span className="sr-only" aria-live="polite">{lang === "EN" ? "Map interface language: English" : "Bahasa antarmuka peta: Indonesia"}</span>
    </div>
  );
}
