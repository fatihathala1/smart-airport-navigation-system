"use client";

import { useRef, useState } from "react";
import {
  Play,
  Clock,
  Volume2,
  VolumeX,
} from "lucide-react";
import styles from "./WayfindingVideoTutorial.module.css";

interface WayfindingVideoTutorialProps {
  videoUrl?: string;
  posterUrl?: string;
}

export function WayfindingVideoTutorial({
  videoUrl = "",
  posterUrl = "/bg-journey.jpg",
}: WayfindingVideoTutorialProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  function handlePlay() {
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
          Pahami navigasi sebelum <span className="vts-title-accent">mulai berjalan.</span>
        </h2>
        <p>
          Pelajari cara mencari lokasi, menetapkan titik awal, dan mengikuti rute di Terminal Juanda melalui demonstrasi singkat ini.
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
              >
                {/* Top badges */}
                <div className="vts-poster-topbar">
                  <span className="vts-badge-hd">HD 1080p</span>
                  <span className="vts-badge-dur">
                    <Clock size={11} />
                    01:30 Mnt
                  </span>
                </div>

                {/* Center play */}
                <div className="vts-play-ring">
                  <div className="vts-play-btn" title="Putar Video Tutorial">
                    <Play size={36} style={{ marginLeft: 4, color: "#fff" }} />
                  </div>
                </div>

                {/* Bottom caption */}
                <div className="vts-poster-caption">
                  <h3>Panduan Lengkap Navigasi Wayfinding</h3>
                  <p>Klik untuk memutar video tutorial interaktif</p>
                </div>
              </div>
            )}
          </div>

          {/* Meta bar */}
          <div className="vts-meta-bar">
            <div className="vts-meta-left">
              <div className="vts-meta-icon-dot" />
              <span>Tutorial Resmi Navigasi Bandara Juanda</span>
            </div>
            <div className="vts-meta-right">
              <button
                type="button"
                className="vts-mute-btn"
                onClick={() => {
                  const next = !isMuted;
                  setIsMuted(next);
                  if (videoRef.current) videoRef.current.muted = next;
                }}
                title={isMuted ? "Aktifkan Suara" : "Matikan Suara"}
              >
                {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                <span>{isMuted ? "Mute" : "Audio On"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
