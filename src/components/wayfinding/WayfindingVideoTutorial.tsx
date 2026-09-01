"use client";

import { useEffect, useRef, useState } from "react";
import {
  Film,
  Play,
  Clock,
  Volume2,
  VolumeX,
  Sparkles,
} from "lucide-react";

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.unobserve(el); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

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

  const { ref: headingRef, inView: headingInView } = useInView(0.2);
  const { ref: playerRef, inView: playerInView } = useInView(0.1);

  function handlePlay() {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
    setIsPlaying(true);
  }

  return (
    <section className="vts-section" id="video-tutorial" aria-labelledby="vts-title">
      <div className="vts-bg-grid" />
      <div className="vts-orb vts-orb-1" />
      <div className="vts-orb vts-orb-2" />

      {/* Header */}
      <div
        ref={headingRef}
        className="vts-header"
        style={{
          opacity: headingInView ? 1 : 0,
          transform: headingInView ? "translateY(0)" : "translateY(36px)",
          transition: "opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <div className="vts-eyebrow">
          <Film size={13} />
          <span>VIDEO PANDUAN LANGSUNG</span>
        </div>
        <h2 id="vts-title">
          Video Tutorial Navigasi <span className="vts-title-accent">Wayfinding</span>
        </h2>
        <p>
          Saksikan demonstrasi singkat berikut untuk memahami cara bernavigasi di Bandara Juanda secara cepat dan efisien.
        </p>
      </div>

      {/* Full-width video player */}
      <div
        ref={playerRef}
        className="vts-full-player-wrap"
        style={{
          opacity: playerInView ? 1 : 0,
          transform: playerInView ? "translateY(0)" : "translateY(40px)",
          transition: "opacity 0.8s cubic-bezier(0.16,1,0.3,1) 100ms, transform 0.8s cubic-bezier(0.16,1,0.3,1) 100ms",
        }}
      >
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
                  backgroundImage: `linear-gradient(160deg, rgba(8,15,27,0.2) 0%, rgba(8,15,27,0.78) 100%), url('${posterUrl}')`,
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
