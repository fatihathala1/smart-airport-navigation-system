# Proposal HiClean - Draft 10 Halaman

> Dokumen kerja untuk menyusun proposal PDF. Setiap bagian bertanda `---` merepresentasikan satu halaman A4.

## Ketentuan Narasi Proposal

* Nama produk hanya muncul pada cover dan mulai diperkenalkan pada halaman solusi.
* Halaman latar belakang, masalah, tujuan, riset, dan pain point harus membahas konteks serta kebutuhan pengguna tanpa menyebut nama produk.
* Gunakan frasa seperti “solusi digital”, “aplikasi yang dirancang”, atau “sistem penjemputan berbasis kategori” sebelum bagian solusi.
* Bagian solusi menjadi titik pertama yang menjelaskan nama, konsep, dan nilai pembeda produk.

## Peta Sitasi (Catatan Kerja)

|Sumber|Halaman penggunaan|Fungsi sitasi|
|-|-:|-|
|KLHK (2024)|2|Data timbulan sampah nasional dan sampah belum terkelola.|
|BPS Kota Surabaya (2025)|2|Sumber primer data demografi Surabaya.|
|Pemerintah Kota Surabaya (2025a)|2, 3|Timbulan, sumber dan komposisi sampah Surabaya; ekosistem bank sampah.|
|Pemerintah Kota Surabaya (2025b)|2|Perbandingan kepadatan penduduk Surabaya dan Jawa Timur.|
|Republik Indonesia (2008)|3|Dasar pengurangan, pendauran ulang, dan pemanfaatan kembali sampah.|
|KLHK (2021)|3|Peran bank sampah serta pencatatan jenis dan jumlah material.|
|Farida et al. (2024)|5|Hambatan perilaku pengumpulan PET dan pentingnya kemudahan infrastruktur penyerahan.|
|Sembiring et al. (2024)|5, 6|Dasar insight panduan visual dan edukasi pemilahan; alasan fitur panduan kategori.|

> Hapus tabel ini dari PDF final. Tabel hanya dipakai untuk mengecek bahwa setiap entri daftar pustaka telah dikutip dalam narasi atau keterangan visual.

\---

## Halaman 1 - Cover

**\[Logo HIMAPRO SI di bagian atas]**

# HiClean

## Perancangan UI/UX Layanan Penjemputan Sampah Anorganik Terpilah Berbasis Kategori untuk Menghubungkan Warga dan Pengepul dalam Ekonomi Sirkular

**Disusun oleh**  
**\[Nama Tim]**

**Anggota:**

1. \[Nama anggota 1]
2. \[Nama anggota 2]
3. \[Nama anggota 3]

**\[Nama institusi/sekolah]**  
**UI/UX Design Competition INSYS 2026**

\---

## Halaman 2 - Latar Belakang, Masalah, dan Tujuan

### Latar Belakang

Indonesia menghasilkan 34,21 juta ton sampah per tahun dari 317 kabupaten/kota pelapor. Sebanyak 40,26% atau sekitar 13,77 juta ton belum terkelola (KLHK, 2024). Pengurangan sampah perlu dimulai dari rumah, sebelum material masuk ke rantai pembuangan.

Surabaya dipilih sebagai wilayah pilot karena memiliki kepadatan 8.958 jiwa per km² pada 2024, jauh di atas rata-rata Jawa Timur yang mencapai 864 jiwa per km² (BPS Kota Surabaya, 2025; Pemerintah Kota Surabaya, 2025b). Kota ini menghasilkan 660.946,82 ton sampah pada 2024, dengan rumah tangga sebagai sumber terbesar sebesar 85,2%. Plastik menyumbang 22% dari total timbulan (Pemerintah Kota Surabaya, 2025a).

Surabaya telah memiliki 3 bank sampah induk dan 670 bank sampah unit, tetapi pengurangan sampah dari sumber baru mencapai 7,43%. Material anorganik kehilangan nilai saat warga mencampurkannya dengan sampah basah atau tidak memilahnya berdasarkan jenis. Warga membutuhkan panduan dan kepastian penjemputan, sedangkan pengepul membutuhkan data pengambilan serta verifikasi yang rapi. Kebutuhan tersebut mendasari perancangan solusi digital berbasis kategori dan jadwal.

> \\\*\\\*Visual yang disisipkan di halaman 2:\\\*\\\* Infografik “Mengapa Surabaya?” dengan empat angka: \\\*\\\*8.958 jiwa/km²\\\*\\\*, \\\*\\\*660.946,82 ton/tahun\\\*\\\*, \\\*\\\*85,2% bersumber dari rumah tangga\\\*\\\*, dan \\\*\\\*7,43% pengurangan dari sumber\\\*\\\*. Sertakan keterangan kecil: \\\*Sumber: Pemerintah Kota Surabaya (2025a, 2025b).\\\* Letakkan infografik di sisi kanan atau bawah teks agar tidak mengganggu alur baca.

