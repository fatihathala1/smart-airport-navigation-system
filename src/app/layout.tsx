import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Providers from "@/components/providers";
import { SplashScreen } from "@/components/wayfinding/SplashScreen";
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
  icons: {
    icon: [
      { url: "/Logo-ToDjuanda/Logo.png", type: "image/png" },
    ],
    apple: [
      { url: "/Logo-ToDjuanda/Logo.png", type: "image/png" },
    ],
    shortcut: "/Logo-ToDjuanda/Logo.png",
  },
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
        <SplashScreen />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
