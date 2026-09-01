"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Layers,
  Navigation,
  QrCode,
  Search,
  Sparkles,
  Zap,
} from "lucide-react";
import { useMapStore } from "@/store/mapStore";

interface WayfindingFullTutorialSectionProps {
  onOpenSearchModal?: () => void;
  onOpenQrModal?: () => void;
  onOpenHelpModal?: () => void;
}

function useInView(threshold = 0.12) {
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

/* Individual animated wrapper — accepts delay + slide direction */
function Reveal({
  children,
  delay = 0,
  from = "bottom",
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  from?: "left" | "right" | "bottom";
  style?: React.CSSProperties;
}) {
  const { ref, inView } = useInView(0.08);
  const offsets = { left: "translateX(-56px)", right: "translateX(56px)", bottom: "translateY(48px)" };
  return (
    <div
      ref={ref}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translate(0)" : offsets[from],
        transition: `opacity 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function WayfindingFullTutorialSection({
  onOpenSearchModal,
  onOpenQrModal,
  onOpenHelpModal,
}: WayfindingFullTutorialSectionProps) {
  const store = useMapStore();
  const { ref: headRef, inView: headInView } = useInView(0.2);

  const steps = [
    {
      num: "01",
      tag: "PENCARIAN & FILTER",
      title: "Temukan Gate, Toko, Resto, atau Musala",
      icon: Search,
      color: "#38bdf8",
      glow: "rgba(56,189,248,0.22)",
      gradient: "linear-gradient(135deg,#0284c7,#0369a1)",
      desc: "Cari lokasi spesifik dengan mengetik nama tenant atau pilih filter cepat. Klik langsung area ruangan di denah peta interaktif untuk detail lengkap.",
      bullets: [
        { label: "Pencarian Instan", text: "Ketik 'Gate 1', 'ATM', 'Kedai Madura', atau 'Mushola'." },
        { label: "Filter Kategori", text: "Kuliner • Retail • Layanan • Mushola • Fasilitas." },
        { label: "Info Detail Tempat", text: "Jam buka, status operasional, terminal & lantai." },
      ],
      cta: "Coba Pencarian",
      onCta: () => { if (onOpenSearchModal) onOpenSearchModal(); else store.setIsSearchOpen(true); },
    },
    {
      num: "02",
      tag: "POSITIONING PRESISI",
      title: "Scan QR Standee Fisik di Bandara",
      icon: QrCode,
      color: "#34d399",
      glow: "rgba(52,211,153,0.22)",
      gradient: "linear-gradient(135deg,#10b981,#059669)",
      desc: "Pindai QR Standee yang terpasang di tiang-tiang terminal untuk menetapkan posisi titik awal Anda secara otomatis dan akurat tanpa GPS.",
      bullets: [
        { label: "Scan Otomatis", text: "Kamera HP pindai kode QR fisik di dekat Anda." },
        { label: "Posisi Terkunci", text: "Lantai, terminal, dan koordinat otomatis terkunci." },
        { label: "Pilih Manual", text: "Alternatif: pilih titik awal dari daftar lokasi." },
      ],
      cta: "Simulasi Scan QR",
      onCta: () => { if (onOpenQrModal) onOpenQrModal(); },
    },
    {
      num: "03",
      tag: "NAVIGASI DIJKSTRA",
      title: "Rute Terpendek & Estimasi Waktu Jalan",
      icon: Navigation,
      color: "#fbbf24",
      glow: "rgba(251,191,36,0.22)",
      gradient: "linear-gradient(135deg,#f59e0b,#d97706)",
      desc: "Algoritma Dijkstra menemukan jalur tercepat dan terpendek. Garis rute bercahaya membimbing langkah demi langkah beserta estimasi menit perjalanan.",
      bullets: [
        { label: "Rute Presisi", text: "Garis animasi biru bercahaya mengikuti alur nyata." },
        { label: "Jarak & Durasi", text: "Total meter + perkiraan menit jalan kaki." },
        { label: "Reset Kapanpun", text: "Ganti tujuan atau reset peta kapan saja." },
      ],
      cta: "Panduan Interaktif",
      onCta: () => { if (onOpenHelpModal) onOpenHelpModal(); },
    },
    {
      num: "04",
      tag: "LINTAS LANTAI & FASILITAS",
      title: "Lift, Tangga & Akses Disabilitas",
      icon: Layers,
      color: "#c084fc",
      glow: "rgba(192,132,252,0.22)",
      gradient: "linear-gradient(135deg,#a855f7,#7c3aed)",
      desc: "Rute melintas lantai? Instruksi lift atau tangga muncul otomatis. Beralih tampilan L1/L2 dengan satu sentuhan dan temukan fasilitas publik terdekat.",
      bullets: [
        { label: "Transfer Lantai", text: "Instruksi otomatis: kapan naik Lift atau Tangga." },
        { label: "Toggle L1 / L2", text: "Beralih denah lantai dengan satu sentuhan." },
        { label: "Fasilitas Publik", text: "Toilet • Mushola • Child Care • Disabilitas." },
      ],
      cta: "Lihat Fasilitas",
      onCta: () => { window.scrollTo({ top: 0, behavior: "smooth" }); },
    },
  ];

  return (
    <section className="fts-section" id="panduan-lengkap" aria-labelledby="fts-title">
      {/* Ambient orb lights */}
      <div className="fts-orb fts-orb-1" />
      <div className="fts-orb fts-orb-2" />
      <div className="fts-orb fts-orb-3" />

      {/* ── Section Header ── */}
      <div
        ref={headRef}
        className="fts-header"
        style={{
          opacity: headInView ? 1 : 0,
          transform: headInView ? "translateY(0)" : "translateY(40px)",
          transition: "opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <div className="fts-eyebrow">
          <Sparkles size={12} />
          <span>PANDUAN LENGKAP PENGGUNAAN</span>
        </div>
        <h2 id="fts-title">
          Cara Kerja Sistem Navigasi<br />
          <span className="fts-title-accent">Bandara Juanda</span>
        </h2>
        <p>
          Pelajari seluruh fitur utama aplikasi wayfinding secara mendalam untuk memudahkan perjalanan prapenerbangan Anda.
        </p>
      </div>

      {/* ── Steps Zigzag ── */}
      <div className="fts-steps">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          /*
           *  idx 0 (Fitur 01): TEXT kiri  | VISUAL kanan
           *  idx 1 (Fitur 02): VISUAL kiri | TEXT kanan
           *  idx 2 (Fitur 03): TEXT kiri  | VISUAL kanan
           *  idx 3 (Fitur 04): VISUAL kiri | TEXT kanan
           */
          const textFirst = idx % 2 === 0; // even → text LEFT, odd → visual LEFT

          const TextPanel = (
            <Reveal from={textFirst ? "left" : "right"} delay={80}>
              <div className="fts-text-panel">
                {/* Step number + tag row */}
                <div className="fts-step-top">
                  <span
                    className="fts-step-num"
                    style={{ background: step.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
                  >
                    {step.num}
                  </span>
                  <span
                    className="fts-step-tag"
                    style={{ color: step.color, borderColor: `${step.color}45`, background: `${step.color}10` }}
                  >
                    {step.tag}
                  </span>
                </div>

                <h3 className="fts-step-title">{step.title}</h3>
                <p className="fts-step-desc">{step.desc}</p>

                {/* Feature bullets */}
                <ul className="fts-bullets">
                  {step.bullets.map((b, i) => (
                    <li key={i}>
                      <CheckCircle2 size={15} style={{ color: step.color, flexShrink: 0, marginTop: 2 }} />
                      <span>
                        <strong style={{ color: "#ffffff" }}>{b.label}:</strong>{" "}
                        <span style={{ color: "rgba(255,255,255,0.75)" }}>{b.text}</span>
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  type="button"
                  className="fts-cta-btn"
                  style={{ "--cta-color": step.color, "--cta-glow": step.glow } as React.CSSProperties}
                  onClick={step.onCta}
                >
                  <span>{step.cta}</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </Reveal>
          );

          const VisualPanel = (
            <Reveal from={textFirst ? "right" : "left"} delay={200}>
              <div
                className="fts-visual-card"
                style={{ boxShadow: `0 32px 80px ${step.glow}`, borderColor: `${step.color}30` }}
              >
                {/* Dot grid decoration */}
                <div className="fts-dot-grid" />

                {/* Glowing icon circle */}
                <div
                  className="fts-icon-ring"
                  style={{ background: step.gradient, boxShadow: `0 0 70px ${step.glow}` }}
                >
                  <Icon size={56} color="#fff" strokeWidth={1.4} />
                </div>

                {/* Feature number watermark */}
                <div
                  className="fts-visual-num"
                  style={{ background: step.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
                >
                  {step.num}
                </div>

                {/* Feature name */}
                <div className="fts-visual-label" style={{ color: step.color }}>
                  <Zap size={13} />
                  <span>{step.tag}</span>
                </div>
                <h4 className="fts-visual-title">{step.title}</h4>

                {/* Chips */}
                <div className="fts-chips">
                  {step.bullets.map((b, i) => (
                    <span key={i} className="fts-chip" style={{ color: step.color, borderColor: `${step.color}38`, background: `${step.color}0e` }}>
                      {b.label}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          );

          return (
            <div key={step.num} className="fts-row" data-even={textFirst}>
              {textFirst ? (
                <>
                  {/* Even idx: TEXT  LEFT — VISUAL RIGHT */}
                  <div className="fts-row-left">{TextPanel}</div>
                  <div className="fts-row-right">{VisualPanel}</div>
                </>
              ) : (
                <>
                  {/* Odd idx:  VISUAL LEFT — TEXT RIGHT */}
                  <div className="fts-row-left">{VisualPanel}</div>
                  <div className="fts-row-right">{TextPanel}</div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
