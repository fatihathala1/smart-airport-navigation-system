"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Navigation } from "lucide-react";
import { useMapStore } from "@/store/mapStore";

export function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const lang = useMapStore((s) => s.lang);

  useEffect(() => {
    // 1.2s loading state then 0.4s fade out
    const timer = setTimeout(() => {
      setFading(true);
      const hideTimer = setTimeout(() => setVisible(false), 400);
      return () => clearTimeout(hideTimer);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #142328 0%, #1a323a 60%, #005b64 100%)",
        color: "#ffffff",
        transition: "opacity 0.4s ease, transform 0.4s ease",
        opacity: fading ? 0 : 1,
        transform: fading ? "scale(1.03)" : "scale(1)",
        pointerEvents: fading ? "none" : "all",
      }}
    >
      <div style={{ textAlign: "center", padding: "24px", maxWidth: "420px" }}>
        <div
          style={{
            display: "inline-flex",
            padding: "16px 24px",
            borderRadius: "20px",
            background: "rgba(255, 255, 255, 0.96)",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
            marginBottom: "24px",
          }}
        >
          <Image
            src="/injourney-airports.png"
            width={180}
            height={60}
            priority
            alt="InJourney Airports"
            style={{ objectFit: "contain" }}
          />
        </div>

        <h1
          style={{
            margin: "0 0 8px",
            fontSize: "22px",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "#ffffff",
          }}
        >
          {lang === "ID" ? "JUA Indoor Wayfinding" : "JUA Indoor Wayfinding"}
        </h1>
        <p
          style={{
            margin: "0 0 28px",
            fontSize: "13px",
            color: "#9eb4ba",
            fontWeight: 500,
          }}
        >
          {lang === "ID"
            ? "Bandara Internasional Juanda — Terminal 1 & 2"
            : "Juanda International Airport — Terminal 1 & 2"}
        </p>

        {/* Loading Progress Animation Bar */}
        <div
          style={{
            width: "100%",
            height: "4px",
            borderRadius: "999px",
            background: "rgba(255, 255, 255, 0.15)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: "100%",
              background: "linear-gradient(90deg, #00a8bd, #00e0fb)",
              animation: "splash-bar 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            marginTop: "16px",
            fontSize: "11px",
            color: "#00a8bd",
            fontWeight: 700,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          <Navigation size={14} className="animate-spin" />
          <span>
            {lang === "ID" ? "Memuat Peta Vector 2D..." : "Loading 2D Vector Map..."}
          </span>
        </div>
      </div>

      <style jsx global>{`
        @keyframes splash-bar {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(0%);
          }
        }
      `}</style>
    </div>
  );
}
