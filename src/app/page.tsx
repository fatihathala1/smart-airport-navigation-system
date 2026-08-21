import { Suspense } from "react";
import { WayfindingShell } from "@/components/wayfinding/WayfindingShell";

export default function HomePage() {
  return <Suspense fallback={<main className="map-skeleton" aria-label="Memuat peta"><div /><div /><div /></main>}><WayfindingShell /></Suspense>;
}
