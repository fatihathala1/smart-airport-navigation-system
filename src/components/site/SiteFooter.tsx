import Image from "next/image";
import Link from "next/link";
import { MessageSquareText, PhoneCall } from "lucide-react";
import styles from "./SiteChrome.module.css";

const socialLinks = [
  { label: "Instagram", href: "https://www.instagram.com/injourneyairports/" },
  { label: "TikTok", href: "https://www.tiktok.com/@injourneyairports" },
  { label: "X", href: "https://x.com/INJairports" },
  { label: "YouTube", href: "https://www.youtube.com/@InJourneyAirports" },
  { label: "Facebook", href: "https://www.facebook.com/InJourneyAirports" },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/injourney-airports" },
] as const;

type SocialLabel = (typeof socialLinks)[number]["label"];

function SocialIcon({ label }: { label: SocialLabel }) {
  const commonProps = {
    className: styles.socialIcon,
    viewBox: "0 0 24 24",
    "aria-hidden": true,
  } as const;

  switch (label) {
    case "Instagram":
      return (
        <svg {...commonProps} fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "TikTok":
      return (
        <svg {...commonProps} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2">
          <path d="M14 4v11.2a4.2 4.2 0 1 1-3.4-4.12" />
          <path d="M14 4c.45 2.55 2 4 4.6 4" />
        </svg>
      );
    case "X":
      return (
        <svg {...commonProps} fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817-5.967 6.817H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
        </svg>
      );
    case "YouTube":
      return (
        <svg {...commonProps} fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2">
          <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
          <path d="m10 9 5 3-5 3V9Z" fill="currentColor" stroke="none" />
        </svg>
      );
    case "Facebook":
      return (
        <svg {...commonProps} fill="currentColor">
          <path d="M14.2 22v-8h2.8l.42-3.2H14.2V8.75c0-.93.26-1.56 1.61-1.56h1.72V4.33a23 23 0 0 0-2.51-.13c-2.49 0-4.19 1.52-4.19 4.31v2.29H8V14h2.83v8h3.37Z" />
        </svg>
      );
    case "LinkedIn":
      return (
        <svg {...commonProps} fill="currentColor">
          <path d="M5.35 7.25A2.25 2.25 0 1 0 5.35 2.75a2.25 2.25 0 0 0 0 4.5ZM3.4 9h3.9v12H3.4V9Zm6.3 0h3.74v1.64h.05c.52-.99 1.8-2.03 3.7-2.03 3.95 0 4.68 2.6 4.68 5.98V21h-3.9v-5.68c0-1.35-.03-3.1-1.89-3.1-1.89 0-2.18 1.48-2.18 3V21H9.7V9Z" />
        </svg>
      );
  }
}

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerMain}>
        <div className={styles.footerBrand}>
          <div className={styles.footerLogoSurface}>
            <Image
              className={styles.footerLogo}
              src="/juanda-international-airport-logo-white-injourney.png"
              width={500}
              height={145}
              sizes="(max-width: 640px) 180px, 210px"
              alt="Juanda International Airport by InJourney Airports"
            />
          </div>
        </div>

        <address className={styles.footerAddress}>
          <strong>Bandar Udara Internasional Juanda</strong>
          <span>Jalan Ir. Haji Juanda</span>
          <span>Surabaya 61253</span>
          <a href="tel:+62312986200">Telephone: T1 (+6231) 2986200</a>
          <a href="tel:+62312986700">T2 (+6231) 2986700</a>
        </address>

        <div className={styles.footerContact}>
          <PhoneCall aria-hidden="true" size={28} strokeWidth={1.8} />
          <div>
            <span>Hotline Kami</span>
            <a href="tel:172">172</a>
          </div>
        </div>

        <div className={styles.footerContact}>
          <MessageSquareText aria-hidden="true" size={30} strokeWidth={1.8} />
          <div>
            <span>Tulis Masukan</span>
            <a href="mailto:cc172@injourneyairports.id">cc172@injourneyairports.id</a>
          </div>
        </div>
      </div>

      <div className={styles.footerBottomBar}>
        <div className={styles.footerBottom}>
          <span className={styles.footerText}>
            © 2026 PT Angkasa Pura Indonesia — Bandara Internasional Juanda
          </span>

          <nav className={styles.socialLinks} aria-label="Media sosial InJourney Airports">
            {socialLinks.map(({ label, href }) => (
              <a
                key={label}
                className={styles.socialLink}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${label} InJourney Airports (buka di tab baru)`}
                title={label}
              >
                <span className={styles.socialMark} aria-hidden="true">
                  <SocialIcon label={label} />
                </span>
                <span>{label}</span>
              </a>
            ))}
          </nav>

          <Link href="/admin" className={styles.adminSecretLink} title="Portal Staff / Operator">
            Portal Staff &amp; Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
