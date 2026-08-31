import { Suspense } from "react";
import { FullMapShell } from "@/components/wayfinding/FullMapShell";

export const metadata = {
  title: "Peta Interaktif Terminal | Juanda Airport Wayfinding",
  description: "Peta interaktif full screen Terminal 1 & 2 Bandara Internasional Juanda.",
};

export default function MapPage() {
  return (
    <Suspense fallback={<main className="map-skeleton" aria-label="Memuat peta full screen"><div /><div /><div /></main>}>
      <FullMapShell />
    </Suspense>
  );
}