### Masalah yang Diangkat

1. Warga belum memiliki panduan praktis mengenai kategori dan kondisi material anorganik yang dapat disetorkan.
2. Penjemputan material belum selalu memberi kepastian kategori, jadwal, dan informasi hasil penerimaan.
3. Pengepul memerlukan manifest pengambilan serta pencatatan timbang dan verifikasi yang mudah digunakan di lapangan.

### Tujuan Perancangan

Merancang prototype aplikasi mobile yang membantu warga memilah dan menjadwalkan setoran material anorganik, sekaligus membantu pengepul mengelola pengambilan, verifikasi, dan pencatatan hasil setoran. Rancangan ini mendukung ekonomi sirkular melalui material yang lebih terpilah, alur pengumpulan yang lebih terarah, dan status setoran yang transparan.

\---

## Halaman 3 - HiClean: Solusi dan Nilai Pembeda

### HiClean dalam Satu Alur

**HiClean** adalah prototype aplikasi mobile yang menghubungkan warga, pengepul, dan mitra pengelolaan sampah dalam layanan penjemputan material anorganik terpilah. Warga menyiapkan plastik, kertas atau kardus, dan logam berdasarkan panduan kategori. Mereka lalu memilih jadwal penjemputan yang tersedia. Pengepul menerima manifest tugas, memverifikasi kondisi serta berat material di lokasi, kemudian memperbarui status setoran warga.

HiClean tidak menggantikan bank sampah atau pengepul yang telah beroperasi. Aplikasi ini membantu mereka bekerja dengan informasi yang lebih terstruktur: jenis material, perkiraan setoran, lokasi, hasil timbang, dan alasan penolakan bila material belum memenuhi standar. Pendekatan tersebut sejalan dengan pengurangan sampah melalui pendauran ulang serta pemanfaatan kembali yang diamanatkan dalam Undang-Undang Nomor 18 Tahun 2008 (Republik Indonesia, 2008).

### Nilai Pembeda

Penjemputan pada HiClean berbasis **kategori dan jadwal**, bukan penjemputan sampah campuran secara instan. Model ini membantu warga menyiapkan material sesuai standar sebelum pengepul datang. Pengepul juga dapat mengelompokkan tugas serta memprediksi kebutuhan pengambilan berdasarkan kategori. Setelah penjemputan, warga melihat hasil timbang, status diterima atau ditolak, dan catatan verifikasi.

Data kategori, berat, dan status setoran dirancang untuk mendukung pencatatan yang dibutuhkan dalam pengelolaan bank sampah. Peraturan Menteri Lingkungan Hidup dan Kehutanan Nomor 14 Tahun 2021 mengatur pemantauan jumlah serta jenis sampah yang dipilah, dikumpulkan, dimanfaatkan kembali, atau diolah (KLHK, 2021).

### Ekosistem Layanan

**Warga** menyiapkan dan memesan setoran → **Pengepul** mengambil, menimbang, dan memverifikasi → **Bank sampah/mitra pengolah** menerima material yang tercatat → **Warga** menerima riwayat dan status setoran.

> \\\*\\\*Visual yang disisipkan di halaman 3:\\\*\\\* Diagram alur horizontal empat aktor: \\\*Warga → Pengepul → Bank Sampah/Mitra → Riwayat Warga\\\*. Di bawah masing-masing aktor, tampilkan satu aksi inti: \\\*Pilah \\\& booking\\\*, \\\*Jemput \\\& timbang\\\*, \\\*Terima \\\& salurkan\\\*, dan \\\*Lihat status\\\*. Gunakan panah melingkar tipis untuk menunjukkan ekonomi sirkular.

<!-- Daftar pustaka final diletakkan setelah Halaman 10. -->

\---

## Halaman 4 - Pengguna dan Ekosistem Layanan

HiClean memakai dua peran utama karena proses setoran terjadi sebelum, saat, dan setelah penjemputan. Warga menyiapkan material di rumah. Pengepul menjalankan pekerjaan lapangan yang membutuhkan informasi cepat dan pencatatan yang praktis.

### Pengguna Utama

|Peran|Tujuan|Kebutuhan utama|Hambatan saat ini|
|-|-|-|-|
|**Warga**|Menyetorkan material anorganik dengan mudah.|Panduan kategori, jadwal pasti, dan bukti hasil setoran.|Ragu material yang diterima, tidak tahu cara menyiapkan, atau tidak mendapat kepastian penjemputan.|
|**Pengepul**|Mengambil dan menyalurkan material secara efisien.|Manifest tugas, estimasi material, input timbang, dan alasan verifikasi.|Informasi pengambilan tersebar, kondisi material tidak pasti, serta pencatatan lapangan belum rapi.|

