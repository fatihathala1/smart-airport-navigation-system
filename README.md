# JUA Interactive Indoor Wayfinding

Web wayfinding responsif untuk membantu pengunjung Bandar Udara Internasional Juanda mencari lokasi dan mendapatkan rute di Terminal 1 dan Terminal 2. Halaman publik langsung membuka peta. Pengunjung tidak perlu login.

> Status data: seluruh lokasi, space, tenant, jarak, jam, dan QR yang aktif pada demo saat ini adalah data contoh. SVG existing dari repository dipertahankan sebagai baseline visual, tetapi belum dinyatakan sebagai denah operasional resmi.

## Tujuan produk

- Memperpendek waktu dari membuka web hingga menemukan lokasi.
- Memisahkan geometri fisik dari tenant dan konten yang berubah.
- Menghasilkan rute publik yang dapat dijelaskan, termasuk lintas lantai.
- Memberi admin kewenangan sesuai role: Super Admin global dan Airport Admin operasional.
- Menyediakan fondasi data yang dapat divalidasi bersama tim Juanda.

## Inovasi inti

1. Setiap `Space` permanen dapat diklik dan menampilkan detail.
2. Tenant ditempatkan lewat `SpaceAssignment`; pergantian tenant tidak mengubah geometri.
3. Rute memakai weighted Dijkstra dengan jarak meter, ETA, dan instruksi konektor.
4. QR current location disiapkan melalui `/?location=<locationId>`.
5. Lift, tangga, dan escalator dimodelkan sebagai edge lintas lantai; edge satu arah didukung.
6. Edge inactive, non-public, dan restricted tidak digunakan pada routing publik.

## Stack

| Area | Teknologi |
| --- | --- |
| Web | Next.js 16, React 19, TypeScript |
| UI | Tailwind CSS 4, CSS semantic tokens, Lucide |
| State | Zustand |
| Data | PostgreSQL, Prisma 7 |
| Auth | Auth.js / NextAuth credentials, JWT session |
| Validasi | Zod |
| Test | Node test runner melalui `tsx` |

## Arsitektur

```text
Browser
  public map / admin portal
            |
Next.js App Router
  public route API | protected tenant API | Auth.js
            |
Domain services
  Dijkstra | authorization | validation | storage interface
            |
Prisma
            |
PostgreSQL
```

Boundary penting:

- Public map dapat dibuka tanpa session.
- `/admin` memerlukan session dengan role admin.
- API mutation mengulang pemeriksaan role dan ownership di server.
- UI hiding tidak pernah dianggap sebagai authorization.
- Deskripsi dirender sebagai teks biasa. Tidak ada HTML tenant yang dirender langsung.

Detail keputusan ada di [docs/architecture.md](docs/architecture.md).

## Struktur folder

```text
.
├── docs/
│   ├── architecture.md          keputusan domain, map, routing, dan security
│   └── data-requirements.md     data resmi yang harus diberikan Juanda
├── legacy/v1/                   implementasi A* dan artefak v1, tidak aktif
├── prisma/
│   ├── migrations/              baseline PostgreSQL untuk domain model v2
│   ├── schema.prisma            source of truth data model
│   └── seed.ts                  seed demo yang berlabel jelas
├── public/map/                  SVG T1/T2 existing, statusnya baseline belum tervalidasi
├── src/
│   ├── app/
│   │   ├── admin/               portal admin terproteksi
│   │   ├── api/route/           endpoint routing publik
│   │   ├── api/tenants/[id]/    mutation tenant dengan RBAC dan ownership
│   │   ├── auth/signin/         login admin, tanpa signup publik
│   │   └── page.tsx             entry public map
│   ├── components/
│   │   ├── map-layers/          basemap, space, POI, route, marker
│   │   └── wayfinding/          shell UI dan map viewport
│   ├── data/                    fixture demo UI, bukan data resmi
│   ├── lib/                     auth, RBAC, Dijkstra, Prisma, validation, storage
│   ├── store/                   state map Zustand
│   └── types/                   kontrak domain TypeScript
├── tests/                       routing, RBAC, ownership, dan validation
├── .env.example
└── README.md
```

`legacy/v1` sengaja berada di luar `src` dan dikecualikan dari build/lint. Ia hanya menjadi referensi audit. A* tidak diimpor oleh flow final.

## Alur pengguna publik

