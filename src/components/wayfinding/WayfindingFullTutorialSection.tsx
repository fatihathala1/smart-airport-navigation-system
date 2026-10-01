"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, MousePointer2, Navigation, Search, View } from "lucide-react";
import { useMapStore } from "@/store/mapStore";
import styles from "./WayfindingFullTutorialSection.module.css";

export function WayfindingFullTutorialSection() {
  const router = useRouter();
  const store = useMapStore();
  const lang = store.lang;

  const steps = [
    {
      num: "01",
      tag: lang === "ID" ? "Pencarian lokasi" : "Find a location",
      title: lang === "ID" ? "Cari building berdasarkan kodenya" : "Find a building by its code",
      icon: Search,
      desc: lang === "ID"
        ? "Gunakan kolom pencarian di peta untuk menemukan kode building, misalnya T1-GF-01."
        : "Use the map search field to find a building code, such as T1-GF-01.",
      cta: lang === "ID" ? "Buka peta" : "Open map",
      onCta: () => router.push("/map"),
    },
    {
      num: "02",
      tag: lang === "ID" ? "Posisi awal" : "Set your location",
      title: lang === "ID" ? "Tentukan posisi awal di peta" : "Set your starting point on the map",
      icon: MousePointer2,
      desc: lang === "ID"
        ? "Pilih titik awal pada model 3D sebelum menentukan tujuan. Pemindaian QR belum tersedia pada peta ini."
        : "Choose a starting point on the 3D model before selecting a destination. QR scanning is not available on this map yet.",
      cta: lang === "ID" ? "Pilih di peta" : "Choose on map",
      onCta: () => router.push("/map"),
    },
    {
      num: "03",
      tag: lang === "ID" ? "Perhitungan rute" : "Plan your route",
      title: lang === "ID" ? "Pilih tujuan dan ikuti rute" : "Choose a destination and follow the route",
      icon: Navigation,
      desc: lang === "ID"
        ? "Setelah titik awal dan tujuan dipilih, rute akan tampil di model 3D beserta kontrol navigasinya."
        : "Once you choose the start and destination, the route appears on the 3D model with navigation controls.",
      cta: lang === "ID" ? "Lihat panduan peta" : "View map guide",
      onCta: () => router.push("/help"),
    },
    {
      num: "04",
      tag: lang === "ID" ? "Jelajahi model" : "Explore the model",
      title: lang === "ID" ? "Atur tampilan peta 3D" : "Adjust the 3D map view",
      icon: View,
      desc: lang === "ID"
        ? "Geser, putar, dan zoom peta untuk melihat jalur lebih jelas. Saat ini peta mencakup Terminal 1 lantai dasar."
        : "Pan, rotate, and zoom the map to inspect your route. The current map covers Terminal 1 ground floor.",
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
                ? "Empat langkah untuk mencari building, menetapkan posisi awal, mengikuti rute, dan menjelajahi model 3D."
                : "Four steps to find a building, set your start, follow a route, and explore the 3D model."}
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
