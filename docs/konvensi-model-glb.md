# Konvensi model GLB untuk navigasi

Dokumen ini menjelaskan apa yang dibaca aplikasi dari sebuah file GLB, supaya model
berikutnya dapat dipakai tanpa mengubah kode.

## Yang dikenali dari bentuk, bukan dari nama

Sebelumnya hampir semua klasifikasi bergantung pada nama objek: `tembok_pilar`,
`GLASS__dinding-kaca`, `T1-GF-`, `Eskalator`, `CHAIR`, `FOUNTAIN`, dan seterusnya.
Model baru dengan penamaan berbeda akan gagal dibaca. Sekarang hal-hal berikut
dikenali dari geometri:

| Hal | Aturan |
|---|---|
| Tingkat lantai | Bidang mendatar (beda tinggi antar titik di bawah 12 cm) dikelompokkan berdasarkan ketinggian, toleransi 45 cm. Tingkat dengan luas terbesar dipakai sebagai lantai utama. |
| Ketinggian rute | Diambil per titik dari permukaan lantai di bawahnya, lalu dinaikkan 6 cm. Rute tidak lagi memakai satu ketinggian tetap dari dasar model. |
| Penghalang | Bidang yang **berdiri** (beda tinggi antar titik di atas 12 cm) dan berada dalam rentang ketinggian pejalan kaki di atas lantai. Bentuknya diikuti per segitiga, sehingga dinding miring tidak lagi memblokir persegi besar. |
| Bukan penghalang | Bidang mendatar: permukaan pijak, tutup meja, pelat hias. Objek yang seluruhnya di atas kepala: plafon, lampu gantung, papan tergantung. Pelat lantai di atasnya, karena ruang bebas dibatasi oleh lantai berikutnya. |
| Ruang tertutup | Lantai di dalam unit yang terkurung dinding dikenali sebagai kantong terpisah. Titik awal yang jatuh di sana dipindahkan ke lantai publik terdekat. |

## Yang masih perlu penamaan

Tiga hal tidak punya petunjuk bentuk yang dapat diandalkan, jadi tetap memakai nama.
Pencocokan tidak membedakan huruf besar kecil dan boleh berada di mana saja dalam nama.

| Maksud | Kata kunci pada nama objek | Alasan |
|---|---|---|
| Permukaan yang boleh dilalui | `area_visitor`, `walkable`, `area_jalan`, awalan `FLOOR_`, `nav_floor` | Apron di luar gedung berada pada ketinggian yang sama persis dengan lantai di dalam gedung. Tidak ada bentuk yang memisahkan keduanya. Pada model saat ini, `area_merah` di luar gedung sejajar dengan `area_visitor` di dalam. |
| Bukaan pintu | `door` atau `pintu` | Sebuah bukaan adalah ketiadaan geometri. Yang perlu ditandai justru letaknya. |
| Dinding kaca | `glass` atau `kaca` | Hanya dinding kaca yang boleh ditembus oleh bukaan pintu. Tembok dan pilar tidak, meskipun ada pintu di dekatnya. |

Bila tidak ada satu pun objek yang cocok dengan daftar permukaan jalan, seluruh
bidang mendatar pada tingkat terluas dipakai sebagai cadangan. Hasilnya tetap
berjalan, tetapi rute bisa keluar gedung. Untuk model produksi, beri nama
permukaan jalannya.

## Daftar periksa saat mengekspor dari Blender

1. Permukaan jalan diberi nama yang mengandung `area_visitor` atau `walkable`.
   Satu objek per lantai, misalnya `area_visitor_L1` dan `area_visitor_L2`.
2. Lantai 1 dan Lantai 2 dipisahkan jaraknya secara nyata pada sumbu Y, minimal
   sekitar 2,5 meter, supaya terdeteksi sebagai dua tingkat.
3. Dinding, pilar, dan perabot berdiri diekspor sebagai geometri bervolume, bukan
   bidang setebal nol. Bidang setebal nol tetap diblokir, tetapi ketebalannya
   diperkirakan setengah sel grid.
4. Pintu diberi nama berawalan `DOOR__`, dibuat tipis pada arah tebal dinding dan
   lebar pada arah bukaan. Orientasi diambil dari bentuk pintu itu sendiri.
5. Dinding kaca diberi nama yang mengandung `kaca` atau `glass`.
6. Plafon dan elemen gantung boleh dibiarkan. Keduanya otomatis diabaikan selama
   berada di atas rentang ketinggian pejalan kaki.

