# Area luar gedung Terminal 1

Peta 3D menampilkan lingkungan di sekitar T1: parkiran, jalan akses, area taksi dan
bus, gedung kecil di sekitarnya, dan strip apron di sisi udara. Batasnya sampai jalan
lingkar di belakang parkiran di utara, dan hanya strip apron di selatan.

## Sumber data

OpenStreetMap, sumber yang sama dengan peta 2D di halaman Home. Lisensinya ODbL,
jadi atribusi "© OpenStreetMap contributors" wajib tampil. Atribusi itu muncul di
pojok kanan bawah peta selama area luar ditampilkan.

| File | Isi |
|---|---|
| `data/osm/t1-exterior.txt` | Fitur OSM yang sudah dipotong dan dikonversi ke meter lokal. Satu baris per fitur. |
| `scripts/build-exterior.mjs` | Mengubah data di atas ke koordinat model GLB dan memotongnya ke batas tampilan. |
| `public/exterior/t1-exterior.json` | Hasil yang dibaca aplikasi (sekitar 17 KB). |
| `src/lib/map3d/exterior-geometry.ts` | Pembuat geometri: bidang datar, pita jalan, balok gedung. |
| `src/components/map3d/ExteriorScene.tsx` | Komponen 3D, warna lapisan, dan label parkir. |

Setelah mengubah data atau batas, jalankan:

```
node scripts/build-exterior.mjs
```

lalu naikkan versi `EXTERIOR_DATA_URL` di `ExteriorScene.tsx` supaya browser tidak
memakai salinan lama.

## Penyelarasan dengan model GLB

Posisi area luar dihitung, bukan ditaksir. Poligon gedung T1 dari OSM (way
177630771) dicocokkan ke seluruh pelat lantai GLB (`area_visitor` dan `area_merah`)
dengan mencari rotasi, skala, dan pergeseran yang memaksimalkan IoU.

| Parameter | Nilai |
|---|---|
| IoU | 0,898 |
| Skala | 0,81 |
| Rotasi | -9,2 derajat |

Dua temuan dari proses ini:

1. **Model GLB berskala sekitar 81% dari ukuran asli.** Bentuknya cocok, termasuk
   sayap barat yang sempit, takik di ujung timur, dan gerigi gate di sisi selatan.
   Akibatnya jarak yang ditampilkan di panel rute ("29 m", "159 m") sekitar 19%
   lebih pendek dari jarak berjalan sebenarnya. Kalau angka itu dipakai untuk
   estimasi waktu, kalikan dengan 1/0,81 atau perbaiki skala model di Blender.
2. **Model diluruskan sekitar 9 derajat.** Bangunan aslinya sedikit miring terhadap
   arah timur. Area luar ikut diputar agar sejajar dengan model, jadi kompas di
   layar tidak menunjuk utara sebenarnya dengan tepat.

Konvensi sumbu: X ke timur, Z ke selatan (utara = -Z), sama dengan logika pintu
`NORTH = minZ` di `walkable-grid.ts`.

## Cara gambar

Lapisan datar (tanah, rumput, air, apron, taxiway, parkir, jalan) digambar paling
awal dan tidak menulis depth buffer. Urutannya diatur lewat `renderOrder`. Dengan
cara ini terminal, gedung, dan garis rute selalu menimpa lapisan luar tanpa
z-fighting walaupun kamera jauh, karena bidang near kamera sangat kecil (0,01).

Gedung di sekitar diekstrusi dari jumlah lantai di OSM (3,5 m per lantai, dikali
skala model). Gedung tanpa data lantai dianggap dua lantai.

Area luar tidak ikut dihitung dalam navigasi. Komponennya terpisah dari
`SceneModel`, dan raycast-nya dimatikan sehingga tidak bisa diklik.

## Batasan

- Data OSM tidak selalu lengkap atau mutakhir. Rambu, marka parkir, dan pagar tidak
  digambar.
- Area luar disembunyikan pada tampilan Lantai 2 saja, karena lapisannya menempel di
  permukaan tanah.
- Tombol pohon di kontrol peta menyembunyikan atau menampilkan area luar.