### Stakeholder Pendukung

|Aktor|Peran dalam layanan|Informasi yang dibutuhkan|
|-|-|-|
|Bank sampah|Menerima dan mengelola material yang telah tercatat.|Kategori, berat, dan asal setoran.|
|Mitra pengolah|Menerima material sesuai kebutuhan pengolahan.|Jenis dan volume material yang disalurkan.|
|Pengelola pilot|Mengatur kategori aktif, jadwal, area, dan mitra layanan.|Rekap penjemputan, penerimaan, dan penolakan.|

### Prinsip Pengalaman Pengguna

1. **Berikan arahan sebelum warga membuat booking.** Warga perlu tahu kategori dan standar kondisi material sebelum memilih jadwal.
2. **Kurangi langkah kerja pengepul di lapangan.** Manifest, timbang, dan verifikasi harus tersedia dalam satu alur singkat.
3. **Pastikan hasil setoran dapat dijelaskan.** Status diterima, diterima sebagian, atau ditolak harus memuat alasan yang mudah dipahami warga.

> \\\*\\\*Visual yang disisipkan di halaman 4:\\\*\\\* Dua kartu persona berhadapan: \\\*Warga\\\* dan \\\*Pengepul\\\*. Tambahkan ikon kecil di tengah sebagai “HiClean” yang menghubungkan keduanya. Di bawah kartu, gunakan tiga ikon pendukung untuk bank sampah, mitra pengolah, dan pengelola pilot.

\---

## Halaman 5 - Riset Pengguna dan Rumusan Masalah

### Pendekatan Riset

Perancangan menggunakan proses *Design Thinking*: empathize, define, ideate, prototype, dan test. Riset awal bersifat eksploratif melalui wawancara semi-terstruktur dengan dua pengepul sampah anorganik dan satu mahasiswa sebagai calon pengguna warga. Wawancara memetakan proses persiapan material, pengambilan, timbang, verifikasi, serta informasi yang dibutuhkan setelah setoran.

Riset sekunder memperkuat fokus tersebut. Farida et al. (2024) menunjukkan bahwa keterbatasan infrastruktur penyerahan menjadi salah satu hambatan pengumpulan botol PET untuk didaur ulang. Sembiring et al. (2024) menunjukkan bahwa panduan visual dan edukasi dapat mendukung pengetahuan serta praktik pemilahan sampah rumah tangga.

### Temuan yang Diterjemahkan Menjadi Desain

|Kebutuhan pengguna|Implikasi desain HiClean|
|-|-|
|Warga perlu memahami material yang dapat disetorkan dan cara menyiapkannya.|Panduan kategori, contoh kondisi material, dan checklist persiapan.|
|Warga perlu kepastian bahwa setoran berhasil diproses.|Status penjemputan, hasil timbang, serta alasan terima atau tolak.|
|Pengepul perlu mengetahui tugas sebelum menuju lokasi.|Manifest harian berisi alamat, kategori, dan estimasi setoran.|
|Pengepul perlu mencatat hasil di lapangan tanpa proses yang rumit.|Input timbang, status verifikasi, alasan penolakan, dan catatan singkat.|

### Problem Definition

Warga membutuhkan cara yang mudah untuk memilah material anorganik, memilih jadwal penjemputan, dan memahami hasil setoran. Pengepul membutuhkan informasi pengambilan yang teratur serta pencatatan timbang dan verifikasi yang cepat. Kedua kebutuhan tersebut belum terhubung dalam satu alur layanan.

### How Might We

Bagaimana merancang layanan yang membantu warga menyiapkan sampah anorganik dengan benar, sekaligus membantu pengepul mengatur pengambilan dan menjelaskan hasil verifikasi secara transparan?

> \\\*\\\*Visual yang disisipkan di halaman 5:\\\*\\\* Tampilkan alur riset singkat \\\*Wawancara + Riset Sekunder → Insight → Keputusan Desain\\\*. Gunakan empat kartu kecil dari tabel “Kebutuhan pengguna” sebagai isi visual, bukan menambah paragraf baru.

\---

## Halaman 6 - Fitur Utama dan Prioritas MVP

HiClean memprioritaskan fitur yang mendukung satu siklus setoran: warga memahami material, membuat booking, pengepul memverifikasi, lalu warga menerima hasilnya. Fokus ini menjaga prototype tetap realistis untuk diuji pada wilayah pilot.

### Fitur untuk Warga

