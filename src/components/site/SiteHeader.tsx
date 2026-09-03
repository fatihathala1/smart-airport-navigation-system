"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMapStore } from "@/store/mapStore";
import styles from "./SiteChrome.module.css";

export function SiteHeader() {
  const store = useMapStore();
  const currentLang = store.lang;
  const pathname = usePathname();
  const router = useRouter();
  const isMapPage = pathname === "/map";

  const handleSearchClick = () => {
    if (!isMapPage) {
      router.push("/map");
      store.setIsSearchOpen(true);
    } else {
      store.toggleSearch();
    }
  };

  return (
    <header
      className={`${styles.header} ${isMapPage ? styles.mapHeader : ""}`}
      data-home-intro={!isMapPage ? "" : undefined}
    >
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
          <Link href="/" className={styles.navLink} data-active={pathname === "/"}>
            Home
          </Link>
          <Link href="/map" className={styles.navLink} data-active={isMapPage && !store.isSearchOpen}>
            Map
          </Link>
          <button
            type="button"
            className={styles.navLink}
            data-active={store.isSearchOpen}
            onClick={handleSearchClick}
          >
            Search
          </button>
          <Link href="/map?help=true" className={styles.navLink}>
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

