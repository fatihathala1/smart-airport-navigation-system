"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Layers, Navigation, QrCode, Search } from "lucide-react";
import { useMapStore } from "@/store/mapStore";
import styles from "./WayfindingFullTutorialSection.module.css";

interface WayfindingFullTutorialSectionProps {
  onOpenSearchModal?: () => void;
  onOpenQrModal?: () => void;
}

export function WayfindingFullTutorialSection({
  onOpenSearchModal,
  onOpenQrModal,
}: WayfindingFullTutorialSectionProps) {
  const router = useRouter();
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
      title: lang === "ID" ? "Coba titik awal melalui simulasi QR" : "Try a starting point with the QR simulation",
      icon: QrCode,
      desc: lang === "ID"
        ? "Pilih titik standee contoh untuk menetapkan titik awal. Peta saat ini menggunakan data simulasi, bukan pemindaian QR bandara secara langsung."
        : "Choose a sample standee point to set your start. The current map uses demo data, not live airport QR scanning.",
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
      onCta: () => router.push("/help"),
    },
    {
      num: "04",
      tag: lang === "ID" ? "Lintas lantai" : "Change floors",
      title: lang === "ID" ? "Periksa lantai dan fasilitas sekitar" : "Check floors and nearby facilities",
      icon: Layers,
      desc: lang === "ID"
        ? "Gunakan pemilih lantai untuk melihat lokasi tujuan dan filter fasilitas untuk menjelajahi area yang sedang ditampilkan."
        : "Use the floor selector to view your destination and facility filters to explore the area currently shown.",
      cta: lang === "ID" ? "Buka peta" : "Open map",
      onCta: () => router.push("/map"),
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