|Fitur|Fungsi|Masalah yang dijawab|
|-|-|-|
|**Panduan kategori**|Menjelaskan material yang diterima, contoh kondisi layak, dan cara menyiapkannya.|Keraguan warga saat memilah.|
|**Kalender \& booking**|Menampilkan kategori dan slot aktif, lalu menerima alamat serta estimasi setoran.|Ketidakpastian penjemputan.|
|**Status setoran**|Menampilkan status dijadwalkan, dijemput, diverifikasi, diterima, atau ditolak.|Warga tidak mendapat kepastian setelah material diambil.|
|**Riwayat setoran**|Menyimpan berat, catatan pengepul, dan poin simulasi.|Warga tidak memiliki bukti hasil setoran.|

### Fitur untuk Pengepul

|Fitur|Fungsi|Masalah yang dijawab|
|-|-|-|
|**Manifest harian**|Menyajikan daftar tugas berdasarkan area, kategori, dan estimasi material.|Informasi pengambilan tersebar dan sulit diprioritaskan.|
|**Verifikasi timbang**|Mencatat berat, penerimaan, penolakan, dan alasan yang dipilih dari daftar.|Pencatatan lapangan belum konsisten.|
|**Rekap material**|Menampilkan material yang telah diterima untuk dicatat dalam penyaluran ke mitra.|Sulit melihat ringkasan hasil pengambilan.|

Panduan kategori menggunakan bahasa singkat, contoh visual, dan checklist persiapan karena edukasi serta petunjuk visual dapat mendukung praktik pemilahan rumah tangga (Sembiring et al., 2024). Poin atau saldo hanya berperan sebagai simulasi insentif, bukan fitur transaksi pada tahap pilot.

> \\\*\\\*Visual yang disisipkan di halaman 6:\\\*\\\* Gunakan matriks dua kolom dengan warna berbeda: empat kartu fitur \\\*Warga\\\* di sisi kiri dan tiga kartu fitur \\\*Pengepul\\\* di sisi kanan. Hubungkan kartu \\\*Booking\\\*, \\\*Manifest\\\*, \\\*Verifikasi\\\*, dan \\\*Status\\\* dengan garis tipis untuk menampilkan satu siklus layanan.

## Daftar Pustaka (Master)

Badan Pusat Statistik Kota Surabaya. (2025). *Kota Surabaya dalam angka 2025*. https://surabayakota.bps.go.id/id/publication/2025/02/28/bd1f25e59ae790cc8a7c0c07/kota-surabaya-dalam

Farida, Y., Siswanto, N., \& Vanany, I. (2024). Reverse logistics toward a circular economy: Consumer behavioral intention toward polyethylene terephthalate (PET) recycling in Indonesia. *Case Studies in Chemical and Environmental Engineering, 10*, 100807. https://doi.org/10.1016/j.cscee.2024.100807

Kementerian Lingkungan Hidup dan Kehutanan. (2021). *Peraturan Menteri Lingkungan Hidup dan Kehutanan Nomor 14 Tahun 2021 tentang pengelolaan sampah pada bank sampah*. https://jdih.menlhk.go.id/new2/uploads/files/2021pmlhk014\_menlhk\_07222021141822.pdf

Kementerian Lingkungan Hidup dan Kehutanan. (2024). *Sistem Informasi Pengelolaan Sampah Nasional: Capaian kinerja pengelolaan sampah tahun 2024*. https://sipsn.menlhk.go.id/sipsn/

Pemerintah Kota Surabaya. (2025a). *Keputusan Wali Kota Surabaya Nomor 100.3.3.3/210/436.1.2/2025 tentang Peta Jalan (Roadmap) Rencana Aksi Akselerasi Penuntasan Pengelolaan Sampah Kota Surabaya Tahun 2025-2026*. https://jdih.surabaya.go.id/uploads/peraturan/2025kepwali3578100-3-3-3-210-436-1-2-2025.pdf

Pemerintah Kota Surabaya. (2025b). *Rencana Pembangunan Jangka Menengah Daerah Kota Surabaya Tahun 2025-2029*. https://surabaya.go.id/uploads/images/surabaya/media/files/rpjmd\_2025\_compressed\_9409\_0.pdf

Republik Indonesia. (2008). *Undang-Undang Republik Indonesia Nomor 18 Tahun 2008 tentang pengelolaan sampah*. https://peraturan.bpk.go.id/Details/39067/uu-no-18-tahun

Sembiring, E., Fenitra, R. M., Dangkua, A. R., Al Khoeriyah, Z. B., Van Der Laan, A. Z., Fan, Y., Ceschin, F., \& Jobling, S. (2024). Improving household waste management in Indonesia: A mixed-methods approach for waste sorting. *Cleaner Waste Systems, 9*, 100185. https://doi.org/10.1016/j.clwas.2024.100185

