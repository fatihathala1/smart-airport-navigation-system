# 🛫 Juanda Smart Airport Navigation & Indoor Wayfinding System

<div align="center">

![Juanda Wayfinding Banner](public/map/juanda-terminal-1.png)

[![Next.js](https://img.shields.io/badge/Next.js-16.3.1-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-3D%20Digital%20Twin-black?style=for-the-badge&logo=three.js)](https://threejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.9.1-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)

**Sistem Navigasi Cerdas & Indoor Wayfinding 3D Berbasis Web untuk Bandar Udara Internasional Juanda (SUB) — InJourney Airports**

[Jelajahi Fitur](#-fitur-utama) • [Arsitektur Sistem](#-arsitektur--teknologi) • [Panduan Instalasi](#-panduan-instalasi--menjalankan) • [Dokumentasi API](#-dokumentasi-api--sinkronisasi) • [Tim Pengembang](#-tim-pengembang--kontributor)

</div>

---

## 📌 Ringkasan Proyek

**Juanda Smart Airport Navigation System** adalah platform navigasi dalam ruangan (*indoor wayfinding*) berbasis web 3D interaktif yang dirancang khusus untuk memandu penumpang di **Bandar Udara Internasional Juanda Surabaya (SUB)**. 

Melalui visualisasi *Digital Twin 3D*, penumpang dapat menelusuri denah Terminal 1 (Lantai Dasar / *Ground Floor* dan Lantai 2 / *First Floor*), mencari lokasi *boarding gate*, konter *check-in*, fasilitas umum (mushola, toilet, ruang laktasi, ATM, baggage claim), hingga tenant komersial, serta mendapatkan panduan rute navigasi langkah-demi-langkah (*step-by-step turn guidance*) yang memperhitungkan eskalator, tangga, dan jarak tempuh riil.

Sistem ini terintegrasi penuh dengan **Portal Administrasi Bandara** terproteksi yang memungkinkan pengelola bandara memperbarui direktori tenant, status fasilitas, serta menyinkronkan metadata objek peta 3D secara langsung ke database PostgreSQL secara *real-time*.

---

## ✨ Fitur Utama

### 1. 🧭 Peta 3D Digital Twin Interaktif (Terminal 1)
- **Model 3D Multi-Lantai Terpadu**: Model GLB gabungan (`t1-gabungan.glb`) yang mencakup Lantai 1 (GF) dan Lantai 2 (FF) dengan sinkronisasi elevasi presisi berdasarkan struktur pilar bandara.
- **Peralihan Lantai Mulus (*Floor Switcher*)**: Beralih antara tampilan Lantai 1, Lantai 2, atau Seluruh Gedung tanpa memuat ulang model (*zero-reload*).
- **Apron & Pesawat Realistis**: Visualisasi area luar terminal (*exterior apron*) lengkap dengan model pesawat maskapai pada setiap garbarata (*jetbridge*).
- **Kamera & Orbit Kontrol Responsif**: Dukungan navigasi sentuh (cubit untuk zoom, geser untuk rotasi/pan) yang dioptimalkan untuk perangkat mobile, tablet, desktop, maupun layar kiosk.

### 2. 🚶‍♂️ Mesin Navigasi & Algoritma Rute Antarlantai
- **Dijkstra Multi-Floor Route Engine**: Perhitungan rute terpendek dan paling efisien menggunakan algoritma Dijkstra berbasis grid permukaan lantai yang dapat dilalui (*walkable grid*).
- **Konektor Vertikal Arah-Tertentu**: Menangani eskalator searah (Naik / Turun) dan tangga dengan instruksi kontekstual (*e.g., "Naik eskalator ke Lantai 2"*).
- **Estimasi Waktu Tempuh (ETA)**: Menghitung jarak tempuh riil dalam meter dan estimasi waktu berjalan kaki dengan kecepatan standar penumpang (72 m/menit).
- **Passenger Roadmap**: Panduan alur penumpang mandiri dari pintu masuk, *check-in security check point* (SCP), boarding lounge, hingga gate keberangkatan.

### 3. 🔍 Pencarian & Direktori Fasilitas Bandara
- **Pencarian Cepat (*Omni-search*)**: Menemukan gate, tenant F&B, toko ritel, dan fasilitas dengan autocomplete instan.
- **Filter Berdasarkan Kategori**: Memilah tujuan berdasarkan kategori (*Restoran, Kafe, Belanja, ATM, Toilet, Mushola, Medis, Layanan Informasi*).
- **Jadwal Keberangkatan Penerbangan (*Flight Departures*)**: Integrasi nomor penerbangan, maskapai, waktu terbang, status, dan gate tujuan langsung di panel navigasi.

### 4. ⚙️ Portal Manajemen Admin & Sinkronisasi Database
- **Sinkronisasi Objek Peta 3D (*Map Object Config*)**: Pengelola dapat mengedit nama tampilan, kategori, jam buka/tutup, foto, dan status keterisian objek 3D langsung dari browser dan tersimpan ke PostgreSQL.
- **Role-Based Access Control (RBAC)**:
  - **Super Admin**: Akses penuh ke seluruh konfigurasi sistem, manajemen pengguna admin, data terminal, dan audit log.
  - **Airport Admin**: Pengelolaan operasional harian tenant, POI fasilitas, jam operasional, dan konfigurasi objek peta.
- **Audit Logging**: Rekam jejak seluruh mutasi data penting untuk akuntabilitas operasional bandara.

---

## 🏛️ Arsitektur & Teknologi

```
┌────────────────────────────────────────────────────────────────────────┐
│                          CLIENT / BROWSER                              │
│                                                                        │
│   [ Public Wayfinding UI ]               [ Admin Management Portal ]   │
│   - Three.js / React Three Fiber         - Tenant & Facility Editor   │
│   - Walkable Grid & Dijkstra             - 3D Map Object Synchronizer │
│   - Zustand State Store                  - RBAC Security Guard        │
└───────────────────▲──────────────────────────────────▲─────────────────┘
                    │                                  │
                    │ REST API / Server Actions        │
                    ▼                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        NEXT.JS APP ROUTER                              │
│                                                                        │
│   ├── /api/route                 (Perhitungan Rute & Graph)            │
│   ├── /api/admin/map-objects     (Sync Konfigurasi Objek 3D)           │
│   ├── /api/tenants/[id]          (Mutasi Direktori Tenant)             │
│   └── /api/auth                  (Autentikasi Session via Auth.js)     │
└───────────────────────────────────▲────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        DOMAIN & DATA LAYER                             │
│                                                                        │
│   ├── Authorization Engine       (can(role, PERMISSION))               │
│   ├── Validation Layer           (Zod Schema Enforcement)              │
│   └── Prisma ORM Client          (PostgreSQL Object-Relational Model)  │
└───────────────────────────────────▲────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        POSTGRESQL DATABASE                             │
│   - MapObjectConfig   - Tenant & Space        - AuditLog               │
│   - RouteNode & Edge  - Facility & Category   - Admin User & Account   │
└────────────────────────────────────────────────────────────────────────┘
```

### Tech Stack Rinci

| Komponen | Teknologi | Deskripsi |
|---|---|---|
| **Framework Utama** | [Next.js 16 (App Router)](https://nextjs.org/) | Framework React modern dengan Server Components & optimasi streaming |
| **Pustaka UI** | [React 19](https://react.dev/) + [TypeScript 5](https://www.typescriptlang.org/) | Fondasi antarmuka deklaratif dengan tipe data aman (*type-safe*) |
| **Mesin 3D Digital Twin** | [Three.js](https://threejs.org/) + [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) + [Drei](https://github.com/pmndrs/drei) | Render model GLB performa tinggi, pencahayaan realistis, dan orbit kamera |
| **Animasi & Transisi** | [GSAP](https://greensock.com/gsap/) + [@gsap/react](https://greensock.com/react/) | Micro-interactions dan transisi halus pada elemen visual wayfinding |
| **Desain & Gaya** | [Tailwind CSS 4](https://tailwindcss.com/) + Vanilla Semantic Tokens | Desain glassmorphism, responsif, aksesibilitas tinggi, dan tema bandara modern |
| **Manajemen State** | [Zustand](https://zustand-demo.pmnd.rs/) | State store global yang ringan untuk seleksi lantai, titik rute, dan kamera |
| **Database & ORM** | [PostgreSQL 15+](https://www.postgresql.org/) + [Prisma 7](https://www.prisma.io/) | Relational database tangguh dengan migrasi otomatis tipe Prisma Client |
| **Autentikasi & Keamanan** | [Auth.js (NextAuth v5)](https://authjs.dev/) + [bcryptjs](https://www.npmjs.com/package/bcryptjs) | Session JWT aman, hashing password bcrypt cost 12, dan proteksi middleware |
| **Validasi Skema** | [Zod](https://zod.dev/) | Validasi input ketat di API server untuk mencegah injeksi & kesalahan format |
| **Ikonografi** | [Lucide React](https://lucide.dev/) | Set ikon modern dan konsisten untuk navigasi penerbangan dan wayfinding |

---

## 📁 Struktur Repositori

```text
smart-airport-navigation-system/
├── prisma/
│   ├── migrations/                  # Riwayat migrasi skema database PostgreSQL
│   ├── schema.prisma                # Source of truth definisi model data Prisma
│   └── seed.ts                      # Script seeding data demo dan inisialisasi admin
├── public/
│   ├── airlines/                    # Logo maskapai penerbangan (Garuda, Lion, Citilink, dll.)
│   ├── models/
│   │   └── t1-gabungan.glb          # Model 3D utama Terminal 1 (Lantai 1 + Lantai 2)
│   └── map/                         # Aset visual referensi denah Juanda
├── scripts/
│   ├── dev-network.mjs              # Server dev otomatis yang bind ke IP jaringan lokal
│   └── merge-floors.mjs             # Pipeline merger dan alignment GLB lantai 1 dan 2
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   │   ├── page.tsx             # Halaman beranda dengan hero interaktif & pratinjau 3D
│   │   │   ├── map/page.tsx         # Halaman utama aplikasi 3D Wayfinding
│   │   │   └── help/page.tsx        # Panduan bantuan & video tutorial navigasi penumpang
│   │   ├── admin/                   # Dashboard portal administrasi terproteksi
│   │   ├── api/
│   │   │   ├── admin/map-objects/   # API sinkronisasi konfigurasi objek peta 3D ke DB
│   │   │   ├── route/               # API kalkulasi jalur wayfinding
│   │   │   └── tenants/             # API operasi CRUD tenant & POI
│   │   └── auth/signin/             # Halaman login otentikasi admin
│   ├── components/
│   │   ├── admin/                   # Komponen Admin Map Panel, Tenant Editor, POI Manager
│   │   ├── map3d/                   # AirportWayfinding, SceneModel, FloorSwitcher, Apron, dll.
│   │   ├── wayfinding/              # HomeHero, HelpPage, PassengerRoadmap, Search
│   │   └── site/                    # Header, Footer, Navigation Bar, dan Theme Chrome
│   ├── lib/
│   │   ├── map3d/                   # Multi-floor routing, walkable grid, connectors, assets
│   │   ├── authorization.ts         # Server-side RBAC permissions engine
│   │   ├── dijkstra.ts              # Algoritma pencarian rute terpendek
│   │   └── prisma.ts                # Prisma database singleton instance
│   └── types/                       # Kontrak tipe TypeScript untuk domain bandara
└── tests/                           # Unit test dan integrasi (multi-floor, routing, RBAC)
```

---

## 🚀 Panduan Instalasi & Menjalankan

### Prasyarat Sistem
- **Node.js**: Versi `v20.x` atau lebih baru
- **NPM**: Versi `10.x` atau lebih baru
- **PostgreSQL**: Versi `15` atau lebih baru (lokal atau cloud seperti Supabase/Neon)

### Langkah 1: Clone Repositori
```bash
git clone https://github.com/fatihathala1/smart-airport-navigation-system.git
cd smart-airport-navigation-system
```

### Langkah 2: Instalasi Dependensi
```bash
npm install
```

### Langkah 3: Konfigurasi Environment Variable
Salin template konfigurasi `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```

Buka file `.env` dan sesuaikan parameter berikut:
```env
# Koneksi Database PostgreSQL
DATABASE_URL="postgresql://postgres:password_kamu@localhost:5432/juanda_wayfinding?schema=public"

# Rahasia Sesi Autentikasi (generate via: npx auth secret)
AUTH_SECRET="kunci-rahasia-autentikasi-anda-yang-aman"
NEXTAUTH_URL="http://localhost:3000"

# Password Awal Akun Demo Super Admin (digunakan saat database seeding)
SEED_ADMIN_PASSWORD="AdminJuanda2026!"
```

### Langkah 4: Migrasi Database & Seeding
Jalankan migrasi Prisma untuk membuat tabel-tabel di database PostgreSQL, lalu jalankan script seed:
```bash
# Generate Prisma Client
npx prisma generate

# Terapkan migrasi skema ke database
npx prisma migrate dev

# Masukkan data awal bandara (Terminal, Lantai, Tenant, User Admin)
npm run seed
```

### Langkah 5: Jalankan Server Pengembangan
```bash
npm run dev
```

Aplikasi siap dibuka di browser:
- **Peta Publik (Wayfinding)**: `http://localhost:3000/map`
- **Halaman Beranda**: `http://localhost:3000/`
- **Pusat Bantuan & Tutorial**: `http://localhost:3000/help`
- **Portal Admin**: `http://localhost:3000/admin` *(Login menggunakan akun hasil seeding)*

> 💡 **Akses Perangkat Mobile di Jaringan yang Sama**:  
> Script `npm run dev` secara otomatis menampilkan IP Wi-Fi lokal Anda (contoh: `http://192.168.1.15:3000`). Buka URL tersebut di browser smartphone Anda untuk menguji navigasi secara langsung di genggaman.

---

## 🛠️ Perintah Pengujian & Kualitas Kode

```bash
# Menjalankan validasi tipe TypeScript
npm run typecheck

# Menjalankan linter ESLint
npm run lint

# Menjalankan automated test suite (routing, multi-floor, RBAC)
npm test

# Melakukan kompilasi build produksi
npm run build
```

---

## 🔒 Model Keamanan & Otorisasi

Sistem mengimplementasikan prinsip *defense-in-depth* untuk melindungi data operasional bandara:

1. **Role-Based Access Control (RBAC)**: Setiap mutasi server memverifikasi izin spesifik (`MANAGE_USERS`, `MANAGE_MAP_OBJECTS`, `MANAGE_TENANTS`, dll.) di tingkat API, bukan sekadar menyembunyikan tombol di UI.
2. **Password Hashing**: Menggunakan `bcryptjs` dengan salt round 12 untuk mencegah kebocoran kredensial admin.
3. **Session Proteksi JWT**: Sesi admin kedaluwarsa secara otomatis setelah 8 jam tidak aktif.
4. **Validasi Skema Server-Side**: Semua mutasi data melalui parsing ketat `Zod` untuk mencegah serangan *mass-assignment* atau *malformed payload*.
5. **Keamanan Konten**: Deskripsi tenant dan metadata objek dirender sebagai teks murni (*sanitized plain text*), mencegah potensi *Cross-Site Scripting (XSS)*.

---

## 👥 Tim Pengembang & Kontributor

Proyek **Juanda Smart Airport Navigation System** dirancang, dikembangkan, dan disempurnakan oleh kolaborasi tim yang berdedikasi:

<div align="center">

| Kontributor | Kontribusi & Tanggung Jawab Utama |
|---|---|
| **Naufal** | **3D Digital Twin & Scene Architecture**<br>Pengembangan penggabungan model GLB multi-lantai, integrasi apron, pesawat, dan sinkronisasi pilar elevasi. |
| **Fatih** | **Full-Stack Engineering & Project Lead**<br>Arsitektur Next.js App Router, integrasi Prisma ORM, arsitektur database, dan koordinasi sistem. |
| **Aqilla** | **3D Asset Modeling & Pipeline Optimization**<br>Pembuatan dan optimasi model 3D terminal (`glb-to-website`), hierarki mesh objek, dan asset pipeline. |
| **Kaka** | **Wayfinding Engine & Walkability Routing**<br>Algoritma rute multi-lantai Dijkstra, walkable grid, penanganan konektor tangga/eskalator, dan Admin Map Editor. |
| **Vero** | **UI/UX Design & Frontend Experience**<br>Desain antarmuka publik, sistem token CSS modern, responsivitas mobile/kiosk, dan komponen visual wayfinding. |
| **Alvino** | **Backend Services, RBAC & API Development**<br>Pengembangan API routes, otentikasi NextAuth, otorisasi peran (RBAC), dan audit logging. |
| **Ragil** | **Data Engineering, Quality Assurance & Testing**<br>Penyusunan seed data direktori tenant & POI, integrasi data keberangkatan, pengujian fungsionalitas dan QA. |

</div>

---

## 📄 Lisensi & Hak Cipta

Dibuat untuk keperluan pengembangan dan inovasi navigasi cerdas **Bandar Udara Internasional Juanda (PT Angkasa Pura Indonesia / InJourney Airports)**.

Seluruh model 3D, logo, dan data tata letak merupakan hak milik masing-masing pemegang hak cipta dan digunakan untuk keperluan riset serta implementasi sistem navigasi bandara.

---

<div align="center">
  <sub>Dibangun dengan dedikasi untuk meningkatkan pengalaman perjalanan jutaan penumpang di Bandara Internasional Juanda Surabaya.</sub>
</div>
