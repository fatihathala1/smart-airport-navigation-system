"use client";

import Link from "next/link";
import { ArrowRight, Building2, Flag, MapPin, Search } from "lucide-react";
import { useMapStore } from "@/store/mapStore";
import styles from "./FacilityShortcuts.module.css";

export function FacilityShortcuts() {
  const lang = useMapStore((state) => state.lang);
  const actions = [
    {
      id: "search",
      icon: Search,
      title: lang === "ID" ? "Cari building" : "Find a building",
      description: lang === "ID" ? "Temukan objek di peta berdasarkan kode building." : "Find an object on the map by its building code.",
    },
    {
      id: "start",
      icon: MapPin,
      title: lang === "ID" ? "Tentukan titik awal" : "Set a start point",
      description: lang === "ID" ? "Pilih lokasi keberangkatan langsung di model 3D." : "Choose your starting location directly on the 3D model.",
    },
    {
      id: "route",
      icon: Flag,
      title: lang === "ID" ? "Lihat rute" : "View a route",
      description: lang === "ID" ? "Pilih tujuan untuk menampilkan jalur di peta." : "Select a destination to display a route on the map.",
    },
  ];

  return (
    <section className={styles.section} id="facility-shortcuts" aria-labelledby="facility-title">
      <div className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>{lang === "ID" ? "JELAJAHI PETA 3D" : "EXPLORE THE 3D MAP"}</span>
          <h2 id="facility-title">{lang === "ID" ? "Mau mulai dari mana?" : "Where would you like to start?"}</h2>
          <p>{lang === "ID" ? "Cari building, tentukan posisi, dan lihat rute di Terminal 1 lantai dasar." : "Find a building, choose your position, and view a route on Terminal 1 ground floor."}</p>
        </div>
        <div className={styles.terminal}><Building2 size={19} aria-hidden="true" /><span>{lang === "ID" ? "Terminal 1 · Lantai Dasar" : "Terminal 1 · Ground Floor"}</span></div>
      </div>
      <div className={styles.grid}>
        {actions.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.id} href="/map" className={styles.card}>
              <span className={styles.icon}><Icon size={26} aria-hidden="true" /></span>
              <strong>{item.title}</strong>
              <span className={styles.description}>{item.description}</span>
              <ArrowRight size={18} className={styles.arrow} aria-hidden="true" />
            </Link>
          );
        })}
      </div>
      <p className={styles.note}>{lang === "ID" ? "Fitur peta 3D saat ini tersedia untuk Terminal 1 lantai dasar." : "The 3D map currently covers Terminal 1 ground floor."}</p>
    </section>
  );
}
