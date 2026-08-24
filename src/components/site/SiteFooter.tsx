import Image from "next/image";
import styles from "./SiteChrome.module.css";

const footerGroups = [
  {
    title: "Tentang Kami",
    links: ["Profil Kami", "Kontak Kami"],
    secondaryTitle: "Informasi & Profil Bandara",
  },
  {
    title: "Hubungan Investor",
    links: ["Laporan Tahunan"],
    secondaryTitle: "Keberlanjutan",
    secondaryLinks: ["Laporan Keberlanjutan"],
  },
  {
    title: "Publikasi",
    links: ["Berita", "Tata Kelola Perusahaan", "Kebijakan Privasi"],
  },
];

function toAnchor(label: string) {
  return `#${label.toLocaleLowerCase("id-ID").replaceAll("&", "dan").replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/(^-|-$)/g, "")}`;
}

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerGrid}>
        {footerGroups.map((group) => (
          <section className={styles.footerGroup} key={group.title}>
            <h2>{group.title}</h2>
            {group.links.map((link) => <a href={toAnchor(link)} key={link}>{link}</a>)}
            {group.secondaryTitle && <h2 className={styles.secondaryTitle}>{group.secondaryTitle}</h2>}
            {group.secondaryLinks?.map((link) => <a href={toAnchor(link)} key={link}>{link}</a>)}
          </section>
        ))}

        <section className={styles.companyDetails}>
          <p className={styles.detailLabel}>Member Of</p>
          <Image
            className={styles.memberMark}
            src="/injourney-tourism-white.png"
            width={220}
            height={60}
            alt="InJourney Indonesia Aviation and Tourism"
          />
          <p className={styles.detailLabel}>Alamat Kami</p>
          <address>
            Jl. Ir. Haji Juanda, Betro, Kecamatan Sedati, Kabupaten Sidoarjo, Jawa Timur 61253.
          </address>
        </section>

        <section className={styles.footerBrand}>
          <Image src="/injourney-airports-white.png" width={272} height={94} alt="InJourney Airports" />
          <p>PT Angkasa Pura Indonesia</p>
          <a href="https://www.injourneyairports.id">www.injourneyairports.id</a>
        </section>
      </div>
      <p className={styles.copyright}>PT Angkasa Pura Indonesia © 2024. All Rights Reserved</p>
    </footer>
  );
}
