"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search, X } from "lucide-react";
import { useMapStore } from "@/store/mapStore";
import styles from "./HomeHero.module.css";

const QUICK_SEARCHES = [
  { query: "Check-in", id: "Check-in", en: "Check-in" },
  { query: "Toilet", id: "Toilet", en: "Restroom" },
  { query: "Mushola", id: "Mushola", en: "Prayer room" },
];

export function HomeHero() {
  const router = useRouter();
  const lang = useMapStore((state) => state.lang);
  const isID = lang === "ID";
  const [query, setQuery] = useState("");

  const openMap = (term = query) => {
    const value = term.trim();
    router.push(value ? `/map?q=${encodeURIComponent(value)}` : "/map");
  };

  const board = [
    { label: isID ? "Terminal" : "Terminal", value: "T1" },
    { label: isID ? "Lantai" : "Floors", value: "1 & 2" },
    { label: isID ? "Area keberangkatan" : "Departure areas", value: "1 - 4" },
    { label: isID ? "Counter check-in" : "Check-in counters", value: "1 - 83" },
  ];

  return (
    <section className={styles.hero} aria-labelledby="home-title">
      <div className={styles.inner}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>Juanda International Airport</p>
          <h1 id="home-title" className={styles.title}>
            {isID ? "Temukan jalur Anda di Terminal 1" : "Find your way through Terminal 1"}
          </h1>
          <p className={styles.subtitle}>
            {isID
              ? "Peta 3D bagian dalam terminal. Pilih titik awal dan tujuan, lalu ikuti jalur berjalan kaki yang ditampilkan."
              : "A 3D map of the terminal interior. Pick a start and a destination, then follow the walking route shown."}
          </p>
          <form
            className={styles.search}
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              openMap();
            }}
          >
            <label className={styles.field}>
              <Search size={20} aria-hidden="true" />
              <span className="sr-only">{isID ? "Cari tujuan" : "Search destination"}</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={isID ? "Cari gate, counter, atau fasilitas" : "Search gate, counter, or facility"}
                autoComplete="off"
              />
              {query && (
                <button type="button" className={styles.clear} onClick={() => setQuery("")} aria-label={isID ? "Hapus pencarian" : "Clear search"}>
                  <X size={16} aria-hidden="true" />
                </button>
              )}
            </label>
            <button type="submit" className={styles.submit}>
              {isID ? "Buka peta" : "Open map"}
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </form>
          <div className={styles.quick}>
            <span className={styles.quickLabel}>{isID ? "Sering dicari" : "Popular"}</span>
            {QUICK_SEARCHES.map((item) => (
              <button key={item.query} type="button" className={styles.chip} onClick={() => openMap(item.query)}>
                {isID ? item.id : item.en}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className={styles.board}>
        <dl className={styles.boardInner} style={{ margin: "0 auto" }}>
          {board.map((cell) => (
            <div key={cell.label} className={styles.cell}>
              <dt className={styles.cellLabel}>{cell.label}</dt>
              <dd className={styles.cellValue} style={{ margin: 0 }}>{cell.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
