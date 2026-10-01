import type { Metadata } from "next";
import { HelpPage } from "@/components/wayfinding/HelpPage";

export const metadata: Metadata = {
  title: "Panduan Penggunaan | Juanda Airport Wayfinding",
  description: "Panduan menggunakan peta Juanda dan alur penumpang dari area Departure, check-in, lantai 2, hingga gate dan pesawat.",
};

export default function Page() {
  return <HelpPage />;
}
