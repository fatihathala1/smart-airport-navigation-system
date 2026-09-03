"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Layers, Navigation, QrCode, Search, X } from "lucide-react";
import { useMapStore } from "@/store/mapStore";
import styles from "./WayfindingTutorialModal.module.css";

interface WayfindingTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenQrModal?: () => void;
  onOpenSearchModal?: () => void;
}

const passengerQuestions = [
  { name: "Nadia Putri", role: "Penumpang reguler · Terminal 1", question: "Lokasi apa yang paling sering ditanyakan penumpang?", rating: 5, likes: 128, avatarX: "0%", avatarY: "12.5%" },
  { name: "Raka Mahendra", role: "Pengguna peta · Terminal 2", question: "Top 5 tempat yang paling sering dicari apa saja?", rating: 5, likes: 104, avatarX: "50%", avatarY: "12.5%" },
  { name: "Dimas Prabowo", role: "Penumpang transit", question: "Area mana yang paling membuat penumpang bingung?", rating: 4, likes: 96, avatarX: "100%", avatarY: "12.5%" },
  { name: "Aulia Rahman", role: "Pengunjung · Terminal 1", question: "Biasanya penumpang tersesat karena apa?", rating: 5, likes: 87, avatarX: "0%", avatarY: "87.5%" },
  { name: "Fajar Nugraha", role: "Frequent flyer", question: "Kalau ada sistem navigasi digital, fitur apa yang paling membantu?", rating: 5, likes: 76, avatarX: "50%", avatarY: "87.5%" },
  { name: "Sinta Larasati", role: "Penumpang keluarga", question: "Dimana posisi terbaik untuk memasang sistem wayfinding?", rating: 5, likes: 69, avatarX: "100%", avatarY: "87.5%" },
];