```text
Buka /
  -> pilih T1 atau T2
  -> pilih lantai atau kategori
  -> cari atau klik space
  -> baca detail
  -> pilih Petunjuk Arah
  -> lihat FROM, TO, garis rute, jarak, ETA, dan instruksi lintas lantai
```

Jika QR valid, contoh `/?location=demo-t1-arrival`, titik asal diisi otomatis. QR tidak valid menghasilkan pesan kontekstual dan pengguna tetap dapat memilih asal manual.

## Role dan permission

| Kemampuan | Super Admin | Airport Admin |
| --- | :---: | :---: |
| Kelola admin dan role | Ya | Tidak |
| Kelola terminal, floor, space | Ya | Tidak |
| Kelola route graph | Ya | Tidak |
| Kelola seluruh tenant di bandara | Ya | Ya |
| Kelola fasilitas/POI dan kategori | Ya | Ya |
| Kelola jam dan status operasional | Ya | Ya |
| Edit profil tenant | Ya | Ya |
| Lihat audit log | Ya | Tidak |

Tidak ada public admin signup. Akun admin dibuat melalui proses Super Admin. Super Admin memiliki akses global ke seluruh konfigurasi sistem, sedangkan Airport Admin memegang operasional tenant. Deployment ini khusus Bandara Juanda, sehingga Airport Admin dapat mengelola seluruh tenant Juanda.

## Arsitektur layer peta

Urutan render bersifat eksplisit:

1. `BaseMapLayer`: SVG existing dan koridor baseline.
2. `SpaceLayer`: polygon space permanen yang clickable.
3. `POILayer`: label/marker yang berasal dari data assignment.
4. `RouteLayer`: segmen Dijkstra pada lantai aktif.
5. `MarkerLayer`: asal, tujuan, dan current location.

Nama tenant tidak ditulis ke static SVG. `Space.code` tetap stabil walaupun tenant berubah.

## Routing Dijkstra

`src/lib/dijkstra.ts` membuat adjacency list dari `RouteNode` dan `RouteEdge`, lalu memakai min-heap untuk memilih jarak kumulatif terendah.

- Weight utama: `distanceMeters`.
- `BIDIRECTIONAL` membuat adjacency dua arah.
- `ONE_WAY` hanya membuat adjacency dari `fromNode` ke `toNode`.
- Edge `active=false` atau `publicAccess=false` dibuang dari public graph.
- `accessibleOnly` membuang edge `accessible=false`.
- `LIFT`, `STAIRS`, dan `ESCALATOR` menghasilkan connector instruction.
- ETA memakai default 72 meter/menit dan dibulatkan ke menit penuh.
- No-route mengembalikan `null` di domain dan HTTP 404 di API.

Jarak demo bukan hasil kalibrasi resmi. Production harus memakai skala denah yang diverifikasi.

## Data model

- `Terminal` memiliki banyak `Floor`.
- `Floor` memiliki `Space`, `Facility`, `RouteNode`, dan `QRLocation`.
- `Space` menyimpan kode stabil, tipe, status, geometri, linkage SVG, dan routing anchor.
- `Tenant` menempati `Space` melalui assignment bertanggal.
- `Facility` dipisah dari `Tenant` karena toilet, gate, lift, dan information desk bukan okupansi komersial.
- `OperationalHour` dapat dimiliki tenant atau facility.
- `RouteEdge` menyimpan distance, type, direction, public access, accessibility, dan status.
- `AuditLog` menyimpan actor, action, entity, serta before/after snapshot.

## Security model

- Password di-hash bcrypt dengan cost 12 pada seed.
- Session memakai JWT dengan masa aktif delapan jam.
- Route admin dan API mutation memerlukan session.
- RBAC diperiksa ulang di setiap mutation server untuk mencegah IDOR.
- Payload divalidasi Zod dan unknown field ditolak.
- URL gambar hanya menerima HTTP/HTTPS.
- Deskripsi ditampilkan sebagai plain text, bukan injected HTML.
- Security headers mencakup CSP, frame denial, nosniff, referrer policy, dan permissions policy.
- Perubahan tenant penting masuk `AuditLog` dalam transaction yang sama.
- Login memiliki throttle in-memory per email untuk development/single instance.
- Upload gambar memakai interface `ImageStorage`; belum ada storage provider aktif.

Untuk production multi-instance, ganti throttle in-memory dengan Redis/edge rate limiter, aktifkan observability, scan upload, signed URL, MIME sniffing, dimension validation, dan lifecycle deletion.

### Catatan dependency audit

