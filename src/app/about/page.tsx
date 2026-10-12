import type { Metadata } from "next";
import { AboutPage } from "@/components/wayfinding/AboutPage";

export const metadata: Metadata = {
  title: "Tentang Kami | Juanda Airport Wayfinding & Digital Twin",
  description:
    "Tentang ToDjuanda — Sistem Navigasi Cerdas & Indoor Wayfinding 3D Berbasis Web untuk Bandar Udara Internasional Juanda (SUB) InJourney Airports.",
};

export default function Page() {
  return <AboutPage />;
}
