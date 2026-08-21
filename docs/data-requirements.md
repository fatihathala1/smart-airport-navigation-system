# Data Requirements from Juanda

Dokumen ini adalah checklist handoff data. Tidak ada nilai contoh di sini yang boleh dianggap sebagai data operasional.

## 1. Floorplan source

Untuk setiap terminal dan lantai:

- source CAD/SVG/PDF resmi;
- nama terminal dan lantai;
- version date dan owner;
- coordinate system/viewBox;
- north/reference orientation jika relevan;
- dimensi fisik atau dua titik kalibrasi dengan jarak nyata;
- area publik, airside, landside, security, dan restricted.

## 2. Space master

| Field | Contoh format | Wajib |
| --- | --- | :---: |
| `code` | `T1-L1-S001` | Ya |
| terminal/floor | referensi master | Ya |
| polygon atau SVG element id | GeoJSON/SVG linkage | Ya |
| type | tenant, gate, facility, service, circulation, restricted | Ya |
| routing anchor | RouteNode code | Ya |
| status | active, inactive, temporarily closed | Ya |
| validation owner/date | metadata | Ya |

Kode space harus tetap saat tenant berganti.

## 3. Tenant and assignment

- nama resmi dan nama display;
- space code aktif;
- tanggal mulai/akhir assignment;
- kategori;
- deskripsi yang disetujui;
- logo/foto dengan hak penggunaan;
- kontak dan URL;
- jam operasional per hari;
- status dan owner perubahan.

## 4. Facility/POI

- code stabil;
- kategori dan nama display;
- space atau coordinate/anchor;
- jam jika relevan;
- accessible metadata;
- status operasional;
- maintenance owner.

## 5. Routing graph

Setiap node memerlukan code, floor, x, y, label, dan status. Setiap edge memerlukan:

- from/to node;
- jarak meter hasil kalibrasi;
- walkway, lift, stairs, atau escalator;
- bidirectional atau one-way;
- public access;
- accessible;
- active/status;
- closure owner dan timestamp.

Untuk escalator, arah fisik dan kebijakan perubahan arah harus dijelaskan. Untuk lift, hubungan antar lantai dan periode maintenance harus tersedia.

## 6. QR inventory

- `locationId` yang stabil dan tidak mengandung data sensitif;
- floor dan RouteNode;
- label fisik;
- posisi pemasangan dan foto bukti;
- tanggal instalasi/inspeksi;
- owner;
- replacement/revocation process.

Format URL target: `https://<domain>/?location=<locationId>`.

## 7. Route validation set

Tim lapangan perlu menyediakan rute uji yang mewakili:

- pintu masuk ke gate;
- arrival ke baggage/service;
- rute fasilitas terdekat;
- lintas lantai via lift;
- lintas lantai via stairs/escalator;
- escalator reverse yang harus gagal;
- restricted shortcut yang tidak boleh dipilih;
- closure yang memaksa detour;
- no-route;
- rute accessibility.

Untuk tiap rute: start, end, jalur yang diharapkan, jarak pembanding, waktu walkthrough, kondisi kepadatan, validator, tanggal, dan hasil pass/fail.

## 8. Acceptance

Data baru dianggap siap production setelah:

- owner data menandatangani version;
- mapping visual dan graph direview silang;
- route validation lulus;
- sample tenant/POI diverifikasi lapangan;
- restricted/public boundary direview security;
- rollback versi data tersedia.
