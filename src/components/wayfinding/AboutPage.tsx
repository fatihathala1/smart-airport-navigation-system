"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowRight,
  Compass,
  Layers,
  MapPin,
  Route,
  Search,
  Sparkles,
  Smartphone,
  CheckCircle2,
  PlaneTakeoff,
  Building2,
} from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { useMapStore } from "@/store/mapStore";
import styles from "./AboutPage.module.css";

const OverviewMap = dynamic(
  () => import("@/components/map2d/JuandaOverviewMap").then((module) => module.JuandaOverviewMap),
  { ssr: false },
);

const aboutContent = {
  ID: {
    heroEyebrow: "TENTANG TODJUANDA",
    heroTitlePrefix: "Inovasi Navigasi Cerdas di ",
    heroTitleAccent: "Bandar Udara Internasional Juanda",
    heroDesc:
      "ToDjuanda adalah platform navigasi dalam ruangan (indoor wayfinding) berbasis web 3D interaktif yang dirancang khusus untuk memandu penumpang di Terminal 1 Bandara Internasional Juanda Surabaya (SUB). Menghubungkan titik awal ke gate keberangkatan, konter maskapai, dan fasilitas vital secara presisi dan efisien.",
    openMap: "Buka Peta 3D",
    openGuide: "Panduan Penggunaan",
    stats: {
      floors: "2 Lantai Terpadu",
      floorsSub: "GF & Lantai 2",
      web: "100% Web-Based",
      webSub: "Akses Tanpa Aplikasi",
      algo: "Algoritma A*",
      algoSub: "Rute Multi-Lantai Tercepat",
      speed: "72 m/menit",
      speedSub: "Estimasi Waktu Tempuh",
    },
    showcase: {
      brand: "Peta Bandara Juanda",
      caption: "Klik Terminal 1 untuk masuk peta 3D",
      loading: "Memuat peta...",
      pills: [
        { label: "Pintu Masuk & Check-in", icon: "building" },
        { label: "Gate Keberangkatan 1-12", icon: "plane" },
        { label: "Konektor Eskalator/Tangga", icon: "layers" },
        { label: "Direktori F&B & Fasilitas", icon: "search" },
      ],
    },
    visionSection: {
      eyebrow: "LATAR BELAKANG & VISI",
      title: "Solusi Navigasi untuk Pengalaman Bandara yang Lebih Nyaman",
      lead:
        "Bandara Internasional Juanda (SUB) di bawah naungan PT Angkasa Pura Indonesia (InJourney Airports) merupakan salah satu gerbang udara tersibuk di Indonesia. Dengan mobilitas ribuan penumpang setiap hari di Terminal 1, kemudahan orientasi arah di dalam gedung menjadi kunci kenyamanan dan ketepatan waktu perjalanan.",
      cardKicker: "MISI & KOMITMEN KAMI",
      cardTitle: "Navigasi Cepat, Akurat, dan Ramah Pengguna",
      cardDesc:
        "Seringkali penumpang menghadapi tantangan menemukan gate keberangkatan tepat waktu, kebingungan alur antar lantai melalui eskalator, atau kesulitan menemukan fasilitas penting. ToDjuanda memadukan visualisasi Digital Twin 3D dan algoritma heuristik A* agar setiap penumpang dapat melangkah dengan percaya diri dari drop zone hingga boarding pesawat.",
      cardStats: [
        { value: "0 Detik", label: "Tanpa instalasi aplikasi tambahan" },
        { value: "100%", label: "Cakupan area publik Terminal 1" },
        { value: "A* Engine", label: "Algoritma rute tercepat" },
      ],
      benefits: [
        {
          badge: "Spasial 3D",
          title: "Orientasi Spasial yang Mudah",
          desc: "Visualisasi 3D membantu penumpang memahami bentuk gedung, posisi lantai, dan koridor terminal secara realistis.",
        },
        {
          badge: "A* Heuristik",
          title: "Rute Realistis Antarlantai",
          desc: "Perhitungan rute memperhitungkan tangga dan eskalator terarah dengan panduan belokan demi belokan.",
        },
        {
          badge: "Tepat Waktu",
          title: "Efisien Waktu Menjelang Penerbangan",
          desc: "Mengetahui jarak tempuh dan estimasi waktu berjalan menuju boarding gate sehingga tidak ketinggalan pesawat.",
        },
      ],
    },
    featuresSection: {
      eyebrow: "FITUR UNGGULAN",
      title: "Dirancang Cerdas untuk Segala Kebutuhan Penumpang",
      desc: "Setiap fitur ToDjuanda dibangun dengan fokus pada kemudahan interaksi, kecepatan akses, dan akurasi data fasilitas terminal.",
      items: [
        {
          tag: "DIGITAL TWIN",
          title: "Peta 3D Multi-Lantai Terpadu",
          desc: "Menampilkan denah Terminal 1 Juanda (Lantai Dasar & Lantai 2) dalam satu model terintegrasi dengan transisi antar lantai yang mulus tanpa jeda muat.",
          points: [
            "Peralihan lantai instan (GF, L2, Semua Gedung)",
            "Kontrol orbit kamera, putar, dan cubit zoom responsif",
            "Visualisasi apron luar dan garbarata pesawat",
          ],
          link: "Eksplorasi Peta",
          href: "/map",
        },
        {
          tag: "A* ROUTE ENGINE",
          title: "Algoritma Navigasi Antarlantai (A*)",
          desc: "Mesin pencarian rute cerdas bertenaga algoritma A* (A-Star) yang menghitung lintasan pejalan kaki tercepat dan paling efisien berbasis grid lorong yang dapat dilalui (walkable grid).",
          points: [
            "Heuristik cerdas mendeteksi rute tercepat",
            "Mendukung tangga dan eskalator searah (naik/turun)",
            "Estimasi jarak tempuh riil dan waktu tempuh (ETA)",
          ],
          link: "Coba Navigasi",
          href: "/map",
        },
        {
          tag: "OMNI-SEARCH",
          title: "Pencarian Tenant & Fasilitas Seketika",
          desc: "Temukan lokasi boarding gate, konter check-in maskapai, restoran, kafe, mushola, toilet, dan ATM secara cepat dengan autocomplete.",
          points: [
            "Pencarian cepat berdasarkan nama atau kategori",
            "Filter kategori tenant F&B, ritel, dan layanan umum",
            "Pilihan rute langsung ke titik tujuan dalam satu sentuhan",
          ],
          link: "Cari Fasilitas",
          href: "/map",
        },
        {
          tag: "MULTI-DEVICE",
          title: "Responsif di Smartphone & Kiosk",
          desc: "Antarmuka fleksibel yang dapat diakses melalui browser ponsel penumpang, tablet petugas, maupun terminal layar sentuh (kiosk) di area bandara.",
          points: [
            "Ringan dan cepat diakses melalui pemindaian QR code",
            "UI sentuh yang intuitif dan mudah dipelajari",
            "Dukungan multibahasa (Indonesia & Inggris)",
          ],
          link: "Lihat Panduan",
          href: "/help",
        },
      ],
    },
    journeySection: {
      eyebrow: "ALUR PENUMPANG",
      title: "Mendampingi Tiap Langkah Perjalananmu di Bandara",
      desc: "ToDjuanda memandu secara runut dari saat tiba hingga masuk ke dalam pesawat:",
      steps: [
        {
          num: "01",
          title: "Tiba di Area Keberangkatan",
          desc: "Cari area Departure maskapai (Departure 1-4) dan temukan konter check-in untuk mencetak boarding pass.",
        },
        {
          num: "02",
          title: "Pemeriksaan & Naik ke Lantai 2",
          desc: "Lewati security check point dan ikuti petunjuk eskalator/tangga menuju ruang tunggu lantai 2.",
        },
        {
          num: "03",
          title: "Eksplorasi Fasilitas & Kuliner",
          desc: "Temukan restoran favorit, mushola untuk ibadah, atau ATM terdekat selagi menunggu waktu boarding.",
        },
        {
          num: "04",
          title: "Tiba Tepat Waktu di Boarding Gate",
          desc: "Panduan rute langsung mengantarkanmu ke gate keberangkatan yang sesuai dengan estimasi waktu yang jelas.",
        },
      ],
    },
    closing: {
      eyebrow: "MULAI SEKARANG",
      title: "Siap Menjelajahi Terminal 1 Bandara Juanda?",
      desc: "Buka peta interaktif 3D sekarang atau pelajari panduan penggunaan alur perjalanan untuk pengalaman terbang yang lebih tenang.",
      buttonMap: "Buka Peta 3D Sekarang",
      buttonGuide: "Buka Panduan Penumpang",
    },
  },
  EN: {
    heroEyebrow: "ABOUT TODJUANDA",
    heroTitlePrefix: "Smart Navigation Innovation at ",
    heroTitleAccent: "Juanda International Airport",
    heroDesc:
      "ToDjuanda is an interactive 3D web-based indoor wayfinding platform specifically engineered for passengers at Terminal 1, Juanda International Airport Surabaya (SUB). Effortlessly connecting you to departure gates, airline check-in counters, and essential airport facilities with high precision.",
    openMap: "Open 3D Map",
    openGuide: "User Guide",
    stats: {
      floors: "2 Integrated Floors",
      floorsSub: "GF & 1st Floor",
      web: "100% Web-Based",
      webSub: "No App Install Required",
      algo: "A* Algorithm",
      algoSub: "Heuristic Multi-Floor Routing",
      speed: "72 m/min",
      speedSub: "Accurate Walking ETA",
    },
    showcase: {
      brand: "Juanda Airport Map",
      caption: "Click Terminal 1 to open 3D map",
      loading: "Loading map...",
      pills: [
        { label: "Entrance & Check-in", icon: "building" },
        { label: "Departure Gates 1-12", icon: "plane" },
        { label: "Escalators & Stairs", icon: "layers" },
        { label: "F&B & Facilities Directory", icon: "search" },
      ],
    },
    visionSection: {
      eyebrow: "BACKGROUND & VISION",
      title: "A Modern Navigation Solution for a Seamless Airport Experience",
      lead:
        "Juanda International Airport (SUB), operated by PT Angkasa Pura Indonesia (InJourney Airports), is one of the busiest aviation hubs in Indonesia. With thousands of travelers daily at Terminal 1, intuitive indoor orientation is essential for traveler comfort and on-time flight departures.",
      cardKicker: "OUR MISSION & COMMITMENT",
      cardTitle: "Fast, Accurate, and Passenger-Friendly Navigation",
      cardDesc:
        "Travelers frequently face difficulties locating boarding gates, navigating multi-floor escalators, or finding vital facilities. ToDjuanda unifies interactive 3D Digital Twin visuals with the A* heuristic search algorithm so passengers can navigate confidently from the drop-off zone straight to boarding.",
      cardStats: [
        { value: "0 sec", label: "No app install required" },
        { value: "100%", label: "Public Terminal 1 coverage" },
        { value: "A* Engine", label: "Fastest heuristic path" },
      ],
      benefits: [
        {
          badge: "3D Spatial",
          title: "Intuitive Spatial Orientation",
          desc: "Realistic 3D models help travelers grasp terminal layout, floor elevation, and corridors immediately.",
        },
        {
          badge: "A* Heuristic",
          title: "Realistic Multi-Floor Paths",
          desc: "Route calculations consider directional escalators and stairs with turn-by-turn guidance.",
        },
        {
          badge: "Punctuality",
          title: "Peace of Mind Before Boarding",
          desc: "Clear distance and walking ETA calculations ensure you arrive at your gate relaxed and punctual.",
        },
      ],
    },
    featuresSection: {
      eyebrow: "CORE FEATURES",
      title: "Engineered Smartly for Every Passenger Need",
      desc: "Every component of ToDjuanda focuses on user friendliness, rapid access, and terminal amenity precision.",
      items: [
        {
          tag: "DIGITAL TWIN",
          title: "Multi-Floor Integrated 3D Map",
          desc: "Explore Terminal 1 (Ground Floor and First Floor) in a unified model with instantaneous floor switching without reloads.",
          points: [
            "Seamless floor toggles (GF, L2, All Building)",
            "Responsive 360° orbit, pan, and pinch-to-zoom controls",
            "Exterior apron and aircraft jetbridge visualization",
          ],
          link: "Explore Map",
          href: "/map",
        },
        {
          tag: "A* ROUTE ENGINE",
          title: "Multi-Floor A* Route Engine",
          desc: "Intelligent route finding engine powered by the A* search algorithm that computes the fastest and most optimal pedestrian paths along walkable grid corridors.",
          points: [
            "Smart heuristic detects optimal shortest paths",
            "Directional escalators (Up/Down) & stair handling",
            "Real walking distance and ETA calculations",
          ],
          link: "Try Navigation",
          href: "/map",
        },
        {
          tag: "OMNI-SEARCH",
          title: "Instant Facility & Tenant Directory",
          desc: "Locate boarding gates, airline check-in counters, dining, cafes, restrooms, and ATMs instantly with auto-complete.",
          points: [
            "Rapid search by facility name or category",
            "Category filters for F&B, retail, and public amenities",
            "One-tap routing straight to the destination",
          ],
          link: "Search Facilities",
          href: "/map",
        },
        {
          tag: "MULTI-DEVICE",
          title: "Responsive on Phones, Tablets & Kiosks",
          desc: "Flexible layout optimized for passenger smartphones, operational tablets, and stationary airport touch kiosks.",
          points: [
            "Fast load times via airport QR code scans",
            "Intuitive touch controls suitable for all ages",
            "Bilingual interface (Indonesian & English)",
          ],
          link: "View Guide",
          href: "/help",
        },
      ],
    },
    journeySection: {
      eyebrow: "PASSENGER JOURNEY",
      title: "Guiding Every Stage of Your Airport Journey",
      desc: "ToDjuanda supports your departure process seamlessly step-by-step:",
      steps: [
        {
          num: "01",
          title: "Arrive at Departure Hall",
          desc: "Locate your airline's departure area (Departure 1-4) and check-in desk to print your boarding pass.",
        },
        {
          num: "02",
          title: "Security & Up to Level 2",
          desc: "Clear security checks and follow verified escalators or stairs to the Level 2 waiting lounge.",
        },
        {
          num: "03",
          title: "Relax & Explore Facilities",
          desc: "Find cafes, prayer rooms, or restrooms while waiting comfortably for boarding announcements.",
        },
        {
          num: "04",
          title: "Reach Your Boarding Gate Punctually",
          desc: "Follow the direct path right to your boarding gate with a verified distance and walking ETA.",
        },
      ],
    },
    closing: {
      eyebrow: "GET STARTED",
      title: "Ready to Explore Juanda Airport Terminal 1?",
      desc: "Launch the interactive 3D map right now or review the passenger departure guide for a smooth travel experience.",
      buttonMap: "Open 3D Map Now",
      buttonGuide: "Open Passenger Guide",
    },
  },
};

