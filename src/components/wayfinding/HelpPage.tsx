"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, ChevronDown, Layers3, MapPin, Navigation2, QrCode, Search } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { useMapStore } from "@/store/mapStore";
import styles from "./HelpPage.module.css";

const guides = {
  ID: {
    title: "Dari bingung mencari arah, jadi tahu langkah berikutnya.",
    intro: "Ikuti empat langkah singkat untuk mencari tempat, menentukan posisi, dan membaca petunjuk rute di terminal.",
    start: "Mulai panduan",
    map: "Buka peta",
    sectionEyebrow: "CARA MENGGUNAKAN",
    sectionTitle: "Satu langkah pada satu waktu.",
    sectionIntro: "Pilih langkah yang ingin dipelajari. Contoh tampilan akan berganti agar kamu tahu apa yang perlu dilakukan di peta.",
    step: "LANGKAH",
    next: "Langkah berikutnya",
    previous: "Sebelumnya",
    tryIt: "Coba di peta",
    preview: "CONTOH TAMPILAN",
    previewNote: "Ilustrasi antarmuka, bukan posisi terminal secara langsung.",
    reminder: "Perlu diketahui",
    reminderText: "Peta dan lokasi yang tampil saat ini merupakan data simulasi. Peta 3D dan navigasi lengkap masih dalam pengembangan; ikuti petunjuk bandara di lokasi untuk perjalanan sebenarnya.",
    faqEyebrow: "PERTANYAAN UMUM",
    faqTitle: "Kalau masih ragu, mulai dari sini.",
    closingTitle: "Siap mencoba sendiri?",
    closingEyebrow: "SIAP MENJELAJAH",
    closingText: "Buka peta, pilih titik awal dan tujuan, lalu lihat bagaimana rute ditampilkan.",
    steps: [
      {
        short: "Cari lokasi", title: "Temukan tempat yang dituju.",
        desc: "Buka menu Search, masukkan nama lokasi atau pilih kategori fasilitas. Kamu juga bisa memilih area langsung pada peta untuk melihat detailnya.",
        tips: ["Pilih terminal dan lantai yang sesuai.", "Ketuk hasil pencarian untuk menyorot lokasinya di peta."],
        action: "Buka pencarian", href: "/map?directory=true",
      },
      {
        short: "Tentukan posisi", title: "Tentukan titik awalmu.",
        desc: "Pilih lokasi awal pada peta. Untuk mencoba alur QR, gunakan simulasi titik standee yang tersedia; peta akan menempatkan posisimu pada titik tersebut.",
        tips: ["Pastikan terminal dan lantai titik awal sudah benar.", "Simulasi QR tidak membaca posisi GPS secara otomatis."],
        action: "Coba di peta", href: "/map",
      },
      {
        short: "Ikuti rute", title: "Baca rute menuju tujuan.",
        desc: "Setelah titik awal dan tujuan dipilih, tekan tombol petunjuk arah. Jalur yang tersedia, jarak, dan perkiraan waktu jalan akan muncul di peta.",
        tips: ["Perhatikan titik awal dan tujuan sebelum berjalan.", "Jika rute tidak tersedia, coba pilih lokasi lain yang terhubung."],
        action: "Rencanakan rute", href: "/map",
      },
      {
        short: "Pindah lantai", title: "Periksa lantai dan fasilitas sekitar.",
        desc: "Gunakan pemilih lantai untuk melihat area tujuan di lantai lain. Filter fasilitas membantu menemukan lokasi yang kamu perlukan di lantai yang sedang dilihat.",
        tips: ["Periksa indikator lantai setiap kali mengubah tampilan.", "Ikuti papan petunjuk bandara untuk perpindahan lantai nyata."],
        action: "Jelajahi lantai", href: "/map",
      },
    ],
    faq: [
      { q: "Bagaimana kalau saya tidak tahu posisi awal?", a: "Pilih titik awal secara manual pada peta. Kamu juga dapat mencoba simulasi QR standee untuk mengisi titik awal dari lokasi contoh." },
      { q: "Mengapa rute tidak muncul?", a: "Beberapa pasangan lokasi pada data simulasi belum tersambung jalur. Pastikan titik awal dan tujuan sudah dipilih, lalu coba lokasi lain." },
      { q: "Apakah peta ini sudah bisa dipakai sebagai panduan bandara nyata?", a: "Belum. Data lokasi saat ini masih simulasi dan peta 3D sedang disiapkan. Untuk perjalanan nyata, tetap ikuti petunjuk resmi di terminal." },
    ],
  },
  EN: {
    title: "From finding your bearings to knowing your next step.",
    intro: "Follow four short steps to find a place, set your position, and read a route through the terminal.",
    start: "Start the guide",
    map: "Open map",
    sectionEyebrow: "HOW IT WORKS",
    sectionTitle: "One step at a time.",
    sectionIntro: "Choose a step to explore. The screen example changes with it, so you can see what to do on the map.",
    step: "STEP",
    next: "Next step",
    previous: "Previous",
    tryIt: "Try on map",
    preview: "SCREEN PREVIEW",
    previewNote: "Interface illustration, not a live terminal position.",
    reminder: "Good to know",
    reminderText: "The current map and locations use demo data. The 3D map and complete navigation are still in development; follow on-site airport signs for real journeys.",
    faqEyebrow: "COMMON QUESTIONS",
    faqTitle: "Still unsure? Start here.",
    closingTitle: "Ready to try it?",
    closingEyebrow: "READY TO GO",
    closingText: "Open the map, choose a starting point and destination, then see how a route appears.",
    steps: [
      { short: "Find a place", title: "Find where you want to go.", desc: "Open Search, enter a location name, or choose a facility category. You can also select an area directly on the map to view its details.", tips: ["Choose the correct terminal and floor.", "Select a search result to highlight it on the map."], action: "Open search", href: "/map?directory=true" },
      { short: "Set your position", title: "Choose your starting point.", desc: "Select a start location on the map. To try the QR flow, use one of the available standee simulations; the map places you at that point.", tips: ["Check your starting terminal and floor.", "The QR simulation does not detect your GPS position."], action: "Try on map", href: "/map" },
      { short: "Follow the route", title: "Read the route to your destination.", desc: "After choosing a start and destination, request directions. An available path, distance, and estimated walk time will appear on the map.", tips: ["Check both endpoints before walking.", "If no route is available, try another connected location."], action: "Plan a route", href: "/map" },
      { short: "Change floors", title: "Check floors and nearby facilities.", desc: "Use the floor selector to inspect a destination on another floor. Facility filters help you find places on the floor currently shown.", tips: ["Check the floor indicator whenever the view changes.", "Follow airport signage when changing floors in real life."], action: "Explore floors", href: "/map" },
    ],
    faq: [
      { q: "What if I don't know my starting point?", a: "Choose a starting point manually on the map. You can also try the QR standee simulation to fill it from a sample location." },
      { q: "Why can't I see a route?", a: "Some location pairs in the demo data are not connected. Make sure a start and destination are selected, then try a different place." },
      { q: "Can I rely on this for a real airport journey?", a: "Not yet. Location data is simulated and the 3D map is being prepared. Please follow official signage in the terminal for real travel." },
    ],
  },
} as const;

