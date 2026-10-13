"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleHelp, Compass, Home, Info, Menu, X } from "lucide-react";
import { useMapStore } from "@/store/mapStore";
import styles from "./SiteChrome.module.css";

export function SiteHeader() {
  const store = useMapStore();
  const currentLang = store.lang;
  const pathname = usePathname();
  const isMapPage = pathname === "/map";
  const isHomePage = pathname === "/";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <header className={`${styles.header} ${styles.mapHeader} ${isHomePage ? styles.homeHeader : ""}`}>
      <div className={styles.headerInner}>
        {/* Juanda International Airport by InJourney Airports */}
        <div className={styles.logoGroup}>
          <Link className={styles.logoLink} href="/" aria-label="Juanda International Airport">
            <Image
              className={styles.headerAirportLogo}
              src="/juanda-international-airport-logo-white-injourney.png"
              width={500}
              height={145}
              sizes="(max-width: 640px) 170px, 230px"
              priority
              alt="Juanda International Airport by InJourney Airports"
            />
          </Link>
          <span className={styles.logoDivider} aria-hidden="true" />
          <Image
            className={styles.toDjuandaLogo}
            src="/Logo-ToDjuanda/Logo-Text-White.svg"
            width={540}
            height={217}
            priority
            alt="ToDjuanda"
          />
        </div>

        {/* Navigation */}
        <nav className={styles.navMenu} aria-label="Main Navigation">
          <Link href="/" className={styles.navLink} data-active={pathname === "/"}>
            Home
          </Link>
          <Link href="/map" className={styles.navLink} data-active={isMapPage}>
            Maps
          </Link>
          <Link href="/about" className={styles.navLink} data-active={pathname === "/about"}>
            About
          </Link>
          <Link href="/help" className={styles.navLink} data-active={pathname === "/help"}>
            Help
          </Link>
        </nav>

        {/* Language Switcher & Mobile Menu Trigger */}
        <div className={styles.headerRightArea}>
          <Link href="/help" className={styles.mobileHelpLink} aria-label={currentLang === "ID" ? "Bantuan — panduan penggunaan" : "Help — usage guide"} aria-current={pathname === "/help" ? "page" : undefined}>
            <CircleHelp size={20} strokeWidth={2} />
          </Link>
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
          <button
            type="button"
            className={styles.mobileMenuToggle}
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            aria-expanded={isMobileMenuOpen}
            aria-label={isMobileMenuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </header>

    {/* Mobile Navigation Bar di Bagian Page (di bawah header) */}
    <nav className={styles.mobilePageNav} aria-label="Mobile Navigation">
      <Link href="/" className={styles.subNavLink} data-active={pathname === "/"}>
        Home
      </Link>
      <Link href="/map" className={styles.subNavLink} data-active={isMapPage}>
        Maps
      </Link>
      <Link href="/about" className={styles.subNavLink} data-active={pathname === "/about"}>
        About
      </Link>
      <Link href="/help" className={styles.subNavLink} data-active={pathname === "/help"}>
        Help
      </Link>
    </nav>

      {/* Mobile Drawer Menu rendered via portal into body to escape header clipping */}
      {mounted && isMobileMenuOpen && typeof document !== "undefined" && createPortal(
        <>
          <div
            className={styles.mobileMenuBackdrop}
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <aside className={styles.mobileMenuDrawer} aria-label="Menu Navigasi Mobile">
            <div className={styles.mobileMenuDrawerHeader}>
              <Image
                src="/juanda-international-airport-logo-white-injourney.png"
                width={130}
                height={38}
                alt="Juanda International Airport"
                className={styles.mobileMenuLogo}
              />
              <button
                type="button"
                className={styles.mobileMenuCloseBtn}
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Tutup menu"
              >
                <X size={18} />
              </button>
            </div>

            <nav className={styles.mobileMenuList}>
              <Link
                href="/"
                className={styles.mobileMenuItem}
                data-active={pathname === "/"}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Home size={19} />
                <span>Home</span>
              </Link>
              <Link
                href="/map"
                className={styles.mobileMenuItem}
                data-active={isMapPage}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Compass size={19} />
                <span>Maps</span>
              </Link>
              <Link
                href="/about"
                className={styles.mobileMenuItem}
                data-active={pathname === "/about"}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Info size={19} />
                <span>About</span>
              </Link>
              <Link
                href="/help"
                className={styles.mobileMenuItem}
                data-active={pathname === "/help"}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <CircleHelp size={19} />
                <span>Help</span>
              </Link>
            </nav>

            <div className={styles.mobileMenuFooter}>
              <span className={styles.mobileMenuLangLabel}>
                {currentLang === "ID" ? "Pilih Bahasa" : "Language"}
              </span>
              <div className={styles.languageSwitch}>
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
          </aside>
        </>,
        document.body
      )}
    </>
  );
}


