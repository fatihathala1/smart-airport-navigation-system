"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import styles from "./SiteChrome.module.css";

const navigation = [
  { label: "Tentang Kami", href: "#tentang-kami" },
  { label: "Informasi & Profil Bandara", href: "#profil-bandara" },
  { label: "Hubungan Investor", href: "#hubungan-investor" },
  { label: "Keberlanjutan", href: "#keberlanjutan" },
  { label: "Publikasi", href: "#publikasi" },
  { label: "PPID", href: "#ppid" },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [language, setLanguage] = useState<"ID" | "EN">("ID");

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link className={styles.logoLink} href="/" aria-label="InJourney Airports — beranda">
          <Image
            className={styles.headerLogo}
            src="/injourney-airports.png"
            width={255}
            height={130}
            priority
            alt="InJourney Airports"
          />
        </Link>

        <button
          className={styles.menuButton}
          type="button"
          aria-expanded={menuOpen}
          aria-controls="corporate-navigation"
          aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={23} /> : <Menu size={23} />}
        </button>

        <div className={styles.navigationArea} data-open={menuOpen} id="corporate-navigation">
          <nav className={styles.primaryNav} aria-label="Navigasi utama">
            {navigation.map((item) => (
              <a key={item.label} href={item.href} onClick={() => setMenuOpen(false)}>
                {item.label}
              </a>
            ))}
          </nav>

          <div className={styles.headerUtility}>
            <a className={styles.safetyButton} href="#keselamatan" onClick={() => setMenuOpen(false)}>
              Keselamatan <ChevronDown size={18} aria-hidden="true" />
            </a>
            <div className={styles.languageSwitch} aria-label="Pilih bahasa">
              <button type="button" aria-pressed={language === "ID"} onClick={() => setLanguage("ID")}>ID</button>
              <button type="button" aria-pressed={language === "EN"} onClick={() => setLanguage("EN")}>EN</button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
