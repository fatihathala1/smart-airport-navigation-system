# Bug Fix: Algoritma Pencarian Rute - Pathfinding Issue

## 📋 Ringkasan Masalah

Algoritma A* (pathfinding) pada proyek tidak dapat menemukan jalur ke lokasi pilihan dalam skenario tertentu.

**Kondisi yang menyebabkan masalah:**
- User memilih destinasi di **Lantai yang sama** dengan starting point
- Terdapat obstacle/dinding yang menghalangi jalur langsung (**direct path gagal**)
- Contoh: User di Lantai 1 lokasi A, ingin ke Lantai 1 lokasi B, tapi ada dinding yang menghalangi

**Hasil yang terjadi:**
- ❌ Fungsi mengembalikan `null` (rute tidak ditemukan)
- ❌ Pengguna tidak dapat navigasi
- ❌ User experience yang buruk

---

## 🔍 Root Cause Analysis

### Lokasi Bug
**File:** `src/lib/astar.ts`  
**Fungsi:** `astarWithStairs()`  
**Baris:** ~163-167 (sebelum fix)

### Kode Bermasalah (Before)
```typescript
} else {
  // Start dan tujuan di lantai yang sama tapi direct path gagal → tidak ada jalan
  return null;  // ❌ BUG: Langsung return null tanpa mencoba alternatif!
}
```

### Masalahnya
Fungsi `astarWithStairs()` hanya menangani 2 skenario:
1. ✅ **Direct path tersedia** → gunakan rute langsung
2. ✅ **Lintas lantai** (L1→L2 atau L2→L1) → gunakan tangga sebagai waypoint
3. ❌ **Same floor, direct path gagal** → TIDAK DITANGANI → return null

---

## ✅ Solusi yang Diterapkan

### Perubahan Struktur Fungsi

Dari structure dengan `if-else` yang bermasalah, diubah menjadi 4 clear cases:

```typescript
// Case 1: Lantai 1 → Lantai 2 (lintas lantai)
if (startOnL1 && isDestL2) { ... }

// Case 2: Lantai 2 → Lantai 1 (lintas lantai)  
if (!startOnL1 && isDestL1) { ... }

// Case 3: Lantai 1 → Lantai 1 (same floor, direct path gagal)
// ✨ NEW: Gunakan stairs sebagai bypass waypoint
if (startOnL1 && isDestL1) { ... }

// Case 4: Lantai 2 → Lantai 2 (same floor, direct path gagal)
// ✨ NEW: Gunakan stairs sebagai bypass waypoint
if (!startOnL1 && isDestL2) { ... }
```

### Cara Kerja Case 3 & 4 (Same-Floor Bypass)

**Case 3 Lantai 1 → Lantai 1:**
```
Start (L1) 
  ↓
  [Cari path ke Staircase L1]
  ↓ (via staircase L1)
  ↑ (naik ke Lantai 2)
  ↓ (via staircase L2 di L2)
  ↓ (turun kembali ke Lantai 1)
Destination (L1)
```

**Case 4 Lantai 2 → Lantai 2:**
```
Start (L2)
  ↓
  [Cari path ke Staircase L2]
  ↓ (via staircase L2)
  ↑ (turun ke Lantai 1)
  ↓ (via staircase L1 di L1)
  ↓ (naik kembali ke Lantai 2)
Destination (L2)
```

**Output untuk User:**
- Rute ditemukan dengan label seperti: `"Tangga 1 (via Tangga 3)"`
- Segment pertama: Warna oranye (ke staircase)
- Segment kedua: Warna biru (dari staircase lain ke destinasi)

---

## 📝 Detail Implementasi

### Code Snippet (Case 3 - L1→L1 bypass)
```typescript
if (startOnL1 && isDestL1) {
  const stairsPoint = { r: staircaseL1.r, c: staircaseL1.c };
  const otherFloorStairs = { r: staircaseL2.r, c: staircaseL2.c };

  // Path ke staircase L1
  const pathToStairs = astarSingle(startR, startC, stairsPoint.r, stairsPoint.c, wallSet, rows, cols);
  if (!pathToStairs) return null;

  // Path dari staircase L2 ke destinasi
  const pathFromOtherStairs = astarSingle(otherFloorStairs.r, otherFloorStairs.c, destR, destC, wallSet, rows, cols);
  if (!pathFromOtherStairs) return null;

  return {
    segments: [
      { path: pathToStairs, color: "#f39c12" },
      { path: pathFromOtherStairs, color: "#58a6ff" },
    ],
    totalSteps: (pathToStairs.length - 1) + (pathFromOtherStairs.length - 1),
    usedStairs: true,
    stairsLabel: `${staircaseL1.label} (via ${staircaseL2.label})`,
  };
}
```

---

## 🧪 Testing Manual

### Skenario Test
1. **Buka aplikasi**, pilih Terminal T1
2. **Mulai dari:** Starting Point (sudah terdefinisi)
3. **Pilih destinasi:** Salah satu lokasi di Lantai 1 (misalnya: `food1`, `toilet2`, dll)
4. **Expected result:**
   - ✅ Rute ditemukan (sebelumnya: tidak ditemukan)
   - ✅ Path divisualisasi dengan 2 segment
   - ✅ Label menunjukkan: `"Tangga1 (via Tangga3)"`

### Kasus yang Diperbaiki
- User di L1 ingin ke lokasi L1 lain, tapi ada obstacle
- User di L2 ingin ke lokasi L2 lain, tapi ada obstacle
- Sebelum: ❌ Return null
- Sesudah: ✅ Menemukan rute via stairs bypass

---

## 🎯 Impact Analysis

### Positif
- ✅ **Lebih banyak rute ditemukan** (fallback scenario ditangani)
- ✅ **User experience lebih baik** (navigasi selalu berhasil jika dimungkinkan)
- ✅ **Intelligent routing** (memahami penggunaan stairs sebagai bypass)
- ✅ **Backward compatible** (tidak mengubah existing behavior)

### Edge Cases Handled
- ❌ Jika **tidak ada path ke staircase** → return null (reasonable)
- ❌ Jika **tidak ada path dari staircase lain ke destinasi** → return null (reasonable)
- ✅ Jika **ada path** → return multi-segment path (NEW behavior)

---

## 📦 Files Modified

| File | Changes | Status |
|------|---------|--------|
| `src/lib/astar.ts` | Added Case 3 & 4 for same-floor bypass | ✅ Complete |

## 🔄 Verification

- ✅ No TypeScript errors
- ✅ No linting errors  
- ✅ Logic verified
- ✅ Build successful

---

## 🚀 Next Steps (Optional)

### Optimization Ideas
1. **Multi-staircase routing:** Jika ada 2+ staircase, coba semua kombinasi
2. **Cost-aware routing:** Prioritas rute lebih pendek vs menggunakan stairs
3. **Machine learning:** Learn obstacle patterns dan predict bypass routes

### Further Testing
1. Test dengan Terminal T2
2. Test dengan berbagai kombinasi floor/lokasi
3. Performance benchmark (A* efficiency)

---

## 📚 References

- **Algorithm:** A* pathfinding with multi-floor support
- **Language:** TypeScript
- **Related Files:**
  - `src/components/ui/routePanel.tsx` (route calculation caller)
  - `src/data/walls/t1.ts`, `t2.ts` (wall data)
  - `src/store/mapStore.ts` (route state management)

---

**Fix Date:** 2026-06-10  
**Status:** ✅ DEPLOYED
