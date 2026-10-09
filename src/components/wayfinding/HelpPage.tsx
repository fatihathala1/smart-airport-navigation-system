"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, ChevronDown, Flag, MapPin, Navigation2, Search } from "lucide-react";
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
    reminderText: "Peta 3D saat ini hanya mencakup Terminal 1 lantai dasar. Data dan rute perlu diverifikasi di lapangan; ikuti petunjuk resmi bandara untuk perjalanan sebenarnya.",
    passengerTitle: "Dari tiba di bandara sampai naik pesawat.",
    passengerIntro: "Ikuti urutan keberangkatan ini setelah mengetahui maskapai dan nomor penerbanganmu.",
    passengerNote: "Denah lantai 2 sudah tersedia, tetapi rute otomatis dari lantai dasar ke gate belum aktif di Maps. Cocokkan selalu nomor gate dan waktu boarding dengan layar informasi serta arahan petugas.",
    passengerSteps: [
      { floor: "Lantai dasar", title: "Cari area Departure maskapaimu", description: "Cek papan informasi keberangkatan atau tanyakan kepada maskapai, lalu menuju Departure 1, 2, 3, atau 4 yang ditentukan. Departure adalah area check-in, bukan nomor loket." },
      { floor: "Lantai dasar", title: "Check-in dan ambil boarding pass", description: "Datangi konter maskapai di area Departure yang sesuai atau gunakan kios jika tersedia. Simpan boarding pass/tiket untuk melihat informasi penerbanganmu." },
      { floor: "Sebelum menuju gate", title: "Pastikan nomor gate", description: "Lihat nomor gate di boarding pass atau layar informasi bandara. Jika belum tercantum, pantau layar informasi karena gate dapat diumumkan atau berubah." },
      { floor: "Lantai 2", title: "Naik ke lantai 2 dan temukan gate", description: "Ikuti papan petunjuk Keberangkatan ke lantai 2, lalui pemeriksaan sesuai arahan terminal, kemudian ikuti papan nomor gate sampai ruang tunggu. Minta bantuan petugas jika petunjuknya tidak jelas." },
      { floor: "Di gate", title: "Boarding dan masuk pesawat", description: "Saat boarding dibuka, cocokkan nomor penerbangan dan gate sekali lagi. Siapkan boarding pass dan ikuti arahan petugas hingga masuk ke pesawat." },
    ],
    faqEyebrow: "PERTANYAAN UMUM",
    faqTitle: "Kalau masih ragu, mulai dari sini.",
    closingTitle: "Siap mencoba sendiri?",
    closingEyebrow: "SIAP MENJELAJAH",
    closingText: "Buka peta, pilih titik awal dan tujuan, lalu lihat bagaimana rute ditampilkan.",
    steps: [
      {
        short: "Cari lokasi", title: "Temukan tempat yang dituju.",
        desc: "Di halaman Maps, cari kode building seperti T1-GF-01 atau pilih building langsung pada model 3D untuk melihat detailnya.",
        tips: ["Pencarian memakai kode object.name pada model.", "Pilih hasil pencarian untuk menyorot building di peta."],
        action: "Buka peta", href: "/map",
      },
      {
        short: "Tentukan posisi", title: "Tentukan titik awalmu.",
        desc: "Pilih sebuah building, lalu tekan Start Here. Kamu juga bisa menekan Set Start dan memilih building, node, atau POI pada peta.",
        tips: ["Periksa label titik awal sebelum memilih tujuan.", "Titik awal dipilih manual, bukan dari GPS."],
        action: "Coba di peta", href: "/map",
      },
      {
        short: "Ikuti rute", title: "Baca rute menuju tujuan.",
        desc: "Cari dan pilih building tujuan, lalu tekan Route Here. Jalur, jarak, dan petunjuk navigasi akan tampil jika kedua titik terhubung.",
        tips: ["Periksa titik awal dan tujuan sebelum mengikuti rute.", "Jika rute tidak tersedia, coba building lain yang terhubung."],
        action: "Rencanakan rute", href: "/map",
      },
      {
        short: "Ubah tampilan", title: "Lihat rute dari sudut pengunjung.",
        desc: "Gunakan Visitor POV untuk melihat dari titik awal, Map View untuk kembali ke tampilan atas, atau Reset Route untuk menghapus pilihan rute.",
        tips: ["Gunakan tombol zoom dan reset view bila peta sulit dilihat.", "Rute otomatis menuju gate di lantai 2 belum aktif di Maps."],
        action: "Lihat peta 3D", href: "/map",
      },
    ],
    faq: [
      { q: "Bagaimana kalau saya tidak tahu posisi awal?", a: "Pilih building atau node terdekat secara manual melalui Set Start. Peta ini belum mendeteksi posisi secara otomatis." },
      { q: "Mengapa rute tidak muncul?", a: "Pastikan titik awal sudah ditetapkan dan building tujuan terhubung pada jaringan navigasi. Coba tujuan lain bila jalur tidak ditemukan." },
      { q: "Apakah peta ini sudah bisa dipakai sebagai panduan bandara nyata?", a: "Belum sebagai satu-satunya panduan. Cakupannya baru Terminal 1 lantai dasar dan data harus diverifikasi di lokasi. Ikuti petunjuk resmi terminal." },
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
    reminderText: "The current 3D map covers Terminal 1 ground floor only. Location data and routes need on-site verification; follow official airport signs for real journeys.",
    passengerTitle: "From arriving at the airport to boarding your flight.",
    passengerIntro: "Follow these departure steps once you know your airline and flight number.",
    passengerNote: "A second-floor plan is available, but automated routes from the ground floor to gates are not active in Maps yet. Always confirm your gate and boarding time on airport displays and with staff.",
    passengerSteps: [
      { floor: "Ground floor", title: "Find your airline's Departure area", description: "Check the departure display or ask your airline, then head to the assigned Departure 1, 2, 3, or 4. Departure identifies a check-in area, not a specific counter." },
      { floor: "Ground floor", title: "Check in and get your boarding pass", description: "Go to your airline's counter in the correct Departure area, or use a kiosk if available. Keep your boarding pass for your flight details." },
      { floor: "Before heading to the gate", title: "Confirm your gate number", description: "Find the gate on your boarding pass or an airport information display. If it has not been announced, keep checking the displays because gates may change." },
      { floor: "Second floor", title: "Go upstairs and find your gate", description: "Follow Departure signs to the second floor, complete screening as directed in the terminal, then follow your gate number to the waiting area. Ask airport staff if the signs are unclear." },
      { floor: "At the gate", title: "Board your flight", description: "When boarding begins, check the flight number and gate once more. Have your boarding pass ready and follow staff directions onto the aircraft." },
    ],
    faqEyebrow: "COMMON QUESTIONS",
    faqTitle: "Still unsure? Start here.",
    closingTitle: "Ready to try it?",
    closingEyebrow: "READY TO GO",
    closingText: "Open the map, choose a starting point and destination, then see how a route appears.",
    steps: [
      { short: "Find a place", title: "Find where you want to go.", desc: "On Maps, search for a building code such as T1-GF-01 or select a building directly on the 3D model to see its details.", tips: ["Search uses the model's object.name codes.", "Choose a result to highlight the building."], action: "Open map", href: "/map" },
      { short: "Set your position", title: "Choose your starting point.", desc: "Select a building and press Start Here. You can also press Set Start, then select a building, node, or POI on the map.", tips: ["Check the start label before choosing a destination.", "The start is selected manually, not through GPS."], action: "Try on map", href: "/map" },
      { short: "Follow the route", title: "Read the route to your destination.", desc: "Search for and select a destination building, then press Route Here. The path, distance, and guidance appear if the endpoints are connected.", tips: ["Check both endpoints before following the route.", "If no route is available, try another connected building."], action: "Plan a route", href: "/map" },
      { short: "Change view", title: "See the route from a visitor's view.", desc: "Use Visitor POV to look from the starting point, Map View to return to the overhead view, or Reset Route to clear the selected route.", tips: ["Use zoom and reset view if the map is hard to see.", "Automated routes to second-floor gates are not active in Maps yet."], action: "Explore the 3D map", href: "/map" },
    ],
    faq: [
      { q: "What if I don't know my starting point?", a: "Choose the nearest building or node manually with Set Start. Automatic positioning is not available yet." },
      { q: "Why can't I see a route?", a: "Make sure a start is set and the destination building is connected to the navigation graph. Try another destination if no path is found." },
      { q: "Can I rely on this for a real airport journey?", a: "Not as the only guide. Coverage is limited to Terminal 1 ground floor and the data needs on-site verification. Follow official terminal signs." },
    ],
  },
} as const;

