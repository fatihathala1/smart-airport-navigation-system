import type { Metadata } from "next";
import { HelpPage } from "@/components/wayfinding/HelpPage";

export const metadata: Metadata = {
  title: "Panduan Penggunaan | Juanda Airport Wayfinding",
  description: "Panduan langkah demi langkah untuk mencari lokasi, menetapkan titik awal, dan mengikuti rute di peta Juanda.",
};

export default function Page() {
  return <HelpPage />;
}
