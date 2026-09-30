"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Play,
  Clock,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useMapStore } from "@/store/mapStore";
import styles from "./WayfindingVideoTutorial.module.css";

interface WayfindingVideoTutorialProps {
  videoUrl?: string;
  posterUrl?: string;
}

export function WayfindingVideoTutorial({
  videoUrl = "",
  posterUrl = "/bg-journey.jpg",
}: WayfindingVideoTutorialProps) {
  const lang = useMapStore((state) => state.lang);
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  function handlePlay() {
    if (!videoUrl) {
      router.push("/help");
      return;
    }
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
    setIsPlaying(true);
  }

  return (
    <section
      className={`vts-section ${styles.root}`}
      id="video-tutorial"
      aria-labelledby="vts-title"
      data-lift-window
      data-scroll-reveal
    >
      <div className="vts-bg-grid" />
      <div className="vts-orb vts-orb-1" />
      <div className="vts-orb vts-orb-2" />

      {/* Header */}
      <div className="vts-header" data-reveal-child>
        <span className="vts-heading-mark" aria-hidden="true" />
        <h2 id="vts-title">
          {lang === "ID" ? (
            <>Pahami navigasi sebelum <span className="vts-title-accent">mulai berjalan.</span></>
          ) : (
            <>Learn the route before <span className="vts-title-accent">you start walking.</span></>
          )}
        </h2>
        <p>
          {lang === "ID"
            ? "Pelajari cara mencari lokasi, menetapkan titik awal, dan mengikuti rute melalui panduan interaktif."
            : "Learn how to find a place, set your starting point, and follow a route with the interactive guide."}
        </p>
      </div>

      {/* Full-width video player */}
      <div className="vts-full-player-wrap" data-reveal-child>
        <div className="vts-player-card">
          {/* Video Viewport */}
          <div className="vts-viewport">
            {videoUrl && (
              <video
                ref={videoRef}
                src={videoUrl}
                poster={posterUrl}
                controls={isPlaying}
                playsInline
                muted={isMuted}
                onPause={() => setIsPlaying(false)}
                className="vts-video-el"
              />
            )}

            {/* Poster Overlay */}
            {!isPlaying && (
              <div
                className="vts-poster"
                style={{
                  backgroundImage: `linear-gradient(160deg, rgba(9,28,42,0.18) 0%, rgba(6,19,30,0.82) 100%), url('${posterUrl}')`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
                onClick={handlePlay}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && handlePlay()}
                aria-label={videoUrl ? (lang === "ID" ? "Putar video tutorial" : "Play tutorial video") : (lang === "ID" ? "Buka halaman panduan" : "Open help guide")}
              >
                {/* Top badges */}
                <div className="vts-poster-topbar">
                  <span className="vts-badge-hd">{videoUrl ? "HD 1080p" : (lang === "ID" ? "PANDUAN INTERAKTIF" : "INTERACTIVE GUIDE")}</span>
                  <span className="vts-badge-dur"><Clock size={11} />{videoUrl ? "01:30" : (lang === "ID" ? "±2 menit" : "about 2 min")}</span>
                </div>

                {/* Center play */}
                <div className="vts-play-ring">
                  <div className="vts-play-btn" aria-hidden="true">
                    {videoUrl ? <Play size={36} style={{ marginLeft: 4, color: "#fff" }} /> : <ArrowRight size={36} color="#fff" />}
                  </div>
                </div>

                {/* Bottom caption */}
                <div className="vts-poster-caption">
                  <h3>{lang === "ID" ? "Panduan Lengkap Navigasi Wayfinding" : "Complete Airport Navigation Guide"}</h3>
                  <p>{videoUrl ? (lang === "ID" ? "Klik untuk memutar video tutorial" : "Click to play the tutorial") : (lang === "ID" ? "Buka panduan langkah demi langkah" : "Open the step-by-step guide")}</p>
                </div>
              </div>
            )}
          </div>

          {/* Meta bar */}
          <div className="vts-meta-bar">
            <div className="vts-meta-left">
              <div className="vts-meta-icon-dot" />
              <span>{lang === "ID" ? "Panduan penggunaan peta" : "Map usage guide"}</span>
            </div>
            {videoUrl && <div className="vts-meta-right">
              <button
                type="button"
                className="vts-mute-btn"
                onClick={() => {
                  const next = !isMuted;
                  setIsMuted(next);
                  if (videoRef.current) videoRef.current.muted = next;
                }}
                title={isMuted
                  ? (lang === "ID" ? "Aktifkan suara" : "Turn sound on")
                  : (lang === "ID" ? "Matikan suara" : "Turn sound off")}
              >
                {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                <span>{isMuted
                  ? (lang === "ID" ? "Senyap" : "Muted")
                  : (lang === "ID" ? "Suara aktif" : "Sound on")}</span>
              </button>
            </div>}
          </div>
        </div>
      </div>
    </section>
  );
}