Repository diperbarui ke Next.js 16.3.1 dan Auth.js beta.32 untuk keluar dari critical advisory versi existing. Audit penuh masih melaporkan advisory transitive pada Prisma CLI 7.9.1. CLI berada di `devDependencies`, dan `npm ls prisma --omit=dev --depth=0` memastikan ia tidak masuk production dependency tree. Jangan menjalankan `npm audit fix --force` karena rekomendasi saat ini meminta perubahan major/downgrade Prisma; evaluasi kembali saat patch upstream tersedia.

## Setup lokal

Prasyarat:

- Node.js 20 atau lebih baru
- PostgreSQL 15 atau lebih baru
- npm

```bash
git clone https://github.com/devarii/smart-airport-navigation-system.git
cd smart-airport-navigation-system
npm install
cp .env.example .env
```

Isi `DATABASE_URL`, buat `AUTH_SECRET`, dan ganti `SEED_ADMIN_PASSWORD`. Jangan gunakan kredensial demo di production.

```bash
npx auth secret
```

## Database migrate dan seed

```bash
npx prisma generate
npx prisma migrate deploy
npm run seed
```

Migration v2 adalah baseline baru untuk instalasi fresh. SQL v1 disimpan di `legacy/v1/prisma-migrations`. Jika ada deployment lama dengan data nyata, jangan langsung menjalankan baseline ini. Ambil backup, petakan data lama, buat migration transitional khusus, dan uji restore.

Seed membuat akun pada domain `.invalid` dan hanya berjalan jika `SEED_ADMIN_PASSWORD` diisi. Semua record seed berstatus demo.

## Menjalankan dan memverifikasi

```bash
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
```

Rute penting:

- `http://localhost:3000/`
- `http://localhost:3000/?location=demo-t1-arrival`
- `http://localhost:3000/admin`
- `http://localhost:3000/auth/signin`

## Data yang masih dibutuhkan dari Juanda

1. Denah resmi terbaru per terminal dan lantai, termasuk version date.
2. Daftar floor dan label yang digunakan penumpang.
3. Master space dengan ID permanen dan polygon/linkage SVG.
4. Tenant dan POI master, kategori, kontak, foto, status, serta jam.
5. Koridor publik, restricted area, security boundary, dan staff-only route.
6. Node/edge lift, tangga, escalator, termasuk arah escalator.
7. Status accessible setiap edge dan alternatif lift.
8. Skala map agar pixel/grid dapat dikonversi ke meter.
9. Lokasi QR, label fisik, pemasangan, dan proses maintenance.
10. Route validation set dari walkthrough lapangan beserta jarak pembanding.

Template rinci ada di [docs/data-requirements.md](docs/data-requirements.md).

## Checklist production

- [ ] Seluruh data di atas ditandatangani pemilik data Juanda.
- [ ] Uji route pada rute normal, lintas lantai, restricted, closure, dan no-route.
- [ ] PostgreSQL backup, PITR, migration rehearsal, dan rollback diuji.
- [ ] Auth secret, rotation, secure cookie, HTTPS, dan admin lifecycle siap.
- [ ] Rate limiter terdistribusi dan alert login abuse aktif.
- [ ] Object storage, antivirus, image processing, dan signed upload aktif.
- [ ] Audit log retention dan access policy disepakati.
- [ ] WCAG AA diuji dengan keyboard, screen reader, zoom 200%, dan contrast checker.
- [ ] Perangkat 320 px, mobile umum, desktop, kiosk, dan touch display diuji.
- [ ] Lighthouse, load test, error tracking, uptime, dan offline behavior diuji.
- [ ] Dependency audit tidak memiliki advisory production yang belum diterima risikonya.
- [ ] Privacy, logging PII, dan retention direview.

## Roadmap

- Rollout QR dan inventory fisik.
- Accessibility routing setelah metadata tervalidasi.
- Dynamic closure dan incident routing.
- Bahasa Indonesia/Inggris dengan i18n.
- Content workflow dan approval.
- Indoor positioning real-time sebagai fase terpisah, bukan asumsi MVP.

## Kontribusi

- Branch fitur: `codex/<ringkas-fitur>` atau `feature/<ringkas-fitur>` sesuai kebijakan tim.
- Jangan mengubah geometry dan tenant assignment dalam satu migration tanpa data review.
- Setiap perubahan routing wajib menambah fixture/test.
- Jangan memasukkan secret, data penumpang, atau data lokasi yang belum berizin.
- Pull request harus lulus lint, typecheck, test, build, dan review aksesibilitas dasar.
