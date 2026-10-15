import type { Metadata } from "next";
import Providers from "@/components/providers";
import { SplashScreen } from "@/components/wayfinding/SplashScreen";
import "./globals.css";
import "@/components/map3d/viewer.css";

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
    <html lang="id" className="antialiased">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                if (typeof Element !== 'undefined') {
                  const origRelease = Element.prototype.releasePointerCapture;
                  if (origRelease) {
                    Element.prototype.releasePointerCapture = function(pointerId) {
                      try {
                        if (typeof this.hasPointerCapture === 'function' && !this.hasPointerCapture(pointerId)) return;
                        origRelease.call(this, pointerId);
                      } catch (e) {}
                    };
                  }
                }
                window.addEventListener('error', function(e) {
                  if (e && e.message && e.message.indexOf('releasePointerCapture') !== -1) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                  }
                }, true);
              }
            `,
          }}
        />
      </head>
      <body>
        <SplashScreen />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
