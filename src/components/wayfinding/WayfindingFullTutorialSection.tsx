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

  const steps = [
    {
      num: "01",
      tag: "Pencarian lokasi",
      title: "Temukan gate, toko, restoran, atau musala",
      icon: Search,
      desc: "Cari lokasi berdasarkan nama atau kategori. Setiap area pada denah dapat dipilih untuk membuka informasi tempat yang lebih lengkap.",
      cta: "Buka pencarian",
      onCta: () => { if (onOpenSearchModal) onOpenSearchModal(); else store.setIsSearchOpen(true); },
    },
    {
      num: "02",
      tag: "Posisi awal",
      title: "Tetapkan posisi melalui QR standee bandara",
      icon: QrCode,
      desc: "Pindai QR pada standee terdekat untuk menetapkan titik awal secara otomatis tanpa bergantung pada akurasi GPS di dalam terminal.",
      cta: "Simulasi scan QR",
      onCta: () => { if (onOpenQrModal) onOpenQrModal(); },
    },
    {
      num: "03",
      tag: "Perhitungan rute",
      title: "Ikuti rute terpendek beserta estimasi waktu",
      icon: Navigation,
      desc: "Sistem menghitung jalur publik terpendek dari posisi awal menuju tujuan, kemudian menampilkan jarak dan estimasi waktu berjalan.",
      cta: "Lihat panduan peta",
      onCta: () => { if (onOpenHelpModal) onOpenHelpModal(); },
    },
    {
      num: "04",
      tag: "Lintas lantai",
      title: "Temukan lift, tangga, dan fasilitas aksesibel",
      icon: Layers,
      desc: "Saat tujuan berada di lantai berbeda, petunjuk perpindahan lantai muncul bersama akses cepat ke fasilitas publik terdekat.",
      cta: "Kembali ke peta",
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
              Gunakan peta dengan <span>jelas dan cepat.</span>
            </h2>
            <p>
              Empat langkah inti untuk mencari lokasi, menetapkan posisi awal,
              mengikuti rute, dan berpindah lantai di terminal.
            </p>
          </div>
        </header>

        <ol className={styles.stepList}>
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <li key={step.num} className={styles.step} data-reveal-child>
                <div className={styles.index} aria-hidden="true">
                  <span className={styles.stepLabel}>Langkah</span>
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
