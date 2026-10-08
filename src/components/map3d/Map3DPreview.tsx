"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useMapStore } from "@/store/mapStore";
import styles from "./Map3DPreview.module.css";

const OverviewMap = dynamic(
  () => import("@/components/map2d/JuandaOverviewMap").then((module) => module.JuandaOverviewMap),
  { ssr: false },
);

export function Map3DPreview() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const lang = useMapStore((state) => state.lang);

  useEffect(() => {
    const target = sectionRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "250px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className={styles.section} aria-labelledby="map3d-preview-title">
      <div className={styles.copy}>
        <span className={styles.eyebrow}>{lang === "ID" ? "Terminal 1 / lantai dasar" : "Terminal 1 / ground floor"}</span>
        <h2 id="map3d-preview-title">{lang === "ID" ? "Lihat terminal dalam 3D" : "Explore the terminal in 3D"}</h2>
        <p>{lang === "ID"
          ? "Pilih titik awal dan tujuan, lalu ikuti rute pada peta Terminal 1 lantai dasar."
          : "Choose a start and destination, then follow a route through Terminal 1 ground floor."}</p>
        <Link href="/map" className={styles.link}>
          {lang === "ID" ? "Buka peta 3D" : "Open 3D map"}
          <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </div>
      <div className={styles.frame} aria-label={lang === "ID" ? "Peta Bandara Juanda" : "Juanda Airport map"}>
        {visible ? <OverviewMap /> : <span className={styles.placeholder} role="status">{lang === "ID" ? "Memuat peta bandara..." : "Loading airport map..."}</span>}
        <span className={styles.frameCaption}>{lang === "ID" ? "Klik area Terminal 1 untuk masuk ke 3D" : "Click Terminal 1 to enter 3D"}</span>
      </div>
    </section>
  );
}
