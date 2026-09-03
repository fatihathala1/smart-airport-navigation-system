"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { ArrowRight, ChevronLeft, Layers, Navigation, QrCode, Search, X } from "lucide-react";
import { useMapStore } from "@/store/mapStore";
import styles from "./WayfindingTutorialModal.module.css";

interface WayfindingTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenQrModal?: () => void;
  onOpenSearchModal?: () => void;
}

const passengerQuestions = [
  { name: "Nadia Putri", roleId: "Penumpang reguler · Terminal 1", roleEn: "Regular passenger · Terminal 1", questionId: "Lokasi apa yang paling sering ditanyakan penumpang?", questionEn: "Which locations do passengers ask about most often?", rating: 5, likes: 128, avatarX: "0%", avatarY: "12.5%" },
  { name: "Raka Mahendra", roleId: "Pengguna peta · Terminal 2", roleEn: "Map user · Terminal 2", questionId: "Top 5 tempat yang paling sering dicari apa saja?", questionEn: "What are the five most frequently searched places?", rating: 5, likes: 104, avatarX: "50%", avatarY: "12.5%" },
  { name: "Dimas Prabowo", roleId: "Penumpang transit", roleEn: "Transit passenger", questionId: "Area mana yang paling membuat penumpang bingung?", questionEn: "Which areas are the most confusing for passengers?", rating: 4, likes: 96, avatarX: "100%", avatarY: "12.5%" },
  { name: "Aulia Rahman", roleId: "Pengunjung · Terminal 1", roleEn: "Visitor · Terminal 1", questionId: "Biasanya penumpang tersesat karena apa?", questionEn: "What usually causes passengers to lose their way?", rating: 5, likes: 87, avatarX: "0%", avatarY: "87.5%" },
  { name: "Fajar Nugraha", roleId: "Penumpang rutin", roleEn: "Frequent flyer", questionId: "Kalau ada sistem navigasi digital, fitur apa yang paling membantu?", questionEn: "Which digital navigation feature would be the most helpful?", rating: 5, likes: 76, avatarX: "50%", avatarY: "87.5%" },
  { name: "Sinta Larasati", roleId: "Penumpang keluarga", roleEn: "Family traveler", questionId: "Di mana posisi terbaik untuk memasang sistem wayfinding?", questionEn: "Where is the best place to install a wayfinding system?", rating: 5, likes: 69, avatarX: "100%", avatarY: "87.5%" },
];