## Model bertingkat: satu file untuk dua lantai

Aplikasi memuat satu file, `public/models/t1-gabungan.glb`, yang dibuat dari dua
ekspor Blender:

| Lantai | File sumber |
|---|---|
| Lantai 1 (GF) | `public/models/buildings-ground-floor.glb` |
| Lantai 2 (FF) | `data/models/t1-lantai-2.glb` |

Setelah salah satu file sumber berubah:

```
node scripts/merge-floors.mjs
```

lalu naikkan versi `TERMINAL_MODEL_URL` di `src/lib/map3d/assets.ts`.

Skrip menaruh isi GF di bawah node `LEVEL__L1` dan isi FF di bawah `LEVEL__L2`.
Tombol lantai hanya menyembunyikan salah satu grup, jadi model tidak dimuat ulang
dan rute yang aktif tetap ada. Yang dilakukan skrip:

- **Menyelaraskan FF ke GF.** Kedua file diekspor terpusat pada kotak pembatasnya
  sendiri, jadi titik nolnya berbeda. Geseran FF (`FF_OFFSET`, saat ini
  X −0,79 m, Y +3,0 m, Z +9,23 m) dicari dari 56 pasang pilar struktur yang
  menembus kedua lantai; sisa selisihnya rata-rata 0,25 m. Bila FF diekspor ulang
  dengan titik nol lain, angka ini perlu dicari ulang.
- **Membuang salinan GF di file FF.** File FF ikut membawa eskalator dan tangga
  bernama `T1-GF-...` dengan posisi sedikit bergeser. Salinan ini dibuang; versi
  dari file GF yang dipakai.
- **Memberi akhiran `__L2`** pada nama FF yang sudah dipakai di GF (misalnya
  `tembok_pilar_42`), supaya penanda Departure dan konfigurasi admin per nama
  tetap menunjuk objek Lantai 1.

### Pesawat di apron

`src/lib/map3d/aircraft.ts` membuat pesawat low-poly (ukuran kelas A320 dikali
skala model) dan menempatkannya nose-in di setiap `garbarata_*`, dengan pintu
depan di ujung kabin garbarata. Satu dari setiap lima stand dibiarkan kosong.
Warna ekor polos, bukan identitas maskapai. Pesawat ikut tombol area luar gedung.

### Penghubung antarlantai

Rute antarlantai lewat objek yang namanya mengandung salah satu kata berikut dan
geometrinya benar-benar menjangkau dari lantai bawah ke lantai atas:

| Nama | Arah yang dipakai rute |
|---|---|
| `EKS NAIK`, `ESKALATOR NAIK` | hanya naik |
| `EKS TURUN`, `ESKALATOR TURUN` | hanya turun |
| `TANGGA`, `STAIR` | dua arah |

Eskalator tanpa kata NAIK/TURUN (misalnya `T1-GF-EKS-05`) tidak dipakai karena
arahnya tidak diketahui. Ujung bawah dan atas diambil dari titik geometri pada
ketinggian masing-masing lantai, jadi cukup objek visualnya (`ESC_VIS__...`,
`STAIR_VIS__...`) yang miring dari lantai ke lantai.

### Daftar periksa tambahan untuk Lantai 2

1. Pelat lantai diberi nama berawalan `FLOOR_` (sekarang `FLOOR_JUANDA_FF8`).
2. Gate diberi nama `T1-FF-GATE-<nomor>`. Nomor ini yang dicocokkan dengan isian
   gate di panduan penumpang.
3. Eskalator diberi kata NAIK atau TURUN sesuai arah sebenarnya.

## Pengujian

`npm test` menjalankan, antara lain:

- `tests/map3d-floor-levels.test.ts`: pengelompokan tingkat, ketinggian rute pada
  model dua lantai, bidang hias mendatar yang tidak boleh memblokir, dinding tanpa
  nama yang tetap memblokir, dan titik awal di dalam unit tertutup.
- `tests/map3d-real-glb.test.ts`: membaca `buildings-ground-floor.glb` yang asli dan
  memastikan rute antar unit masih terbentuk.
- `tests/map3d-multi-floor.test.ts`: membaca `t1-gabungan.glb`, memeriksa
  pengelompokan lantai, ketinggian kedua lantai, arah eskalator, rute Departure 1
  ke Gate 5 (naik), Gate 3 ke Baggage Claim B1 (turun), dan rute di satu lantai.

Saat menambahkan model baru, salin pola pada `map3d-real-glb.test.ts` agar model
tersebut ikut diuji.
