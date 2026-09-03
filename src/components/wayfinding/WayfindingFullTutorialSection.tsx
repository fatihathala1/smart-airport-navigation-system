"use client";

import { ArrowRight, Layers, Navigation, QrCode, Search } from "lucide-react";
import { useMapStore } from "@/store/mapStore";
import styles from "./WayfindingFullTutorialSection.module.css";

interface WayfindingFullTutorialSectionProps {
  onOpenSearchModal?: () => void;
  onOpenQrModal?: () => void;
  onOpenHelpModal?: () => void;
}

export function WayfindingFullTutorialSection({
  onOpenSearchModal,
  onOpenQrModal,
  onOpenHelpModal,
}: WayfindingFullTutorialSectionProps) {
  const store = useMapStore();
  const lang = store.lang;

  const steps = [
    {
      num: "01",
      tag: lang === "ID" ? "Pencarian lokasi" : "Find a location",
      title: lang === "ID" ? "Temukan gate, toko, restoran, atau musala" : "Find gates, shops, restaurants, or prayer rooms",
      icon: Search,
      desc: lang === "ID"
        ? "Cari lokasi berdasarkan nama atau kategori. Setiap area pada denah dapat dipilih untuk membuka informasi tempat yang lebih lengkap."
        : "Search by name or category. You can also select any area on the map to see more details.",
      cta: lang === "ID" ? "Buka pencarian" : "Open search",
      onCta: () => { if (onOpenSearchModal) onOpenSearchModal(); else store.setIsSearchOpen(true); },
    },
    {
      num: "02",
      tag: lang === "ID" ? "Posisi awal" : "Set your location",
      title: lang === "ID" ? "Tetapkan posisi melalui QR standee bandara" : "Set your location with an airport QR stand",
      icon: QrCode,
      desc: lang === "ID"
        ? "Pindai QR pada standee terdekat untuk menetapkan titik awal secara otomatis tanpa bergantung pada akurasi GPS di dalam terminal."
        : "Scan the nearest QR stand to set your starting point automatically. You do not need to use indoor GPS.",
      cta: lang === "ID" ? "Simulasi scan QR" : "Try QR scan",
      onCta: () => { if (onOpenQrModal) onOpenQrModal(); },
    },
    {
      num: "03",
      tag: lang === "ID" ? "Perhitungan rute" : "Plan your route",
      title: lang === "ID" ? "Ikuti rute terpendek beserta estimasi waktu" : "Follow the shortest route and check the walking time",
      icon: Navigation,
      desc: lang === "ID"
        ? "Sistem menghitung jalur publik terpendek dari posisi awal menuju tujuan, kemudian menampilkan jarak dan estimasi waktu berjalan."
        : "The map finds the shortest public route from your starting point and shows the distance and walking time.",
      cta: lang === "ID" ? "Lihat panduan peta" : "View map guide",
      onCta: () => { if (onOpenHelpModal) onOpenHelpModal(); },
    },
    {
      num: "04",
      tag: lang === "ID" ? "Lintas lantai" : "Change floors",
      title: lang === "ID" ? "Temukan lift, tangga, dan fasilitas aksesibel" : "Find elevators, stairs, and accessible facilities",
      icon: Layers,
      desc: lang === "ID"
        ? "Saat tujuan berada di lantai berbeda, petunjuk perpindahan lantai muncul bersama akses cepat ke fasilitas publik terdekat."
        : "If your destination is on another floor, the map shows where to change floors and which public facilities are nearby.",
      cta: lang === "ID" ? "Kembali ke peta" : "Back to map",
      onCta: () => { window.scrollTo({ top: 0, behavior: "smooth" }); },
    },
  ];

  return (
    <section
      className={styles.section}
      id="panduan-lengkap"
      aria-labelledby="guide-title"
      data-scroll-reveal
    >
      <div className={styles.inner}>
        <header className={styles.header} data-reveal-child>
          <div className={styles.headerGrid}>
            <h2 id="guide-title">
              {lang === "ID" ? (
                <>Gunakan peta dengan <span>jelas dan cepat.</span></>
              ) : (
                <>Use the map <span>quickly and easily.</span></>
              )}
            </h2>
            <p>
              {lang === "ID"
                ? "Empat langkah inti untuk mencari lokasi, menetapkan posisi awal, mengikuti rute, dan berpindah lantai di terminal."
                : "Four simple steps to find a place, set your starting point, follow a route, and change floors."}
            </p>
          </div>
        </header>

        <ol className={styles.stepList}>
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <li key={step.num} className={styles.step} data-reveal-child>
                <div className={styles.index} aria-hidden="true">
                  <span className={styles.stepLabel}>{lang === "ID" ? "Langkah" : "Step"}</span>
                  <strong>{step.num}</strong>
                </div>

                <div className={styles.copy}>
                  <div className={styles.tag}>
                    <span className={styles.tagDot} />
                    <span>{step.tag}</span>
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                  <button type="button" onClick={step.onCta} className={styles.ctaBtn}>
                    <span>{step.cta}</span>
                    <span className={styles.ctaIcon}>
                      <ArrowRight size={15} />
                    </span>
                  </button>
                </div>

                <div className={styles.glyph} aria-hidden="true">
                  <div className={styles.glyphContainer}>
                    <Icon size={32} strokeWidth={1.8} />
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
