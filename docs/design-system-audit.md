# Audit design system: Juanda Airport Wayfinding

Cakupan: `globals.css`, `viewer.css` (peta 3D), 8 file `*.module.css`. Dihitung dari branch `feature/peta-juanda-t1`, 7 Oktober 2026.

## Ringkasan

| Aspek | Temuan |
|---|---|
| Total CSS | 8.359 baris di 11 file |
| Token terdefinisi | 22 variabel di `:root` (warna, bayangan, satu font). Tidak ada token spasi, tipografi, radius, atau motion |
| Warna hardcode | 665 hex di `globals.css`, 172 di `viewer.css`. `HelpPage.module.css` memakai 117 hex dan 0 variabel; `SiteChrome.module.css` 45 hex dan 0 variabel |
| Ukuran huruf | 88 nilai `font-size` berbeda, tanpa skala |
| Radius | Sedikitnya 12 nilai berbeda (6, 8, 9, 10, 12, 14, 16, 20, 24, 999px, 50%) |
| Skor | 35/100 |

## 1. Tiga bahasa visual dalam satu situs

| Area | Tampilan |
|---|---|
| Landing | Biru langit `#0284c7` dan teal `#008ca2`, `#00a8bd`, `#00d2ff`, latar terang |
| Header dan footer | Biru InJourney `#0756a8` ke atas, aksen putih |
| Peta 3D (`/map`) | Navy gelap `#081722`, panel `#142b3c`, tombol aktif `#126c9d` |

Tidak ada keluarga biru tunggal. Hasil hitungan menunjukkan puluhan hex biru yang berselisih beberapa digit (`#0275b2`, `#0284c7`, `#0369a1`, `#057fb7`, `#0587bc`, `#066b9d`, `#068ebf`, `#075985`, dan seterusnya). Pengguna berpindah dari Home ke Maps dan merasa masuk produk lain.

## 2. Tema gelap ditempel di atas tema terang

`viewer.css` menulis gaya terang untuk panel peta (baris 1499 sampai 1572), lalu menimpanya dengan gaya gelap di baris 1606 sampai 1660 untuk selector yang sama. Hasil akhir bergantung pada urutan file. Setiap komponen baru harus menulis ulang aturan hover dan pressed agar menang spesifisitas. Ini sempat terjadi pada tombol lantai: status "dipilih" tertutup warna hover sampai spesifisitasnya dinaikkan.

## 3. Tipografi

| Masalah | Bukti |
|---|---|
| Font utama `"Segoe UI"` hanya ada di Windows | `--font-ui` di `:root`. Di Mac, Android, dan iOS jatuh ke `system-ui` yang berbeda-beda |
| `Inter` dipanggil dua kali tanpa dimuat | Tidak ada `next/font` atau `@font-face` |
| 8 pola `font-family` berbeda | termasuk `Georgia, serif` satu kali dan `monospace` polos |
| Tanpa skala | 88 nilai `font-size` |

Untuk situs bandara, angka dan kode lokasi (`T1-GF-01`, nomor counter, nomor gate) tampil di mana-mana. Font dengan angka tabular dan karakter yang tegas akan memberi identitas lebih kuat daripada font sistem.

## 4. Komponen

| Komponen | Status |
|---|---|
| Tombol | Tidak ada komponen bersama. `roamora-cta-btn`, `roamora-search-submit-btn`, `.link` di Map3DPreview, tombol di `sea-*`, dan `passenger-map-link` masing-masing punya radius, tinggi, dan hover sendiri |
| Kartu | Sama. FacilityShortcuts, tutorial, bantuan, dan panel peta tidak berbagi dasar |
| Chip dan label | Ada belasan varian lokal (`navigation-floor-chip`, `eyebrow`, `kicker`, `sea-location-kicker`) |
| Fokus keyboard | Ada aturan global (`outline: 3px`), tapi `passenger-*` memakai oranye `#e76f43` dan peta memakai biru. Tidak konsisten |
| Variabel tanpa definisi di CSS | `--cta-color`, `--space-color`, `--poi-color`, `--chart-value`, `--cta-glow`, `--avatar-x`, `--avatar-y`. Beberapa mungkin diisi lewat atribut `style`. Perlu dicek satu per satu |

## 5. Yang sudah baik

| Hal | Catatan |
|---|---|
| Aturan `:focus-visible` global | Ada dan terlihat jelas |
| `color-scheme: light` dan `sr-only` | Sudah ada |
| Peta 3D memakai `module.css` untuk komponen baru | Pola yang benar, tinggal diisi token |
| Aset logo tertata | `public/Logo-ToDjuanda`, ikon wayfinding dalam SVG |

## Tindakan, berurutan

1. **Satu file token** (`src/styles/tokens.css`): satu keluarga biru (primer, gelap, terang), netral, satu aksen penunjuk arah, skala huruf 7 langkah, skala spasi 4px, 4 radius, 3 bayangan, durasi dan easing. Semua modul diganti bertahap dari hex ke variabel.
2. **Pilih font dan muat lewat `next/font`.** Satu keluarga untuk teks, angka tabular untuk kode lokasi.
3. **Pisahkan tema peta.** Jadikan variabel `--map-*` sehingga satu aturan menghasilkan satu tampilan, tanpa timpa-menimpa di akhir `viewer.css`.
4. **Tiga komponen dasar:** `Button` (primer, sekunder, ghost), `Card`, `Chip`. Landing, peta, dan bantuan memakainya.
5. **Landing dirancang di atas token itu**, bukan sebelumnya. Urutan ini menghindari tulis ulang dua kali.

## Arah untuk landing (usulan, belum dikerjakan)

Landing sekarang memakai foto pesawat, widget pencarian melayang, tiga kartu fitur sejajar, dan blok langkah bernomor. Pola itu generik dan bisa dipakai untuk situs mana saja.

Usulan arah: bahasa visual **papan penunjuk bandara**. Angka besar, panah tebal, kontras tinggi, kode lokasi sebagai elemen utama. Peta Juanda sungguhan (poligon T1 yang sudah ada) menjadi hero, dengan jalur rute yang tergambar saat halaman dimuat. Ini hanya bisa dilakukan situs ini, karena datanya ada di sini.

Keputusan yang perlu dari kamu sebelum landing dikerjakan:

1. Arah visual di atas, atau tetap biru langit dengan foto?
2. Warna merek: ikut InJourney (biru tua) atau mempertahankan biru langit sekarang?
3. Apakah boleh mengganti font?
