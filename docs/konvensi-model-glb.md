# Konvensi model GLB untuk navigasi

Dokumen ini menjelaskan apa yang dibaca aplikasi dari sebuah file GLB, supaya model
berikutnya (Lantai 2, gabungan, tampilan luar) dapat dipakai tanpa mengubah kode.

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
| Permukaan yang boleh dilalui | `area_visitor`, `walkable`, `area_jalan`, awalan `FLOOR__`, `nav_floor` | Apron di luar gedung berada pada ketinggian yang sama persis dengan lantai di dalam gedung. Tidak ada bentuk yang memisahkan keduanya. Pada model saat ini, `area_merah` di luar gedung sejajar dengan `area_visitor` di dalam. |
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

## Menambahkan file model baru

Daftar file ada di `src/lib/map3d/floors.ts`. Letakkan file di `public/models/`
dengan nama berikut, lalu naikkan `FLOOR_VERSION` agar browser tidak memakai
salinan lama:

```
public/models/t1-lantai-1.glb
public/models/t1-lantai-2.glb
public/models/t1-gabungan.glb
```

Aplikasi memeriksa file mana yang ada saat halaman peta dibuka. File yang belum
ada membuat tombol lantainya nonaktif, bukan membuat peta gagal dimuat.

## Pengujian

`npm test` menjalankan, antara lain:

- `tests/map3d-floor-levels.test.ts`: pengelompokan tingkat, ketinggian rute pada
  model dua lantai, bidang hias mendatar yang tidak boleh memblokir, dinding tanpa
  nama yang tetap memblokir, dan titik awal di dalam unit tertutup.
- `tests/map3d-real-glb.test.ts`: membaca `buildings-ground-floor.glb` yang asli dan
  memastikan rute antar unit masih terbentuk.

Saat menambahkan model baru, salin pola pada `map3d-real-glb.test.ts` agar model
tersebut ikut diuji.