const icons = [Search, QrCode, Navigation2, Layers3] as const;

function StepPreview({ active, lang }: { active: number; lang: "ID" | "EN" }) {
  const id = lang === "ID";
  return (
    <div className={styles.previewScene} key={active} aria-hidden="true">
      <div className={styles.previewTop}><span className={styles.previewBrand}>JUANDA <b>MAP</b></span><span className={styles.previewDots}><i /><i /><i /></span></div>
      {active === 0 && <div className={styles.searchScene}>
        <div className={styles.mockSearch}><Search size={17} /><span>{id ? "Cari gate, fasilitas, atau lokasi..." : "Search gates, facilities, places..."}</span><span className={styles.mockShortcut}>⌘ K</span></div>
        <div className={styles.mockCategory}><span>{id ? "Semua" : "All"}</span><span>{id ? "Fasilitas" : "Facilities"}</span><span>{id ? "Makanan" : "Food"}</span></div>
        <div className={styles.mockResult}><span className={styles.resultIcon}><MapPin size={17} /></span><span><strong>{id ? "Pintu Masuk Terminal 1" : "Terminal 1 Entrance"}</strong><small>Terminal 1 · {id ? "Lantai 1" : "Floor 1"}</small></span><ArrowRight size={16} /></div>
        <div className={styles.mockResult}><span className={styles.resultIcon}><MapPin size={17} /></span><span><strong>{id ? "Area Keberangkatan" : "Departure Area"}</strong><small>Terminal 1 · {id ? "Lantai 1" : "Floor 1"}</small></span><ArrowRight size={16} /></div>
      </div>}
      {active === 1 && <div className={styles.qrScene}>
        <div className={styles.qrGlyph}><QrCode size={66} strokeWidth={1.35} /></div>
        <div className={styles.qrCopy}><span className={styles.mockPill}>{id ? "SIMULASI QR STANDEE" : "QR STANDEE SIMULATION"}</span><strong>{id ? "Titik awal ditemukan" : "Starting point set"}</strong><span>{id ? "Terminal 1 · Lantai 1" : "Terminal 1 · Floor 1"}</span></div>
        <span className={styles.qrCheck}><Check size={20} /></span>
      </div>}
      {active === 2 && <div className={styles.routeScene}>
        <div className={styles.routeStats}><span>{id ? "RUTE DITEMUKAN" : "ROUTE FOUND"}</span><strong>420 m <i /> 6 min</strong></div>
        <svg className={styles.routeMap} viewBox="0 0 450 210" fill="none" role="presentation"><path className={styles.mapCorridor} d="M20 42H155V85H248V45H425M40 175H145V122H345V175H425M79 20V189M385 20V189" /><path className={styles.routeLine} d="M70 160H145V122H248V85H382V48" /><circle cx="70" cy="160" r="12" fill="#00A3DC" stroke="white" strokeWidth="5" /><circle cx="382" cy="48" r="12" fill="#12A875" stroke="white" strokeWidth="5" /></svg>
        <div className={styles.routeLabels}><span>{id ? "Titik awal" : "Start"}</span><span>{id ? "Tujuan" : "Destination"}</span></div>
      </div>}
      {active === 3 && <div className={styles.floorScene}>
        <div className={styles.floorPicker}><span>{id ? "PILIH LANTAI" : "SELECT FLOOR"}</span><strong className={styles.floorActive}>{id ? "Lantai 1" : "Floor 1"}</strong><strong>{id ? "Lantai 2" : "Floor 2"}</strong></div>
        <div className={styles.floorMap}><div className={styles.floorGrid}><span className={styles.floorBlockA} /><span className={styles.floorBlockB} /><span className={styles.floorBlockC} /><span className={styles.floorBlockD} /><span className={styles.floorPoint}><Layers3 size={17} /></span></div><span className={styles.floorCaption}>TERMINAL 1 · L1</span></div>
      </div>}
      <div className={styles.previewBottom}><span><span className={styles.liveDot} /> {id ? "PRATINJAU INTERAKTIF" : "INTERACTIVE PREVIEW"}</span><span>0{active + 1} / 04</span></div>
    </div>
  );
}

