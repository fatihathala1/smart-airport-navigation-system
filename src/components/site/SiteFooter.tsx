import Image from "next/image";
import Link from "next/link";
import styles from "./SiteChrome.module.css";

export function SiteFooter() {
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
            © {new Date().getFullYear()} PT Angkasa Pura Indonesia — Bandara Internasional Juanda
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
