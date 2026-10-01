"use client";

import dynamic from "next/dynamic";

const AirportWayfinding = dynamic(
  () => import("./AirportWayfinding").then((module) => module.AirportWayfinding),
  {
    ssr: false,
    loading: () => <main className="map3d-loading" role="status">Memuat peta 3D Terminal 1...</main>,
  },
);

export function Map3DClient() {
  return (
    <div className="map3d-root">
      <AirportWayfinding />
    </div>
  );
}
