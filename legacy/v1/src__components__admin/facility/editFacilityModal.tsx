"use client";

import { useState, useEffect } from "react";
import { useMapStore } from "@/store/mapStore";
import type { Category, Floor, FacilityWithRelations, OperationalHour } from "@/types";
import OperationalHoursModal from "@/components/admin/facility/operationalHoursModal";

// =============================================================================
// HELPERS
// =============================================================================

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// =============================================================================
// KOMPONEN UTAMA
// =============================================================================

export default function EditFacilityModal() {
  const adminSelectedFacility      = useMapStore((s) => s.adminSelectedFacility);
  const setAdminSelectedFacility   = useMapStore((s) => s.setAdminSelectedFacility);
  const incrementFacilitiesVersion = useMapStore((s) => s.incrementFacilitiesVersion);

  const facility = adminSelectedFacility!;

  // id === 0 → create mode (POI belum terdaftar di DB)
  const isCreate = facility?.id === 0;

  // ── Form state ─────────────────────────────────────────────────────────────
  const [name,        setName]        = useState("");
  const [code,        setCode]        = useState("");
  const [description, setDescription] = useState("");
  const [categoryId,  setCategoryId]  = useState<number>(0);
  const [floorId,     setFloorId]     = useState<number>(0);
  const [photo,       setPhoto]       = useState<string | null>(null);
  const [hours,       setHours]       = useState<OperationalHour[]>([]);

  // ── Grid state (editable, dipakai saat save) ───────────────────────────────
  const [gridRow, setGridRow] = useState<number | null>(null);
  const [gridCol, setGridCol] = useState<number | null>(null);

  // ── Debug: nilai asli dari JSON (store) dan dari DB ───────────────────────
  const [jsonGridRow, setJsonGridRow] = useState<number | null>(null);
  const [jsonGridCol, setJsonGridCol] = useState<number | null>(null);
  const [dbGridRow,   setDbGridRow]   = useState<number | null | "loading">("loading");
  const [dbGridCol,   setDbGridCol]   = useState<number | null | "loading">("loading");
  // Koordinat ASLI dari wall data (dest.r / dest.c) — disisipkan oleh mapCanvas
  const [wallDestR,   setWallDestR]   = useState<number | null>(null);
  const [wallDestC,   setWallDestC]   = useState<number | null>(null);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [categories,     setCategories]     = useState<Category[]>([]);
  const [floors,         setFloors]         = useState<Floor[]>([]);
  const [showHoursModal, setShowHoursModal] = useState(false);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState<string | null>(null);

  // Sync form saat facility berubah
  useEffect(() => {
    if (!facility) return;
    setName(facility.name);
    setCode(facility.code);
    setDescription(facility.description ?? "");
    setCategoryId(facility.categoryId);
    setFloorId(facility.floorId);
    setPhoto(facility.photo ?? null);
    setHours(facility.operationalHours);
    setError(null);

    // Simpan nilai asli dari JSON/store untuk debug
    const jRow = facility.gridRow != null ? Math.round(facility.gridRow) : null;
    const jCol = facility.gridCol != null ? Math.round(facility.gridCol) : null;
    setJsonGridRow(jRow);
    setJsonGridCol(jCol);

    // Baca koordinat asli wall data yang disisipkan oleh mapCanvas
    const fAny = facility as unknown as Record<string, unknown>;
    setWallDestR(typeof fAny.wallDestR === "number" ? fAny.wallDestR : null);
    setWallDestC(typeof fAny.wallDestC === "number" ? fAny.wallDestC : null);

    if (isCreate) {
      // Create mode: pakai nilai JSON langsung (belum ada di DB)
      setGridRow(jRow);
      setGridCol(jCol);
      setDbGridRow(null);
      setDbGridCol(null);
    } else {
      // Edit mode: fetch dari DB untuk dapat nilai yang benar
      setDbGridRow("loading");
      setDbGridCol("loading");
      setGridRow(jRow); // sementara pakai JSON dulu
      setGridCol(jCol);
      fetch(`/api/facilities/${facility.id}`)
        .then((r) => r.json())
        .then((json) => {
          if (json.success && json.data) {
            const dRow = json.data.gridRow != null ? Math.round(json.data.gridRow) : null;
            const dCol = json.data.gridCol != null ? Math.round(json.data.gridCol) : null;
            setDbGridRow(dRow);
            setDbGridCol(dCol);
            // Pakai nilai DB sebagai nilai aktif yang akan disimpan
            setGridRow(dRow);
            setGridCol(dCol);
          } else {
            setDbGridRow(null);
            setDbGridCol(null);
          }
        })
        .catch(() => {
          setDbGridRow(null);
          setDbGridCol(null);
        });
    }
  }, [facility, isCreate]);

  // Fetch categories untuk dropdown
  useEffect(() => {
    async function load() {
      const res  = await fetch("/api/categories");
      const json = await res.json();
      if (json.success) setCategories(json.data);
    }
    load();
  }, []);

  // Fetch floors — hanya di create mode, filter per terminal dari template
  useEffect(() => {
    if (!isCreate || !facility) return;
    async function loadFloors() {
      const terminal = facility.floor.terminal;
      const res  = await fetch(`/api/floors?terminal=${terminal}`);
      const json = await res.json();
      if (json.success) setFloors(json.data as Floor[]);
    }
    loadFloors();
  }, [isCreate, facility]);

  if (!facility) return null;

  // ── Handle upload foto ─────────────────────────────────────────────────────
  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("Ukuran foto maksimal 2MB.");
      return;
    }
    const base64 = await toBase64(file);
    setPhoto(base64);
  }

  // ── Save ───────────────────────────────────────────────────────────────────
  async function handleSave() {
    setError(null);

    if (!name.trim())   { setError("Nama fasilitas wajib diisi."); return; }
    if (!code.trim())   { setError("Kode tempat wajib diisi.");    return; }
    if (!categoryId)    { setError("Kategori wajib dipilih.");     return; }
    if (isCreate && !floorId) { setError("Lantai wajib dipilih."); return; }

    setLoading(true);

    try {
      let res: Response;

      if (isCreate) {
        // ── POST — tambah fasilitas baru ──────────────────────────────────
        res = await fetch("/api/facilities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name:        name.trim(),
            code:        code.trim(),
            description: description.trim() || null,
            categoryId,
            floorId,
            gridRow:     gridRow,
            gridCol:     gridCol,
            photo:       photo ?? null,
            isActive:    true,
          }),
        });
      } else {
        // ── PUT — edit fasilitas yang ada ─────────────────────────────────
        res = await fetch(`/api/facilities/${facility.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name:        name.trim(),
            code:        code.trim(),
            description: description.trim() || null,
            categoryId,
            photo:       photo ?? null,
            // Pakai state gridRow/gridCol yang sudah di-sync dari DB (bukan dari facility/JSON)
            ...(gridRow != null && { gridRow }),
            ...(gridCol != null && { gridCol }),
          }),
        });
      }

      const json = await res.json();

      if (!json.success) {
        setError(json.error ?? "Gagal menyimpan.");
        return;
      }

      incrementFacilitiesVersion();
      setAdminSelectedFacility(null);
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setAdminSelectedFacility(null);
  }

  function renderHoursSummary(): string {
    if (hours.length === 0) return "Belum diatur";
    const open = hours.filter((h) => h.isOpen).length;
    return `${open} / 7 hari buka`;
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="relative bg-[#dce8f5] rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 flex flex-col gap-4">

          {/* Close */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 flex flex-col items-center text-gray-500 hover:text-gray-800 transition"
          >
            <span className="text-2xl leading-none">✕</span>
            <span className="text-[10px] mt-0.5">Close</span>
          </button>

          {/* Title */}
          <div className="border-b border-gray-300 pb-3">
            <h2 className="text-xl font-bold text-gray-800">
              {isCreate ? "Tambah Fasilitas" : "Edit Detail Lokasi"}
            </h2>

            {/* ── DEBUG: Grid Row / Col (tampil di semua kondisi) ─────────── */}
            <div className="mt-2 rounded-lg border border-dashed border-amber-400 bg-amber-50 px-3 py-2 text-xs font-mono">
              <p className="font-semibold text-amber-700 mb-1">
                🐛 DEBUG GRID &nbsp;—&nbsp;
                {isCreate
                  ? <span className="text-blue-600">[CREATE MODE — belum di DB]</span>
                  : <span className="text-green-700">[EDIT MODE — id: {facility.id}]</span>
                }
              </p>
              <div className="grid grid-cols-3 gap-x-2 gap-y-0.5 text-gray-700">
                {/* Header */}
                <span className="text-gray-400"></span>
                <span className="font-semibold text-gray-500">gridRow</span>
                <span className="font-semibold text-gray-500">gridCol</span>

                {/* Koordinat ASLI dari wall data (dest.r / dest.c) */}
                <span className="text-orange-600 font-semibold">Wall JSON</span>
                <span className={wallDestR == null ? "text-gray-400 italic" : "text-orange-700 font-bold"}>
                  {wallDestR ?? "null"}
                </span>
                <span className={wallDestC == null ? "text-gray-400 italic" : "text-orange-700 font-bold"}>
                  {wallDestC ?? "null"}
                </span>

                {/* Nilai dari JSON/store (gridRow/gridCol yang masuk ke store) */}
                <span className="text-purple-600">store</span>
                <span className={jsonGridRow == null ? "text-gray-400 italic" :
                  wallDestR != null && jsonGridRow !== wallDestR ? "text-yellow-600 font-bold" : "text-purple-700"}>
                  {jsonGridRow ?? "null"}
                </span>
                <span className={jsonGridCol == null ? "text-gray-400 italic" :
                  wallDestC != null && jsonGridCol !== wallDestC ? "text-yellow-600 font-bold" : "text-purple-700"}>
                  {jsonGridCol ?? "null"}
                </span>

                {/* Nilai dari DB (edit mode) */}
                {isCreate ? (
                  <>
                    <span className="text-gray-400">DB</span>
                    <span className="text-gray-400 italic col-span-2">— (belum ada)</span>
                  </>
                ) : (
                  <>
                    <span className="text-green-700">DB</span>
                    <span className={
                      dbGridRow === "loading" ? "text-gray-400 italic" :
                      dbGridRow == null ? "text-red-400 italic" :
                      dbGridRow !== jsonGridRow ? "text-red-600 font-bold" : "text-green-700"
                    }>
                      {dbGridRow === "loading" ? "memuat…" : (dbGridRow ?? "null")}
                    </span>
                    <span className={
                      dbGridCol === "loading" ? "text-gray-400 italic" :
                      dbGridCol == null ? "text-red-400 italic" :
                      dbGridCol !== jsonGridCol ? "text-red-600 font-bold" : "text-green-700"
                    }>
                      {dbGridCol === "loading" ? "memuat…" : (dbGridCol ?? "null")}
                    </span>
                  </>
                )}

                {/* Nilai aktif yang akan disimpan */}
                <span className="text-blue-600 font-bold">akan disimpan</span>
                <span className="text-blue-700 font-bold">{gridRow ?? "null"}</span>
                <span className="text-blue-700 font-bold">{gridCol ?? "null"}</span>
              </div>

              {/* Input override manual */}
              <div className="flex gap-2 mt-2 items-center">
                <span className="text-gray-500 shrink-0">Override:</span>
                <input
                  type="number"
                  value={gridRow ?? ""}
                  onChange={(e) => setGridRow(e.target.value === "" ? null : Number(e.target.value))}
                  placeholder="row"
                  className="w-16 px-1.5 py-0.5 rounded border border-amber-300 bg-white text-center"
                />
                <input
                  type="number"
                  value={gridCol ?? ""}
                  onChange={(e) => setGridCol(e.target.value === "" ? null : Number(e.target.value))}
                  placeholder="col"
                  className="w-16 px-1.5 py-0.5 rounded border border-amber-300 bg-white text-center"
                />
                {!isCreate && (
                  <button
                    type="button"
                    onClick={() => { setGridRow(dbGridRow === "loading" ? null : dbGridRow); setGridCol(dbGridCol === "loading" ? null : dbGridCol); }}
                    className="text-green-700 hover:underline"
                  >
                    ↺ DB
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { setGridRow(jsonGridRow); setGridCol(jsonGridCol); }}
                  className="text-purple-600 hover:underline"
                >
                  ↺ store
                </button>
                {wallDestR != null && (
                  <button
                    type="button"
                    onClick={() => { setGridRow(wallDestR); setGridCol(wallDestC); }}
                    className="text-orange-600 hover:underline font-semibold"
                  >
                    ↺ Wall
                  </button>
                )}
              </div>
            </div>
            {/* ── END DEBUG ─────────────────────────────────────────────── */}

            {isCreate && (
              <p className="text-xs text-gray-500 mt-1">
                {facility.floor.terminal} {facility.floor.label}
              </p>
            )}
          </div>

          <div className="flex gap-5">

            {/* ── Kiri: foto ── */}
            <div className="flex flex-col items-center gap-3 shrink-0 w-36">
              <div className="w-full aspect-square rounded-xl bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-gray-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10"
                      fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                    </svg>
                    <span className="text-[10px] text-center px-1 text-gray-400">
                      Belum ada foto
                    </span>
                  </div>
                )}
              </div>

              <label className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-700 text-white text-xs rounded-lg hover:bg-gray-600 transition cursor-pointer">
                <span>↑</span>
                <span>Upload Photo</span>
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </label>

              {photo && (
                <button onClick={() => setPhoto(null)}
                  className="w-full text-xs text-red-400 hover:text-red-600 transition">
                  Hapus foto
                </button>
              )}
            </div>

            {/* ── Kanan: form ── */}
            <div className="flex-1 flex flex-col gap-3">

              {/* Nama */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">
                  Nama lokasi <span className="text-red-500">*</span>
                </label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Musholla Terminal 1"
                  className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition" />
              </div>

              {/* Kode */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">
                  Kode tempat <span className="text-red-500">*</span>
                </label>
                <input type="text" value={code} onChange={(e) => setCode(e.target.value)}
                  placeholder="Contoh: T4-T1L2"
                  className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition" />
              </div>

              {/* Lantai — hanya create mode */}
              {isCreate && (
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">
                    Lantai <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={floorId}
                    onChange={(e) => setFloorId(Number(e.target.value))}
                    className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                  >
                    <option value={0} disabled>Pilih lantai</option>
                    {floors.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label} (ID: {f.id})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Jam Operasional — disabled di create mode */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">
                  Jam Operasional
                </label>
                {isCreate ? (
                  <p className="text-xs text-gray-400 italic px-1">
                    Simpan fasilitas terlebih dahulu untuk mengatur jam operasional.
                  </p>
                ) : (
                  <button type="button" onClick={() => setShowHoursModal(true)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm text-left text-gray-600 hover:border-blue-400 transition flex items-center justify-between">
                    <span>{renderHoursSummary()}</span>
                    <span className="text-gray-400">✎</span>
                  </button>
                )}
              </div>

              {/* Deskripsi */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">
                  Deskripsi Fasilitas
                </label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tuliskan detail fasilitas di sini.." rows={3}
                  className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 transition" />
              </div>

              {/* Kategori */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">
                  Kategori Tempat <span className="text-red-500">*</span>
                </label>
                <select value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))}
                  className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition">
                  <option value={0} disabled>Pilih kategori</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <div className="flex justify-end gap-3 mt-1">
            <button onClick={handleClose} disabled={loading}
              className="px-5 py-2 rounded-xl border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-100 transition disabled:opacity-50">
              Cancel
            </button>
            <button onClick={handleSave} disabled={loading}
              className="px-5 py-2 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition disabled:opacity-60">
              {loading ? "Menyimpan..." : isCreate ? "Tambah" : "Save"}
            </button>
          </div>
        </div>
      </div>

      {/* Hours modal — hanya edit mode */}
      {!isCreate && showHoursModal && (
        <OperationalHoursModal
          facilityId={facility.id}
          initialHours={hours}
          onClose={() => setShowHoursModal(false)}
          onSaved={(updated) => {
            setHours(updated);
            setShowHoursModal(false);
          }}
        />
      )}
    </>
  );
}