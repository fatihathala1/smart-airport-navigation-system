"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const [activeLogo, setActiveLogo] = useState(0);

  useEffect(() => {
    const logoTimer = setInterval(() => setActiveLogo((logo) => (logo === 0 ? 1 : 0)), 1400);
    const fadeTimer = setTimeout(() => setFading(true), 3000);
    const hideTimer = setTimeout(() => setVisible(false), 3600);

    return () => {
      clearInterval(logoTimer);
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-label="Memuat Juanda Airport Wayfinding"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a1628",
        transition: "opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? "none" : "all",
      }}
    >
      {/* Subtle radial glow behind logo */}
      <div
        style={{
          position: "absolute",
          width: "620px",
          height: "620px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%)",
          animation: "splash-glow 2s ease-in-out infinite alternate",
        }}
      />

      {/* Logo */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "48px",
          animation: "splash-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) both",
        }}
      >
        <div style={{ position: "relative", width: "min(78vw, 460px)", height: "180px" }}>
          <Image
            src="/injourney-airports-white.png"
            fill
            priority
            alt="InJourney Airports"
            style={{ objectFit: "contain", opacity: activeLogo === 0 ? 1 : 0, transition: "opacity 0.45s ease" }}
          />
          <Image
            src="/Logo-ToDjuanda/Logo-Text-White.svg"
            fill
            priority
            alt="Juanda Airport"
            style={{ objectFit: "contain", opacity: activeLogo === 1 ? 1 : 0, transition: "opacity 0.45s ease" }}
          />
        </div>

        {/* Minimal loading dots */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                width: "5px",
                height: "5px",
                borderRadius: "50%",
                background: "rgba(125, 211, 252, 0.7)",
                display: "block",
                animation: `splash-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes splash-in {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes splash-glow {
          from { opacity: 0.5; transform: scale(0.95); }
          to   { opacity: 1;   transform: scale(1.05); }
        }
        @keyframes splash-dot {
          0%, 100% { opacity: 0.25; transform: scaleY(0.6); }
          50%       { opacity: 1;    transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}