export function HelpPage() {
  const lang = useMapStore((state) => state.lang);
  const t = guides[lang];
  const [active, setActive] = useState(0);
  const current = t.steps[active];

  return <div className={styles.page}>
    <SiteHeader />
    <main>
      <section className={styles.hero} aria-labelledby="help-title">
        <div className={styles.heroGlow} aria-hidden="true" />
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <h1 id="help-title">{t.title}</h1>
            <p>{t.intro}</p>
            <div className={styles.heroActions}><a className={styles.primaryButton} href="#panduan"><span>{t.start}</span><ArrowRight size={19} /></a><Link className={styles.ghostButton} href="/map">{t.map}<ArrowRight size={17} /></Link></div>
          </div>
          <div className={styles.heroArt} aria-hidden="true">
            <span className={styles.heroArtLabel}>TERMINAL WAYFINDING / 01—04</span>
            <svg viewBox="0 0 560 400" fill="none"><path className={styles.heroGrid} d="M20 55H540M20 145H540M20 235H540M20 325H540M85 20V380M200 20V380M320 20V380M440 20V380" /><path className={styles.heroTrack} d="M82 310H186V228H315V135H470V65" /><path className={styles.heroRoute} d="M82 310H186V228H315V135H470V65" /><circle cx="82" cy="310" r="18" fill="#0AA5DA" stroke="#D8F6FF" strokeWidth="7" /><circle cx="470" cy="65" r="18" fill="#34D3A0" stroke="#D9FFF1" strokeWidth="7" /><circle cx="315" cy="135" r="5" fill="white" /></svg>
            <span className={`${styles.heroLabel} ${styles.labelStart}`}>01 / START</span><span className={`${styles.heroLabel} ${styles.labelFinish}`}>04 / DESTINATION</span>
          </div>
        </div>
      </section>

      <section className={styles.guideSection} id="panduan" aria-labelledby="guide-title">
        <div className={styles.sectionHeading}><span className={styles.kicker}>{t.sectionEyebrow}</span><h2 id="guide-title">{t.sectionTitle}</h2><p>{t.sectionIntro}</p></div>
        <div className={styles.guideLayout}>
          <nav className={styles.stepNav} aria-label={lang === "ID" ? "Langkah panduan" : "Guide steps"}>
            <span className={styles.navCaption}>{lang === "ID" ? "ALUR PENGGUNAAN" : "YOUR JOURNEY"}</span>
            {t.steps.map((item, index) => { const Icon = icons[index]; return <button key={item.short} type="button" onClick={() => setActive(index)} className={styles.stepButton} data-active={active === index} aria-current={active === index ? "step" : undefined} aria-controls="step-content"><span className={styles.stepIcon}><Icon size={21} strokeWidth={1.8} /></span><span className={styles.stepButtonCopy}><small>0{index + 1}</small><strong>{item.short}</strong></span><ArrowRight className={styles.stepArrow} size={16} /></button>; })}
            <span className={styles.navFoot}>{lang === "ID" ? "Klik langkah untuk melihat contoh" : "Select a step to see an example"}</span>
          </nav>
          <div className={styles.stepContent} id="step-content" aria-live="polite">
            <div className={styles.stepText} key={`text-${active}`}>
              <span className={styles.stepEyebrow}>{t.step} 0{active + 1} <span className={styles.stepDash} /> 04</span>
              <h3>{current.title}</h3><p>{current.desc}</p>
              <ul>{current.tips.map((tip) => <li key={tip}><Check size={16} /><span>{tip}</span></li>)}</ul>
              <Link className={styles.stepCta} href={current.href}>{current.action}<ArrowRight size={17} /></Link>
            </div>
            <div className={styles.previewWrap}><div className={styles.previewHeading}><span>{t.preview}</span><span>{t.previewNote}</span></div><StepPreview active={active} lang={lang} /></div>
            <div className={styles.stepControls}><span>0{active + 1} / 04</span><div><button type="button" onClick={() => setActive((value) => Math.max(0, value - 1))} disabled={active === 0} aria-label={t.previous}><ArrowLeft size={18} /><span>{t.previous}</span></button><button type="button" onClick={() => setActive((value) => Math.min(3, value + 1))} disabled={active === 3} aria-label={t.next}><span>{t.next}</span><ArrowRight size={18} /></button></div></div>
          </div>
        </div>
        <aside className={styles.notice}><span className={styles.noticeIcon}>i</span><div><strong>{t.reminder}</strong><p>{t.reminderText}</p></div></aside>
      </section>

      <section className={styles.faqSection} aria-labelledby="faq-title"><div className={styles.faqInner}><div className={styles.faqHeading}><span className={styles.kicker}>{t.faqEyebrow}</span><h2 id="faq-title">{t.faqTitle}</h2></div><div className={styles.faqList}>{t.faq.map((item, index) => <details key={item.q}><summary><span>0{index + 1}</span><strong>{item.q}</strong><ChevronDown size={19} /></summary><p>{item.a}</p></details>)}</div></div></section>
      <section className={styles.closing}><div><span className={styles.kicker}>{t.closingEyebrow}</span><h2>{t.closingTitle}</h2><p>{t.closingText}</p></div><Link href="/map" className={styles.primaryButton}>{t.map}<ArrowRight size={19} /></Link></section>
    </main>
    <SiteFooter />
  </div>;
}