export function WayfindingTutorialModal({ isOpen, onClose, onOpenQrModal, onOpenSearchModal }: WayfindingTutorialModalProps) {
  const store = useMapStore();
  const lang = store.lang;
  const [activeStep, setActiveStep] = useState(0);
  const dialogRef = useRef<HTMLElement>(null);
  const reviewRailRef = useRef<HTMLDivElement>(null);
  const velocityRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  const steps = [
    {
      id: "search",
      shortTitle: lang === "ID" ? "Cari lokasi" : "Find a location",
      title: lang === "ID" ? "Cari lokasi atau pilih langsung pada denah" : "Search for a place or select it on the map",
      icon: Search,
      description: lang === "ID"
        ? "Gunakan pencarian untuk menemukan gate, tenant, musala, ATM, dan layanan bandara. Setiap area pada denah juga dapat dipilih untuk membuka rincian tempat."
        : "Use search to find gates, shops, prayer rooms, ATMs, and airport services. You can also select an area on the map to see more details.",
      tips: [
        lang === "ID" ? "Masukkan nama spesifik seperti Gate 1 atau Kedai Madura." : "Enter a name, such as Gate 1 or the name of a shop.",
        lang === "ID" ? "Gunakan kategori jika belum mengetahui nama tempat." : "Choose a category if you do not know the place name.",
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
      title: lang === "ID" ? "Tetapkan posisi awal melalui QR standee" : "Set your starting point with a QR stand",
      icon: QrCode,
      description: lang === "ID"
        ? "Pindai QR pada standee terdekat untuk menetapkan terminal, lantai, dan posisi awal secara akurat tanpa mengandalkan GPS di dalam gedung."
        : "Scan the nearest QR stand to set your terminal, floor, and starting point. GPS may not work well inside the airport.",
      tips: [
        lang === "ID" ? "Cari standee terdekat dari posisi Anda saat ini." : "Use the standee closest to your current position.",
        lang === "ID" ? "Posisi dapat diganti secara manual jika QR tidak tersedia." : "You can choose a starting point yourself if there is no QR stand nearby.",
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
        : "After you choose a destination, the map shows the route, distance, and walking time.",
      tips: [
        lang === "ID" ? "Pastikan titik awal dan tujuan sudah benar sebelum memulai." : "Check your starting point and destination before you begin.",
        lang === "ID" ? "Rute dapat dihitung ulang kapan saja ketika tujuan berubah." : "The map can find a new route if you change your destination.",
      ],
    },
    {
      id: "floors",
      shortTitle: lang === "ID" ? "Berpindah lantai" : "Change floors",
      title: lang === "ID" ? "Gunakan lift, tangga, dan fasilitas aksesibel" : "Use lifts, stairs, and accessible facilities",
      icon: Layers,
      description: lang === "ID"
        ? "Jika tujuan berada di lantai berbeda, peta menunjukkan titik perpindahan lantai dan fasilitas publik yang tersedia di sekitar rute."
        : "If your destination is on another floor, the map shows where to change floors and which facilities are nearby.",
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

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const focusFrame = window.requestAnimationFrame(() => dialogRef.current?.focus());
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  const currentStep = steps[activeStep];

  return (
    <div className={`modal-overlay ${styles.backdrop}`} onClick={onClose}>
      <section ref={dialogRef} className={styles.card} role="dialog" aria-modal="true" aria-labelledby="help-title" tabIndex={-1} onClick={(event) => event.stopPropagation()}>
        <header className={styles.header}>
          <div>
            <span className={styles.eyebrow}>{lang === "ID" ? "PUSAT BANTUAN" : "HELP CENTER"}</span>
            <h2 id="help-title">{lang === "ID" ? "Panduan menggunakan peta" : "How to use the map"}</h2>
            <p>{lang === "ID" ? "Empat langkah singkat untuk bernavigasi di Terminal Juanda." : "Four simple steps to find your way around Juanda Airport."}</p>
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label={lang === "ID" ? "Tutup panduan" : "Close guide"}><X size={20} /></button>
        </header>

        <div className={styles.layout}>
          <nav className={styles.stepNav} aria-label={lang === "ID" ? "Langkah panduan" : "Guide steps"}>
            <span className={styles.navLabel}>{lang === "ID" ? "ALUR PENGGUNAAN" : "HOW IT WORKS"}</span>
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
                <h4>{lang === "ID" ? "Yang perlu diperhatikan" : "Helpful tips"}</h4>
                <ol>
                  {currentStep.tips.map((tip, index) => <li key={tip}><span>{String(index + 1).padStart(2, "0")}</span><p>{tip}</p></li>)}
                </ol>
              </div>
              {currentStep.onAction && (
                <button type="button" className={styles.primaryAction} onClick={currentStep.onAction}>
                  <span>{currentStep.actionText}</span>
                  <span className={styles.buttonIcon} aria-hidden="true"><ArrowRight size={14} /></span>
                </button>
              )}
            </article>

            <section className={styles.questions} aria-labelledby="passenger-questions-title">
              <div className={styles.questionsHeader}>
                <div><span>{lang === "ID" ? "SUARA PENUMPANG" : "PASSENGER VOICES"}</span><h3 id="passenger-questions-title">{lang === "ID" ? "Pertanyaan yang paling sering muncul" : "Frequently asked questions"}</h3></div>
                <p>{lang === "ID" ? "Geser untuk membaca" : "Scroll to read"}</p>
              </div>
              <div ref={reviewRailRef} className={styles.reviewRail} tabIndex={0} aria-label={lang === "ID" ? "Daftar pertanyaan penumpang" : "Passenger questions"}>
                {passengerQuestions.map((review) => {
                  const role = lang === "ID" ? review.roleId : review.roleEn;
                  const question = lang === "ID" ? review.questionId : review.questionEn;

                  return (
                  <article className={styles.reviewCard} key={review.name}>
                    <div className={styles.reviewIdentity}>
                      <span className={styles.avatar} style={{ "--avatar-x": review.avatarX, "--avatar-y": review.avatarY } as CSSProperties} aria-hidden="true" />
                      <div><strong>{review.name}</strong><small>{role}</small></div>
                    </div>
                    <div className={styles.rating} aria-label={lang === "ID" ? `${review.rating} dari 5 bintang` : `${review.rating} out of 5 stars`}>
                      {Array.from({ length: 5 }, (_, index) => <span key={index} data-filled={index < review.rating}>★</span>)}
                    </div>
                    <blockquote>“{question}”</blockquote>
                    <footer><span>{lang === "ID" ? "Pertanyaan terverifikasi" : "Verified question"}</span><span>{lang === "ID" ? `Suka · ${review.likes}` : `Helpful · ${review.likes}`}</span></footer>
                  </article>
                  );
                })}
              </div>
            </section>
          </div>
        </div>

        <footer className={styles.footer}>
          <span>{lang === "ID" ? `${activeStep + 1} dari 4 langkah` : `${activeStep + 1} of 4 steps`}</span>
          <div>
            {activeStep > 0 && (
              <button type="button" className={styles.secondaryButton} onClick={() => setActiveStep((step) => step - 1)}>
                <ChevronLeft size={14} aria-hidden="true" />
                <span>{lang === "ID" ? "Sebelumnya" : "Previous"}</span>
              </button>
            )}
            {activeStep < steps.length - 1
              ? (
                <button type="button" className={styles.nextButton} onClick={() => setActiveStep((step) => step + 1)}>
                  <span>{lang === "ID" ? "Langkah berikutnya" : "Next step"}</span>
                  <span className={styles.buttonIcon} aria-hidden="true"><ArrowRight size={14} /></span>
                </button>
              )
              : <button type="button" className={styles.nextButton} onClick={onClose}>{lang === "ID" ? "Selesai" : "Done"}</button>}
          </div>
        </footer>
      </section>
    </div>
  );
}
