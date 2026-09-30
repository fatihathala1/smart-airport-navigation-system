# Persiapan integrasi peta 3D

Dokumen ini adalah kontrak kerja untuk memasukkan peta 3D yang masih dikerjakan di perangkat lain ke halaman `/map` proyek ini. Belum ada model atau kode peta 3D di repository ini, jadi halaman Map tetap memakai peta 2D saat ini sampai aset dan data rutenya tersedia.

## Titik sambung yang sudah ada

```text
/map
  └─ FullMapShell: pencarian, pilihan terminal/lantai, titik awal, tujuan, detail rute
       ├─ MapStage: renderer SVG 2D saat ini
       ├─ useMapStore: pilihan lokasi dan status navigasi
       └─ findGridRoute: perhitungan rute demo saat ini
```

`FullMapShell` ada di `src/components/wayfinding/FullMapShell.tsx`. Peta visualnya dirender oleh `src/components/wayfinding/MapStage.tsx`. Saat integrasi, pertahankan kendali pencarian dan panel navigasi di `FullMapShell`; renderer 3D mengambil alih area `fs-map-bg` tempat `MapStage` sekarang berada.

Dokumen `docs/integrasi-peta-iframe.md` membahas arah kebalikan, yaitu menampilkan proyek ini di website lain. Itu bukan rancangan utama untuk memasukkan peta 3D ke halaman Map proyek ini.

## Kontrak antara website dan peta 3D

Renderer peta harus bisa menerima perubahan dari website berikut:

| Data/perintah | Makna |
| --- | --- |
| `terminal`, `floorId` | Scene terminal dan lantai yang aktif. ID lantai saat ini: `T1-L1`, `T1-L2`, `T2-L1`, `T2-L2`. |
| `selectedSpaceId` | Lokasi yang dipilih dari pencarian atau daftar fasilitas; objek 3D yang sesuai disorot dan kamera dapat diarahkan ke sana. |
| `currentNodeId`, `fromNodeId`, `toNodeId` | Posisi QR, awal, dan tujuan; tampil sebagai penanda yang berbeda. |
| `route` | Urutan node/segmen rute beserta lantainya; hanya segmen lantai aktif yang perlu terlihat pada scene aktif. |
| `resetView` | Kembalikan kamera ke tampilan awal terminal/lantai aktif. |

Renderer harus mengirim balik **ID lokasi kanonis** saat objek 3D diklik. `FullMapShell` kemudian memilih lokasi tersebut melalui alur yang sama seperti daftar fasilitas. Nama objek Blender, label tenant, dan posisi array tidak boleh menjadi ID lokasi karena dapat berubah.

Siapkan tabel pemetaan dari `nama objek 3D → ID lokasi` dan `ID node rute → koordinat dunia 3D (x, y, z)` untuk setiap lantai. Catat satuan (disarankan meter), sumbu vertikal, titik asal, skala, dan orientasi model. Koordinat 2D `x/y` di `WayfindingNode` saat ini tidak otomatis cocok dengan koordinat model Blender.

Data demo di `src/data/demo-wayfinding.ts` menghasilkan beberapa `Space.code` yang berulang antar kategori. Jangan menggunakan `code` demo sebagai kunci pemetaan sampai keunikannya dibereskan. Gunakan `MapSpace.id` untuk prototipe saat ini; untuk data operasional, tetapkan satu ID space permanen yang unik dan sama di scene, direktori, QR, serta graf rute.

## Satu sumber rute

Halaman `/map` saat ini memanggil `findGridRoute` dari `src/lib/grid-route.ts`, sedangkan repository juga memiliki implementasi Dijkstra terpisah di `src/lib/dijkstra.ts`. Jika proyek 3D di perangkat lain sudah menghitung rute dengan Dijkstra, tentukan **satu** mesin rute yang akan dipakai setelah penggabungan. Renderer hanya menggambar hasilnya; ia tidak membuat rute berbeda dari yang ditampilkan panel navigasi.

Hasil rute yang dibawa ke website sekurangnya berisi ID node awal dan akhir, urutan node, lantai setiap segmen, jenis konektor antar lantai, jarak, dan ETA. Jika tujuan tidak benar-benar tercapai, tampilkan status “rute tidak tersedia”. Jangan menggambar jalur ke titik terdekat seolah sudah sampai ke tujuan.

## Cara membawa peta dari perangkat lain

Pilihan utama bergantung pada bentuk hasil akhirnya:

1. **Sudah berupa aplikasi web 3D:** bawa source project, daftar dependency, aset, dan data grafnya. Integrasikan renderer sebagai komponen client di proyek Next.js ini, dengan kontrak di atas. Muat kode 3D hanya di halaman `/map`.
2. **Berupa model `.glb`/`.gltf`:** bawa model, tekstur, dan data pemetaan objek/node. Buat renderer client yang menerapkan kontrak yang sama.
3. **Hanya tersedia URL aplikasi terpisah:** `iframe` dapat dipakai untuk pratinjau sementara. Integrasi pencarian, pilihan lantai, dan rute memerlukan protokol pesan dua arah yang tervalidasi; kebijakan CSP saat ini juga perlu dikonfigurasi secara spesifik untuk origin peta. Jangan membuka semua origin.

Pertahankan `MapStage` 2D sebagai tampilan cadangan selama cakupan scene 3D dan pemetaan data belum lengkap. Jangan mengaktifkan mode 3D untuk terminal/lantai yang belum punya scene tervalidasi.

## Yang perlu dibawa dari perangkat lain

- Source aplikasi web 3D **atau** model hasil ekspor beserta semua teksturnya.
- Daftar terminal, lantai, ID objek/mesh yang bisa diklik, dan lokasi fisik masing-masing.
- Graf Dijkstra: ID node, edge, jenis konektor, arah, akses publik, dan jarak terkalibrasi.
- Pemetaan node rute ke koordinat 3D dan spesifikasi satuan, sumbu, skala, serta origin scene.
- Contoh hasil rute untuk satu lantai, lintas lantai, lokasi tak terhubung, dan titik awal QR.
- Informasi build: framework/library 3D, perintah menjalankan, serta target browser/perangkat yang sudah diuji.

## Urutan integrasi setelah aset tersedia

1. Cocokkan ID terminal, lantai, lokasi, dan node antara kedua proyek; selesaikan duplikasi/missing ID sebelum menggambar rute.
2. Pasang renderer 3D di area `MapStage` dengan loading, error, dan fallback 2D.
3. Hubungkan klik objek 3D dengan pemilihan lokasi; hubungkan pemilihan dari daftar dengan sorotan dan kamera 3D.
4. Gunakan satu mesin rute untuk panel dan scene; gambar segmen per lantai serta instruksi konektor.
5. Uji T1/T2, setiap lantai, QR, jalur normal, lintas lantai, no-route, desktop, mobile, dan navigasi keyboard.

Integrasi dianggap siap saat lokasi yang dipilih di daftar dan scene selalu sama, rute yang digambar sesuai instruksi panel, pergantian lantai tidak menghilangkan konteks rute, dan kegagalan memuat model masih memungkinkan pengguna memakai peta 2D.
