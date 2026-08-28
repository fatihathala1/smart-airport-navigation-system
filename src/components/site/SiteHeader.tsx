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
        {/* InJourney Airports Logo */}
        <div className={styles.logoGroup}>
          <Link className={styles.logoLink} href="/" aria-label="InJourney Airports">
          <Image
            className={styles.headerLogo}
            src="/injourney-airports-white.png"
            width={200}
            height={60}
            priority
            alt="InJourney Airports"
          />
          </Link>
          <span className={styles.logoDivider} aria-hidden="true" />
          <Image
            className={styles.juandaLogo}
            src="/Logo-ToDjuanda/Logo-Text-White.svg"
            width={540}
            height={217}
            priority
            alt="Juanda Airport"
          />
        </div>

        {/* Navigation */}
        <nav className={styles.navMenu} aria-label="Main Navigation">
          <Link href="/" className={styles.navLink} data-active={true}>
            Home
          </Link>
          <button
            type="button"
            className={styles.navLink}
            onClick={() => {
              document.querySelector(".workspace")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Map
          </button>
          <button
            type="button"
            className={styles.navLink}
            onClick={() => {
              document.querySelector(".workspace")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Search
          </button>
          <Link href="#" className={styles.navLink}>
            Help
          </Link>
        </nav>

        {/* Language Switcher */}
        <div className={styles.headerRightArea}>
          <div className={styles.languageSwitch} aria-label="Select language">
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