const icons = [Search, Flag, Navigation2, MapPin] as const;

function StepPreview({ active, lang }: { active: number; lang: "ID" | "EN" }) {
  const id = lang === "ID";
  return (
    <div className={styles.previewScene} key={active} aria-hidden="true">
      <div className={styles.previewTop}><span className={styles.previewBrand}>JUANDA <b>MAP</b></span><span className={styles.previewDots}><i /><i /><i /></span></div>
      {active === 0 && <div className={styles.searchScene}>
        <div className={styles.mockSearch}><Search size={17} /><span>T1-GF-01</span></div>
        <div className={styles.mockCategory}><span>TERMINAL 1</span><span>GROUND FLOOR</span></div>
        <div className={styles.mockResult}><span className={styles.resultIcon}><MapPin size={17} /></span><span><strong>T1-GF-01</strong><small>{id ? "Building pada model 3D" : "Building in the 3D model"}</small></span><ArrowRight size={16} /></div>
        <div className={styles.mockResult}><span className={styles.resultIcon}><MapPin size={17} /></span><span><strong>T1-GF-02</strong><small>{id ? "Building pada model 3D" : "Building in the 3D model"}</small></span><ArrowRight size={16} /></div>
      </div>}
      {active === 1 && <div className={styles.qrScene}>
        <div className={styles.qrGlyph}><Flag size={66} strokeWidth={1.35} /></div>
        <div className={styles.qrCopy}><span className={styles.mockPill}>START HERE</span><strong>{id ? "Titik awal ditetapkan" : "Starting point set"}</strong><span>T1-GF-01 · Terminal 1</span></div>
        <span className={styles.qrCheck}><Check size={20} /></span>
      </div>}
      {active === 2 && <div className={styles.routeScene}>
        <div className={styles.routeStats}><span>{id ? "RUTE DITEMUKAN" : "ROUTE FOUND"}</span><strong>ROUTE HERE</strong></div>
        <svg className={styles.routeMap} viewBox="0 0 450 210" fill="none" role="presentation"><path className={styles.mapCorridor} d="M20 42H155V85H248V45H425M40 175H145V122H345V175H425M79 20V189M385 20V189" /><path className={styles.routeLine} d="M70 160H145V122H248V85H382V48" /><circle cx="70" cy="160" r="12" fill="#00A3DC" stroke="white" strokeWidth="5" /><circle cx="382" cy="48" r="12" fill="#12A875" stroke="white" strokeWidth="5" /></svg>
        <div className={styles.routeLabels}><span>{id ? "Titik awal" : "Start"}</span><span>{id ? "Tujuan" : "Destination"}</span></div>
      </div>}
      {active === 3 && <div className={styles.floorScene}>
        <div className={styles.floorPicker}><span>{id ? "KONTROL TAMPILAN" : "VIEW CONTROLS"}</span><strong className={styles.floorActive}>Visitor POV</strong><strong>Map View</strong></div>
        <div className={styles.floorMap}><div className={styles.floorGrid}><span className={styles.floorBlockA} /><span className={styles.floorBlockB} /><span className={styles.floorBlockC} /><span className={styles.floorBlockD} /><span className={styles.floorPoint}><Navigation2 size={17} /></span></div><span className={styles.floorCaption}>TERMINAL 1 · GF</span></div>
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
            <div className={styles.heroEyebrow}>
              <span className={styles.heroEyebrowDot} aria-hidden="true" />
              {lang === "ID" ? "PANDUAN WAYFINDING · TERMINAL 1" : "WAYFINDING GUIDE · TERMINAL 1"}
            </div>
            <h1 id="help-title">{t.title}</h1>
            <p>{t.intro}</p>
            <div className={styles.heroActions}><a className={styles.primaryButton} href="#panduan"><span>{t.start}</span><ArrowRight size={19} /></a><Link className={styles.ghostButton} href="/map">{t.map}<ArrowRight size={17} /></Link></div>
            <div className={styles.heroMeta} aria-label={lang === "ID" ? "Ringkasan panduan" : "Guide summary"}>
              <span><strong>04</strong> {lang === "ID" ? "langkah inti" : "core steps"}</span>
              <span className={styles.heroMetaDivider} aria-hidden="true" />
              <span><strong>3D</strong> {lang === "ID" ? "peta interaktif" : "interactive map"}</span>
            </div>
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

      <section className={styles.passengerSection} aria-labelledby="passenger-title">
        <div className={styles.passengerInner}>
          <div className={styles.passengerHeading}>
            <h2 id="passenger-title">{t.passengerTitle}</h2>
            <p>{t.passengerIntro}</p>
          </div>
          <ol className={styles.passengerSteps}>
            {t.passengerSteps.map((item, index) => (
              <li key={item.title} className={styles.passengerStep}>
                <span className={styles.passengerNumber} aria-hidden="true">0{index + 1}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
                <span className={styles.passengerFloor}>{item.floor}</span>
              </li>
            ))}
          </ol>
          <p className={styles.passengerNote}>{t.passengerNote}</p>
        </div>
      </section>

      <section className={styles.faqSection} aria-labelledby="faq-title"><div className={styles.faqInner}><div className={styles.faqHeading}><span className={styles.kicker}>{t.faqEyebrow}</span><h2 id="faq-title">{t.faqTitle}</h2></div><div className={styles.faqList}>{t.faq.map((item, index) => <details key={item.q}><summary><span>0{index + 1}</span><strong>{item.q}</strong><ChevronDown size={19} /></summary><p>{item.a}</p></details>)}</div></div></section>
      <section className={styles.closing}><div><span className={styles.kicker}>{t.closingEyebrow}</span><h2>{t.closingTitle}</h2><p>{t.closingText}</p></div><Link href="/map" className={styles.primaryButton}>{t.map}<ArrowRight size={19} /></Link></section>
    </main>
    <SiteFooter />
  </div>;
}
