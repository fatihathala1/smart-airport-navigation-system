# Integrasi peta 3D Juanda

Peta dari [`AqillaRamadhani20/glb-to-website`](https://github.com/AqillaRamadhani20/glb-to-website) sudah digabung langsung ke aplikasi utama. Versi sumber yang dipakai: `caedb1614252a8c72510560df8a19606a6ecaf85`. Halaman **Maps** (`/map`) menampilkan peta interaktif penuh dengan header yang sama seperti Home dan Help. Struktur **Home** (`/`) tetap berisi hero, widget, kartu akses, panduan, dan bagian video; frame pratinjau 3D ditambahkan di antaranya. Pencarian kode building dari widget Home diteruskan ke `/map?q=...`. Tidak ada iframe atau server kedua.

## Menjalankan di lokal

```bash
npm install
npm run dev
```

Buka alamat lokal yang ditampilkan oleh perintah tersebut, lalu pilih **Maps**. Keduanya berjalan melalui satu server Next.js dan satu port. Untuk pemeriksaan sebelum deploy, gunakan `npm run typecheck`, `npm run lint`, `npm test`, dan `npm run build`.

## Bagian yang diubah untuk revisi minor

| Kebutuhan revisi | Lokasi |
| --- | --- |
| Bentuk, posisi, atau nama objek gedung pada model | `public/models/buildings-ground-floor.glb` (ubah di sumber 3D/Blender, lalu ekspor ulang) |
| Permukaan yang bisa dilalui, posisi tembok/pilar, kaca, dan pintu | `public/models/buildings-ground-floor.glb` — nama dan geometri objek pada ekspor 3D |
| Aturan membaca lantai, penghalang, dan pintu dari GLB | `src/lib/map3d/scene-walkability.ts` (tes: `tests/map3d-scene-walkability.test.ts`) |
| Resolusi jalur, jarak aman dari penghalang, dan pencarian rute terpendek | `src/lib/map3d/walkable-grid.ts` (tes: `tests/map3d-walkable-grid.test.ts`) |
| Pemeriksaan rute terhadap ekspor GLB yang sedang dipakai | `tests/map3d-real-glb.test.ts` |
| Versi URL aset setelah GLB diganti | `src/lib/map3d/assets.ts` — ubah nilai `?v=` agar cache browser tidak memakai versi lama |
| Kategori, warna, status, dan informasi objek | `src/lib/map3d/object-metadata.ts` |
| Pencarian, pemilihan awal/tujuan, kamera, dan perhitungan rute | `src/components/map3d/AirportWayfinding.tsx` |
| Tampilan garis rute dan titik awal/tujuan pada model | `src/components/map3d/GridRouteLayer.tsx` |
| Aturan teks belokan dan batas segmen yang disorot | `src/lib/map3d/route-steps.ts` (tes: `tests/map3d-route-steps.test.ts`) |
| Batas putaran kamera agar denah tidak terlihat dari bawah | `src/lib/map3d/map-camera.ts` dan `src/components/map3d/AirportWayfinding.tsx` (tes: `tests/map3d-camera.test.ts`) |
| Kecepatan perkiraan dan posisi simulasi | `src/lib/map3d/route-guidance.ts` dan `src/components/map3d/RoutePlaybackController.tsx` |
| Tata letak dan warna halaman Maps | `src/components/map3d/viewer.css` |
| Teks, pilihan Departure, dan pertanyaan gate pada roadmap penumpang | `src/components/map3d/PassengerRoadmap.tsx` |
| Header bersama Home, Maps, dan Help | `src/components/site/SiteHeader.tsx` dan `SiteChrome.module.css` |
| Font umum situs | `src/app/globals.css` (`--font-ui`); memakai font sistem agar build tidak memerlukan unduhan font eksternal |
| Struktur dan widget pencarian Home | `src/components/wayfinding/WayfindingShell.tsx` |
| Kartu akses dan empat langkah panduan Home | `src/components/wayfinding/FacilityShortcuts.tsx` dan `WayfindingFullTutorialSection.tsx` |
| Ukuran, teks, atau sudut kamera frame Home | `src/components/map3d/Map3DPreview.tsx`, `Map3DPreviewCanvas.tsx`, dan `Map3DPreview.module.css` |
| Teks panduan pengguna | `src/components/wayfinding/HelpPage.tsx` |

`src/app/map/page.tsx` hanya menjadi pintu masuk halaman Maps. `src/components/map3d/Map3DClient.tsx` memuat viewer di browser. Jadi perubahan data peta umumnya tidak perlu dilakukan pada kedua file tersebut.

Penting: mesin rute **tidak memakai node/edge SVG** lagi. Ia membaca bidang `FLOOR__area_visitor` sebagai area jalan kaki, `tembok_pilar*` dan objek fisik tertentu sebagai penghalang, `GLASS__*`/`dinding-kaca*` sebagai dinding kaca, serta `DOOR__*` sebagai bukaan yang bisa dilalui. Jika ekspor GLB mengganti nama objek tersebut, sesuaikan aturan pembacanya di `scene-walkability.ts`. Pastikan bidang lantai dan bukaan pintu tetap cocok secara geometris. Pencarian building masih memakai pola `T1-GF-*` atau `TI-GF-*`; nama di luar pola itu tidak muncul sebagai building yang bisa dipilih. Sesudah mengganti GLB, uji beberapa rute di kedua sisi dinding, bukan hanya tampilannya.

## Alur rute di halaman Maps

Pilih **Dari** dengan mengeklik lantai atau mencari/mengeklik building, lalu pilih **Ke** dari daftar building atau model. Bila building dipilih sebagai titik awal/tujuan, posisinya ditempelkan ke sel jalan kaki terdekat. Sistem membagi bidang lantai menjadi grid, menutup sel yang bertabrakan dengan penghalang, lalu mencari rute terpendek pada sel yang masih tersambung. Tembok dan pilar tidak bisa dilalui; kaca hanya dapat dilintasi lewat bukaan pintu yang terbaca dalam GLB. Jika tidak ada sambungan yang sah, aplikasi menampilkan pesan bahwa rute tidak ditemukan. Setelah rute ada, halaman menampilkan ringkasan dan daftar langkah. Tombol **Sebelumnya/Berikutnya** memusatkan kamera serta menyorot segmen langkah aktif (oranye) di atas rute penuh (biru). **Mulai simulasi 3D** menjalankan sudut pandang pengunjung; **Lihat peta** kembali ke tampilan atas. Jarak dan waktu adalah perkiraan dari skala model dan kecepatan simulasi, bukan pengukuran lapangan.

Tampilan ini baru mendukung Terminal 1 lantai dasar. Opsi kursi roda dan rute antar-lantai belum ditampilkan karena model sekarang belum memberi data aksesibilitas atau konektor lantai yang dapat dipakai mesin rute; menambah tombolnya tanpa data tersebut akan menghasilkan arahan yang menyesatkan.

## Menambah lantai 2 nanti

Roadmap penumpang adalah panel yang terbuka tepat di bawah tombol "Apakah kamu penumpang?" pada area peta. Tombol yang sama atau Escape menutup panel; tidak ada lagi bagian roadmap di bawah halaman Maps. Pilihan Departure 1–4 dan nomor gate hanya mengubah ringkasan di panel. Pilihan itu belum membuat rute atau memusatkan kamera karena area Departure dan lantai 2 belum dipetakan sebagai tujuan yang dapat dilalui. Saat asetnya tersedia, tambahkan bidang jalan kaki, geometri penghalang, bukaan pintu, dan konektor tangga/lift untuk tiap lantai.

Lantai 2 **belum** terpasang. Tambahkan ekspor GLB lantai 2 di `public/`, lalu definisikan URL asetnya di `src/lib/map3d/assets.ts`. Setelah itu, perluas loader dan state lantai pada `AirportWayfinding.tsx`/`SceneModel.tsx`, baca bidang jalan kaki serta penghalang lantai 2, dan buat koneksi antar-lantai (misalnya tangga/lift) sebelum mengaktifkan rute lintas lantai. Perbarui juga cakupan pada Home dan Help. Menyalin GLB saja belum cukup untuk menghasilkan navigasi lantai 2.

Kode 2D lama masih ada di repositori sebagai arsip implementasi, tetapi tidak dipanggil lagi oleh Home maupun Maps. Aset 3D ini adalah salinan lokal dari repo peta, jadi perubahan baru di repo sumber tidak otomatis masuk ke website utama.
