# Menampilkan Peta di Website Lain

Dokumen ini menjelaskan cara memasukkan halaman peta dari proyek Juanda Airport Wayfinding ke sebuah frame pada website lain.

## Pilihan yang disarankan

Jalankan dan deploy proyek peta sebagai aplikasi terpisah, lalu tampilkan halaman `/map` dengan elemen `iframe` pada website utama. Cara ini menjaga aplikasi peta, database, dan portal admin tetap terpisah dari website utama.

```text
Website utama
  └─ iframe
       └─ https://map.contoh-domain.com/map
```

## 1. Siapkan URL peta

Peta harus dapat diakses dari browser. Contoh URL produksi:

```text
https://map.contoh-domain.com/map
```

Untuk pengujian di komputer sendiri, jalankan proyek ini dengan `npm run dev`, lalu gunakan:

```text
http://localhost:3000/map
```

`localhost` hanya dapat digunakan jika website utama juga dibuka dari komputer yang sama.

## 2. Izinkan halaman dibuka dalam iframe

Saat ini proyek sengaja menolak iframe melalui pengaturan keamanan di `next.config.ts`:

```text
X-Frame-Options: DENY
frame-ancestors 'none'
```

Sebelum memasang iframe, ubah kebijakan tersebut agar hanya domain website utama yang diizinkan. Jangan menghapus pembatasan ini untuk semua domain.

Contoh jika website utama berada di `https://www.contoh-domain.com`:

```ts
{ key: "X-Frame-Options", value: "SAMEORIGIN" },
{ key: "Content-Security-Policy", value: "...; frame-ancestors 'self' https://www.contoh-domain.com; ..." },
```

Catatan: `X-Frame-Options: SAMEORIGIN` hanya cocok bila iframe dan website utama memakai origin yang sama. Jika memakai subdomain atau domain berbeda, gunakan CSP `frame-ancestors` sebagai kontrol utama dan pastikan header `X-Frame-Options: DENY` tidak lagi dikirim.

Setelah perubahan konfigurasi, jalankan ulang aplikasi lalu periksa header respons dari `/map`.

## 3. Tambahkan iframe pada website utama

### HTML biasa

```html
<iframe
  src="https://map.contoh-domain.com/map"
  title="Peta Navigasi Bandara Juanda"
  width="100%"
  height="700"
  style="display: block; border: 0;"
  allowfullscreen
></iframe>
```

### React atau Next.js

```tsx
<iframe
  src="https://map.contoh-domain.com/map"
  title="Peta Navigasi Bandara Juanda"
  className="h-[700px] w-full border-0"
  allowFullScreen
/>
```

Atur tinggi iframe sesuai desain halaman. Pada perangkat mobile, gunakan tinggi berbasis viewport bila peta perlu memenuhi layar:

```css
.airport-map-frame {
  width: 100%;
  min-height: 70vh;
  border: 0;
}
```

## 4. Mengirim titik awal atau tujuan dari website utama

Untuk hanya menampilkan peta, langkah ini tidak diperlukan. Jika website utama perlu mengarahkan pengguna ke lokasi tertentu, gunakan parameter URL yang sudah didukung:

```html
<iframe
  src="https://map.contoh-domain.com/map?location=demo-t1-arrival"
  title="Peta Navigasi Bandara Juanda"
></iframe>
```

Nilai `location` harus cocok dengan data QR location di aplikasi peta. Pada data demo saat ini tersedia `demo-t1-arrival` dan `demo-t2-arrival`.

Untuk pertukaran data yang lebih kompleks, gunakan `window.postMessage`. Validasi selalu `event.origin` di kedua aplikasi dan jangan menerima pesan dari origin yang tidak dikenal.

## Checklist sebelum publikasi

- Proyek peta sudah di-deploy dengan HTTPS.
- URL iframe memakai `/map`.
- CSP `frame-ancestors` hanya menyebut domain website utama yang dipercaya.
- Header `X-Frame-Options: DENY` tidak menghalangi domain yang diizinkan.
- Peta diuji pada desktop dan mobile.
- Data peta yang ditampilkan sudah sesuai status operasionalnya. Data bawaan proyek ini masih berstatus demo.
