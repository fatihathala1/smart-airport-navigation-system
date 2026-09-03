"use client";

import Image from "next/image";
import Link from "next/link";
import { useMapStore } from "@/store/mapStore";
import styles from "./SiteChrome.module.css";

export function SiteFooter() {
  const lang = useMapStore((state) => state.lang);

  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerLeft}>
          <Image
            className={styles.footerLogo}
            src="/injourney-airports.png"
            width={160}
            height={44}
            alt="InJourney Airports"
          />
          <span className={styles.footerText}>
            © {new Date().getFullYear()} PT Angkasa Pura Indonesia — {lang === "ID" ? "Bandara Internasional Juanda" : "Juanda International Airport"}
          </span>
        </div>

        <div>
          <Link href="/admin" className={styles.adminSecretLink} title="Portal Staff / Operator">
            Portal Staff & Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