export function WayfindingTutorialModal({ isOpen, onClose, onOpenQrModal, onOpenSearchModal }: WayfindingTutorialModalProps) {
  const store = useMapStore();
  const lang = store.lang;
  const [activeStep, setActiveStep] = useState(0);
  const reviewRailRef = useRef<HTMLDivElement>(null);
  const velocityRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  const steps = [
    {
      id: "search",
      shortTitle: lang === "ID" ? "Cari lokasi" : "Find a location",
      title: lang === "ID" ? "Cari lokasi atau pilih langsung pada denah" : "Search or select directly on the map",
      icon: Search,
      description: lang === "ID"
        ? "Gunakan pencarian untuk menemukan gate, tenant, musala, ATM, dan layanan bandara. Setiap area pada denah juga dapat dipilih untuk membuka rincian tempat."
        : "Use search to find gates, tenants, prayer rooms, ATMs, and airport services. Every map area can also be selected for details.",
      tips: [
        lang === "ID" ? "Masukkan nama spesifik seperti Gate 1 atau Kedai Madura." : "Enter a specific name such as Gate 1 or a tenant.",
        lang === "ID" ? "Gunakan kategori jika belum mengetahui nama tempat." : "Use categories when you do not know the place name.",
      ],
      actionText: lang === "ID" ? "Buka pencarian lokasi" : "Open location search",
      onAction: () => {
        onClose();
        if (onOpenSearchModal) onOpenSearchModal();
        else store.setIsSearchOpen(true);
      },
    },
    {
      id: "qr",
      shortTitle: lang === "ID" ? "Tentukan posisi" : "Set your position",
      title: lang === "ID" ? "Tetapkan posisi awal melalui QR standee" : "Set your starting point using a QR standee",
      icon: QrCode,
      description: lang === "ID"
        ? "Pindai QR pada standee terdekat untuk menetapkan terminal, lantai, dan posisi awal secara akurat tanpa mengandalkan GPS di dalam gedung."
        : "Scan the nearest standee QR to set the correct terminal, floor, and starting position without relying on indoor GPS.",
      tips: [
        lang === "ID" ? "Cari standee terdekat dari posisi Anda saat ini." : "Use the standee closest to your current position.",
        lang === "ID" ? "Posisi dapat diganti secara manual jika QR tidak tersedia." : "Choose a starting point manually when a QR is unavailable.",
      ],
      actionText: lang === "ID" ? "Simulasikan scan QR" : "Simulate QR scan",
      onAction: () => {
        onClose();
        onOpenQrModal?.();
      },
    },
    {
      id: "navigation",
      shortTitle: lang === "ID" ? "Ikuti rute" : "Follow the route",
      title: lang === "ID" ? "Ikuti rute terpendek menuju tujuan" : "Follow the shortest route to your destination",
      icon: Navigation,
      description: lang === "ID"
        ? "Setelah memilih tujuan, peta menampilkan jalur yang harus diikuti beserta estimasi jarak dan waktu berjalan."
        : "After choosing a destination, the map displays the route along with estimated distance and walking time.",
      tips: [
        lang === "ID" ? "Pastikan titik awal dan tujuan sudah benar sebelum memulai." : "Confirm the origin and destination before starting.",
        lang === "ID" ? "Rute dapat dihitung ulang kapan saja ketika tujuan berubah." : "Recalculate the route whenever the destination changes.",
      ],
    },
    {
      id: "floors",
      shortTitle: lang === "ID" ? "Berpindah lantai" : "Change floors",
      title: lang === "ID" ? "Gunakan lift, tangga, dan fasilitas aksesibel" : "Use lifts, stairs, and accessible facilities",
      icon: Layers,
      description: lang === "ID"
        ? "Jika tujuan berada di lantai berbeda, peta menunjukkan titik perpindahan lantai dan fasilitas publik yang tersedia di sekitar rute."
        : "For destinations on another floor, the map shows transfer points and public facilities available along the route.",
      tips: [
        lang === "ID" ? "Periksa indikator lantai sebelum mengikuti jalur berikutnya." : "Check the floor indicator before continuing.",
        lang === "ID" ? "Gunakan filter fasilitas untuk menemukan lift atau tangga terdekat." : "Use facility filters to find the nearest lift or stairs.",
      ],
    },
  ];

  useEffect(() => {
    if (!isOpen) return;
    const rail = reviewRailRef.current;
    if (!rail) return;

    const animateMomentum = () => {
      rail.scrollLeft += velocityRef.current;
      velocityRef.current *= 0.88;
      if (Math.abs(velocityRef.current) > 0.25) {
        animationFrameRef.current = window.requestAnimationFrame(animateMomentum);
      } else {
        velocityRef.current = 0;
        animationFrameRef.current = null;
      }
    };

    const handleWheel = (event: WheelEvent) => {
      const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      if (!delta) return;
      const atStart = rail.scrollLeft <= 1;
      const atEnd = rail.scrollLeft >= rail.scrollWidth - rail.clientWidth - 1;
      if ((delta < 0 && atStart) || (delta > 0 && atEnd)) return;
      event.preventDefault();
      velocityRef.current = Math.max(-36, Math.min(36, velocityRef.current + delta * 0.16));
      if (animationFrameRef.current === null) {
        animationFrameRef.current = window.requestAnimationFrame(animateMomentum);
      }
    };

    rail.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      rail.removeEventListener("wheel", handleWheel);
      if (animationFrameRef.current !== null) window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
      velocityRef.current = 0;
    };
  }, [isOpen]);

  if (!isOpen) return null;
  const currentStep = steps[activeStep];

  return (
    <div className={`modal-overlay ${styles.backdrop}`} onClick={onClose}>
      <section className={styles.card} role="dialog" aria-modal="true" aria-labelledby="help-title" onClick={(event) => event.stopPropagation()}>
        <header className={styles.header}>
          <div>
            <span className={styles.eyebrow}>{lang === "ID" ? "PUSAT BANTUAN" : "HELP CENTER"}</span>
            <h2 id="help-title">{lang === "ID" ? "Panduan menggunakan peta" : "How to use the map"}</h2>
            <p>{lang === "ID" ? "Empat langkah singkat untuk bernavigasi di Terminal Juanda." : "Four concise steps for navigating Juanda Airport."}</p>
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Tutup panduan"><X size={20} /></button>
        </header>

        <div className={styles.layout}>
          <nav className={styles.stepNav} aria-label={lang === "ID" ? "Langkah panduan" : "Guide steps"}>
            <span className={styles.navLabel}>{lang === "ID" ? "ALUR PENGGUNAAN" : "USAGE FLOW"}</span>
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === activeStep;
              return (
                <button key={step.id} type="button" className={styles.stepButton} data-active={isActive} aria-current={isActive ? "step" : undefined} onClick={() => setActiveStep(index)}>
                  <Icon className={styles.stepIcon} size={28} strokeWidth={1.45} />
                  <span><small>{String(index + 1).padStart(2, "0")}</small><strong>{step.shortTitle}</strong></span>
                </button>
              );
            })}
          </nav>

          <div className={styles.content}>
            <article className={styles.stepArticle} key={currentStep.id}>
              <div className={styles.stepMeta}>
                <span>{lang === "ID" ? `LANGKAH ${activeStep + 1}` : `STEP ${activeStep + 1}`}</span>
                <span>{String(activeStep + 1).padStart(2, "0")} / 04</span>
              </div>
              <h3>{currentStep.title}</h3>
              <p className={styles.description}>{currentStep.description}</p>
              <div className={styles.notes}>
                <h4>{lang === "ID" ? "Yang perlu diperhatikan" : "What to keep in mind"}</h4>
                <ol>
                  {currentStep.tips.map((tip, index) => <li key={tip}><span>{String(index + 1).padStart(2, "0")}</span><p>{tip}</p></li>)}
                </ol>
              </div>
              {currentStep.onAction && <button type="button" className={styles.primaryAction} onClick={currentStep.onAction}>{currentStep.actionText}</button>}
            </article>

            <section className={styles.questions} aria-labelledby="passenger-questions-title">
              <div className={styles.questionsHeader}>
                <div><span>{lang === "ID" ? "SUARA PENUMPANG" : "PASSENGER VOICES"}</span><h3 id="passenger-questions-title">{lang === "ID" ? "Pertanyaan yang paling sering muncul" : "Frequently raised questions"}</h3></div>
                <p>{lang === "ID" ? "Geser untuk membaca" : "Scroll to read"}</p>
              </div>
              <div ref={reviewRailRef} className={styles.reviewRail} tabIndex={0} aria-label={lang === "ID" ? "Daftar pertanyaan penumpang" : "Passenger questions"}>
                {passengerQuestions.map((review) => (
                  <article className={styles.reviewCard} key={review.question}>
                    <div className={styles.reviewIdentity}>
                      <span className={styles.avatar} style={{ "--avatar-x": review.avatarX, "--avatar-y": review.avatarY } as CSSProperties} aria-hidden="true" />
                      <div><strong>{review.name}</strong><small>{review.role}</small></div>
                    </div>
                    <div className={styles.rating} aria-label={`${review.rating} dari 5 bintang`}>
                      {Array.from({ length: 5 }, (_, index) => <span key={index} data-filled={index < review.rating}>★</span>)}
                    </div>
                    <blockquote>“{review.question}”</blockquote>
                    <footer><span>{lang === "ID" ? "Pertanyaan terverifikasi" : "Verified question"}</span><span>{lang === "ID" ? `Suka · ${review.likes}` : `Helpful · ${review.likes}`}</span></footer>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </div>

        <footer className={styles.footer}>
          <span>{lang === "ID" ? `${activeStep + 1} dari 4 langkah` : `${activeStep + 1} of 4 steps`}</span>
          <div>
            {activeStep > 0 && <button type="button" className={styles.secondaryButton} onClick={() => setActiveStep((step) => step - 1)}>{lang === "ID" ? "Sebelumnya" : "Previous"}</button>}
            {activeStep < steps.length - 1
              ? <button type="button" className={styles.nextButton} onClick={() => setActiveStep((step) => step + 1)}>{lang === "ID" ? "Langkah berikutnya" : "Next step"}</button>
              : <button type="button" className={styles.nextButton} onClick={onClose}>{lang === "ID" ? "Selesai" : "Done"}</button>}
          </div>
        </footer>
      </section>
    </div>
  );
}
