"use client";

import Image from "next/image";
import Link from "next/link";
import { useMapStore } from "@/store/mapStore";
import styles from "./SiteChrome.module.css";

export function SiteHeader() {
  const store = useMapStore();
  const currentLang = store.lang;

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link className={styles.logoLink} href="/" aria-label="InJourney Airports — Beranda">
          <Image
            className={styles.headerLogo}
            src="/injourney-airports.png"
            width={240}
            height={90}
            priority
            alt="InJourney Airports"
          />
        </Link>

        <div className={styles.headerRightArea}>
          <div className={styles.languageSwitch} aria-label="Pilih bahasa / Select language">
            <button
              type="button"
              aria-pressed={currentLang === "ID"}
              onClick={() => store.setLang("ID")}
            >
              ID
            </button>
            <button
              type="button"
              aria-pressed={currentLang === "EN"}
              onClick={() => store.setLang("EN")}
            >
              EN
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
