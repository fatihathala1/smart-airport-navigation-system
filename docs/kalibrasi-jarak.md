# Kalibrasi jarak Terminal 1

## Dasar yang disepakati

Pengguna menetapkan pengukuran Google Earth 648,57 m (memanjang) dan 100,79 m
(melintang) sebagai acuan yang dianggap benar, serta meminta melewati verifikasi
lapangan. Pencocokan ujung pada screenshot ke geometri model adalah asumsi yang
diterima untuk implementasi ini, bukan hasil survei. Angka pengali yang rinci
menyatakan presisi hitungan, bukan jaminan ketelitian dunia nyata.

| Arah | Ujung model | Bentang model | Acuan meter | Meter/unit |
| --- | --- | ---: | ---: | ---: |
| X | T1-GF-02.minX ke pusat X tembok_pilar_106 | 515,400885934 | 648,57 | 1,258379676 |
| Z | area_visitor.minZ ke area_merah.maxZ, penampang X=-50 | 78,070651960 | 100,79 | 1,291010098 |

Nilai sumber berada di `src/lib/map3d/distance-calibration.ts`, berlaku untuk
`public/models/t1-gabungan.glb` saat ini. Penggantian ekspor harus memeriksa ulang
titik acuan; tes GLB melindungi titik tersebut dari perubahan tanpa kalibrasi ulang.
Y tetap memakai konvensi merger lantai: 3 unit = 3 m, tanpa bukti ukur tinggi baru.
Asumsi tambahan: kedua lantai memakai skala horizontal yang sama.

## Perhitungan

Untuk setiap ruas rute, jarak meter =
`sqrt((dx * scaleX)^2 + (dy * 1)^2 + (dz * scaleZ)^2)`.
Jumlahkan panjang seluruh ruas, termasuk belokan dan lintasan miring konektor.
Jangan mengalikan lagi hasil meter pada panel, ETA, atau progres simulasi.

`createRouteMetrics` menerima faktor sumbu secara eksplisit dari viewer Terminal 1.
Koordinat untuk gambar dan kamera tetap dalam unit model. Jarak kumulatif, langkah,
ETA (1,35 m/detik), simulasi, dan proyeksi progres GPS memakai meter terkalibrasi.
Algoritma pencarian jalur/grid tetap bekerja dalam geometri model; kalibrasi ini
mengukur jalur yang dihasilkan, bukan mengklaim optimasi ulang semua jalur dalam
metrik anisotropik. API grid 2D demo tidak menggunakan kalibrasi Terminal 1 ini.

## Hubungan dengan GPS dan fit OSM lama

Fit OSM lama memakai 0,81 unit model per meter (kebalikannya 1,234567901 meter/unit).
Dengan ujung model di atas, fit tersebut memberi 636,30 m dan 96,38 m, masing-masing
sekitar 1,89% dan 4,37% di bawah acuan pengguna. Dua pengukuran pengguna menjadi
acuan baru; faktor lama tidak ditumpuk di atas faktor baru.

Pemetaan GPS mempertahankan origin dan rotasi -9,2 derajat dari fit lama. Gerakan
GPS dalam meter lokal diputar, lalu dibagi faktor X/Z yang sama dengan rute.
Nilai 0,81 hanya dipakai untuk mempertahankan posisi origin model yang lama.
Origin/arah geografis tetap asumsi fit lama, belum dikonfirmasi pengukuran baru.
Data tampilan luar OSM tetap memakai fit visual lama dan bukan acuan pengukuran.

Lokasi masih bergantung pada izin browser, HTTPS/localhost, serta kualitas sensor.
Penempelan marker ke koridor tidak membuktikan posisi fisiknya tepat. Tidak ada
klaim verifikasi GPS lapangan, penentuan lantai otomatis, atau survei baru.

## Verifikasi otomatis

Tes menguji dua bentang acuan, diagonal, tinggi 3 m, langkah berbelok, posisi
simulasi, ETA, progres GPS (termasuk proyeksi diagonal), kesesuaian perpindahan GPS
dalam beberapa arah, input skala tidak valid, dan titik acuan pada GLB nyata.
