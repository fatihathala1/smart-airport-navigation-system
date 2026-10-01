import { Map3DClient } from "@/components/map3d/Map3DClient";
import { SiteHeader } from "@/components/site/SiteHeader";

export const metadata = {
  title: "Peta 3D Terminal 1 | Juanda Airport Wayfinding",
  description: "Peta 3D dan navigasi Terminal 1 lantai dasar Bandara Internasional Juanda.",
};

export default function MapPage() {
  return (
    <>
      <SiteHeader />
      <Map3DClient />
    </>
  );
}
