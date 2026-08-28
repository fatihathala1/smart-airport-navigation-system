import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Providers from "@/components/providers";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Juanda Airport Wayfinding | InJourney Airports",
  description: "Navigasi dalam ruangan Terminal 1 dan Terminal 2 Bandara Internasional Juanda.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${poppins.variable} antialiased`}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