export function AboutPage() {
  const lang = useMapStore((s) => s.lang);
  const content = aboutContent[lang] || aboutContent.ID;
  const pageContainerRef = useRef<HTMLDivElement>(null);

  // Scroll reveal observer: reveals elements when they enter viewport on scroll
  useEffect(() => {
    const container = pageContainerRef.current;
    if (!container) return;

    const revealElements = container.querySelectorAll<HTMLElement>(`.${styles.revealOnScroll}`);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.isRevealed);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        threshold: 0.1,
        rootMargin: "0px 0px -40px 0px",
      },
    );

    revealElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className={styles.page}>
      <SiteHeader />

      <main ref={pageContainerRef} className="page-fade-in">
        {/* =========================================
            HERO SECTION
            ========================================= */}
        <section className={styles.hero} aria-label="Hero Overview">
          <div className={styles.heroGlow} aria-hidden="true" />
          <div className={styles.heroGlowLeft} aria-hidden="true" />

          <div className={styles.heroInner}>
            <div className={`${styles.heroCopy} ${styles.revealOnScroll}`}>
              <div className={styles.heroEyebrow}>
                <span className={styles.heroEyebrowDot} />
                <span>{content.heroEyebrow}</span>
              </div>

              <h1>
                {content.heroTitlePrefix}
                <span className={styles.heroGradientText}>{content.heroTitleAccent}</span>
              </h1>

              <p>{content.heroDesc}</p>

              <div className={styles.heroActions}>
                <Link href="/map" className={styles.primaryButton}>
                  <Compass size={18} />
                  <span>{content.openMap}</span>
                  <ArrowRight size={16} />
                </Link>
                <Link href="/help" className={styles.ghostButton}>
                  <Sparkles size={16} />
                  <span>{content.openGuide}</span>
                </Link>
              </div>

              {/* Metrics Strip */}
              <div className={styles.heroMetrics}>
                <div className={styles.metricItem}>
                  <span className={styles.metricValue}>{content.stats.floors}</span>
                  <span className={styles.metricLabel}>{content.stats.floorsSub}</span>
                </div>
                <div className={styles.metricDivider} aria-hidden="true" />
                <div className={styles.metricItem}>
                  <span className={styles.metricValue}>{content.stats.web}</span>
                  <span className={styles.metricLabel}>{content.stats.webSub}</span>
                </div>
                <div className={styles.metricDivider} aria-hidden="true" />
                <div className={styles.metricItem}>
                  <span className={styles.metricValue}>{content.stats.algo}</span>
                  <span className={styles.metricLabel}>{content.stats.algoSub}</span>
                </div>
                <div className={styles.metricDivider} aria-hidden="true" />
                <div className={styles.metricItem}>
                  <span className={styles.metricValue}>{content.stats.speed}</span>
                  <span className={styles.metricLabel}>{content.stats.speedSub}</span>
                </div>
              </div>
            </div>

            {/* Showcase Visual Card with Google Maps API */}
            <div className={`${styles.heroShowcase} ${styles.revealOnScroll} ${styles.revealDelay1}`}>
              <div className={styles.showcaseCard}>
                <div className={styles.showcaseHeader}>
                  <div className={styles.showcaseBrand}>
                    <Building2 size={18} color="#40d6ec" />
                    <span>{content.showcase.brand}</span>
                  </div>
                </div>

                {/* Juanda Overview Map using Google Maps Tile API */}
                <div className={styles.showcaseMapWrap}>
                  <OverviewMap />
                  <span className={styles.showcaseMapCaption}>
                    {content.showcase.caption}
                  </span>
                </div>

                <div className={styles.showcasePills}>
                  {content.showcase.pills.map((pill, idx) => (
                    <div key={idx} className={styles.showcasePill}>
                      <span className={styles.showcasePillIcon}>
                        {pill.icon === "building" && <Building2 size={14} />}
                        {pill.icon === "plane" && <PlaneTakeoff size={14} />}
                        {pill.icon === "layers" && <Layers size={14} />}
                        {pill.icon === "search" && <Search size={14} />}
                      </span>
                      <span>{pill.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================
            VISION & BACKGROUND SECTION
            ========================================= */}
        <section className={styles.visionSection} aria-label="Latar Belakang & Visi">
          <div className={styles.container}>
            <div className={`${styles.visionHeader} ${styles.revealOnScroll}`}>
              <div className={styles.visionEyebrow}>
                <Sparkles size={14} />
                <span>{content.visionSection.eyebrow}</span>
              </div>
              <h2 className={styles.visionTitle}>{content.visionSection.title}</h2>
              <p className={styles.visionLead}>{content.visionSection.lead}</p>
            </div>

            <div className={styles.visionGrid}>
              {/* Left Column: Mission & Impact Card */}
              <div className={`${styles.visionMissionCard} ${styles.revealOnScroll} ${styles.revealDelay1}`}>
                <div>
                  <div className={styles.visionMissionKicker}>{content.visionSection.cardKicker}</div>
                  <h3 className={styles.visionMissionTitle}>{content.visionSection.cardTitle}</h3>
                  <p className={styles.visionMissionDesc}>{content.visionSection.cardDesc}</p>
                </div>

                <div className={styles.visionStatsRow}>
                  {content.visionSection.cardStats.map((stat, sIdx) => (
                    <div key={sIdx} className={styles.visionStatBox}>
                      <strong>{stat.value}</strong>
                      <span>{stat.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: 3 Value Pillars */}
              <div className={`${styles.visionPillarsCol} ${styles.revealOnScroll} ${styles.revealDelay2}`}>
                {content.visionSection.benefits.map((b, idx) => {
                  const icons = [
                    <Compass key={0} size={22} />,
                    <Route key={1} size={22} />,
                    <PlaneTakeoff key={2} size={22} />,
                  ];
                  return (
                    <div key={idx} className={styles.visionPillarCard}>
                      <span className={styles.pillarIconWrap}>{icons[idx % icons.length]}</span>
                      <div className={styles.pillarBody}>
                        <div className={styles.pillarHeader}>
                          <strong>{b.title}</strong>
                          <span className={styles.pillarBadge}>{b.badge}</span>
                        </div>
                        <p>{b.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* =========================================
            CORE FEATURES SECTION
            ========================================= */}
        <section className={styles.featuresSection} aria-label="Fitur Unggulan">
          <div className={styles.container}>
            <div className={`${styles.sectionHeader} ${styles.revealOnScroll}`}>
              <div className={styles.sectionEyebrow}>
                <Layers size={14} />
                <span>{content.featuresSection.eyebrow}</span>
              </div>
              <h2 className={styles.sectionTitle}>{content.featuresSection.title}</h2>
              <p className={styles.sectionDesc}>{content.featuresSection.desc}</p>
            </div>

            <div className={styles.featuresGrid}>
              {content.featuresSection.items.map((item, idx) => {
                const icons = [
                  <Layers key={0} size={24} />,
                  <Route key={1} size={24} />,
                  <Search key={2} size={24} />,
                  <Smartphone key={3} size={24} />,
                ];
                const delayClass = [
                  styles.revealDelay1,
                  styles.revealDelay2,
                  styles.revealDelay3,
                  styles.revealDelay4,
                ][idx % 4];

                return (
                  <article key={idx} className={`${styles.featureCard} ${styles.revealOnScroll} ${delayClass}`}>
                    <div className={styles.featureIconWrap}>{icons[idx % icons.length]}</div>
                    <span className={styles.featureTag}>{item.tag}</span>
                    <h3 className={styles.featureTitle}>{item.title}</h3>
                    <p className={styles.featureDesc}>{item.desc}</p>

                    <ul className={styles.featureBulletList}>
                      {item.points.map((pt, pIdx) => (
                        <li key={pIdx} className={styles.featureBulletItem}>
                          <CheckCircle2 size={14} />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>

                    <div className={styles.featureCardFooter}>
                      <Link href={item.href} className={styles.featureLink}>
                        <span>{item.link}</span>
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* =========================================
            PASSENGER JOURNEY SECTION
            ========================================= */}
        <section className={styles.journeySection} aria-label="Alur Pengalaman Penumpang">
          <div className={styles.container}>
            <div className={`${styles.sectionHeader} ${styles.revealOnScroll}`}>
              <div className={styles.sectionEyebrow}>
                <Route size={14} />
                <span>{content.journeySection.eyebrow}</span>
              </div>
              <h2 className={styles.sectionTitle}>{content.journeySection.title}</h2>
              <p className={styles.sectionDesc}>{content.journeySection.desc}</p>
            </div>

            <div className={styles.journeyGrid}>
              {content.journeySection.steps.map((st, idx) => {
                const delayClass = [
                  styles.revealDelay1,
                  styles.revealDelay2,
                  styles.revealDelay3,
                  styles.revealDelay4,
                ][idx % 4];

                return (
                  <div key={idx} className={`${styles.journeyStepCard} ${styles.revealOnScroll} ${delayClass}`}>
                    <div className={styles.journeyStepNum}>{st.num}</div>
                    <h4>{st.title}</h4>
                    <p>{st.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* =========================================
            CLOSING CTA SECTION
            ========================================= */}
        <section className={styles.closing} aria-label="Mulai Menjelajahi">
          <div className={`${styles.closingCopy} ${styles.revealOnScroll}`}>
            <span className={styles.closingEyebrow}>{content.closing.eyebrow}</span>
            <h2>{content.closing.title}</h2>
            <p>{content.closing.desc}</p>
          </div>

          <div className={`${styles.closingActions} ${styles.revealOnScroll} ${styles.revealDelay1}`}>
            <Link href="/map" className={styles.primaryButton}>
              <Compass size={18} />
              <span>{content.closing.buttonMap}</span>
              <ArrowRight size={16} />
            </Link>
            <Link href="/help" className={styles.ghostButton}>
              <span>{content.closing.buttonGuide}</span>
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
