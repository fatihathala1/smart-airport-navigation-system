# Architecture Notes

## Keputusan utama

### Space bukan tenant

`Space` mewakili area fisik permanen. `Tenant` adalah konten bisnis yang dapat berpindah. Relasi aktif disimpan melalui `SpaceAssignment`. Konsekuensinya, perubahan tenant tidak mengubah polygon, routing anchor, QR, atau kode space.

### Facility terpisah dari tenant

Toilet, gate, lift, escalator, mushola, dan information desk bukan okupansi komersial. Menyatukannya dengan tenant akan membuat ownership, jam, lifecycle, dan policy admin rancu. Karena itu keduanya berbagi `Category` dan `OperationalHour`, tetapi memiliki model berbeda.

### Dijkstra sebagai engine final

Flow v1 memakai A* berbasis grid dan asumsi tangga tertentu. Implementasi itu disimpan di `legacy/v1/src__lib__astar.ts` dan tidak masuk build. V2 memakai graph eksplisit dan Dijkstra. Graph lebih tepat untuk akses publik, directed escalator, closure, accessible metadata, serta audit perubahan edge.

## Map rendering

```text
MapStage
  BaseMapLayer
  SpaceLayer
  POILayer
  RouteLayer
  MarkerLayer
```

Continuous pan/zoom disimpan dalam `ref` dan diterapkan langsung ke transform SVG. React state tidak diperbarui pada setiap pointer move. Click/keyboard pada polygon tetap masuk ke state Zustand.

SVG T1/T2 existing hanya menjadi visual baseline. Sebelum production, setiap `Space.geometry` harus dipetakan ke source resmi dan memiliki versioning.

## Routing pipeline

```text
start/end anchor
  -> load active nodes and edges
  -> apply public/accessibility filters
  -> build directed adjacency list
  -> Dijkstra min-heap
  -> reconstruct nodes and edges
  -> group floor segments
  -> distance, ETA, connector instructions
```

Edge `BIDIRECTIONAL` ditambahkan dua kali ke adjacency. Edge `ONE_WAY` hanya ditambahkan dari `fromNodeId`. Restricted edge hanya dapat dipakai oleh caller yang secara eksplisit mengaktifkan `allowRestricted`; API publik tidak melakukannya.

## Authorization boundaries

- Page guard: `src/app/admin/layout.tsx`.
- Session construction: `src/lib/auth.ts`.
- Permission matrix: `src/lib/authorization.ts`.
- Payload validation: `src/lib/validation.ts`.
- Tenant enforcement: mutation tenant memerlukan permission `MANAGE_TENANTS` di server; permission ini hanya dimiliki Super Admin dan Airport Admin.
- Audit: perubahan tenant dan log ditulis dalam transaction yang sama.

Menambahkan tombol admin baru tidak memberikan izin baru. Setiap mutation baru wajib memanggil authorization helper atau policy service di server.

## Image upload boundary

`ImageStorage` adalah interface, sedangkan `UnconfiguredImageStorage` sengaja gagal tertutup. Adapter production harus menghasilkan signed upload URL dan menerapkan:

- allowlist MIME dan magic-byte sniffing;
- batas 5 MB dan batas dimensi;
- re-encode image untuk menghapus metadata;
- malware scan;
- object key acak, bukan filename pengguna;
- private staging bucket lalu publish setelah scan;
- delete/lifecycle policy dan audit.

## Security debt yang diketahui

- Login throttle saat ini hanya cocok untuk satu process.
- CSP development mengizinkan kebutuhan runtime Next; production harus diuji dengan nonce/strict CSP.
- Belum ada password reset, MFA, SSO, atau forced rotation.
- Belum ada object storage.
- Belum ada audit viewer dan retention job.
- Belum ada integration test terhadap PostgreSQL nyata.

## Migration strategy

V2 menyediakan baseline fresh karena schema v1 bersifat prototipe dan datanya tidak tervalidasi sebagai data resmi. Untuk database lama yang memang berisi data penting:

1. freeze perubahan konten;
2. backup dan uji restore;
3. export facility/floor/category lama;
4. petakan facility komersial ke Tenant + SpaceAssignment;
5. petakan POI non-komersial ke Facility;
6. buat transitional migration terpisah;
7. bandingkan count dan sample;
8. jalankan route validation sebelum cutover.
