"use client";

import { useState, useEffect } from "react";
import { HexColorPicker } from "react-colorful";
import type { Category } from "@/types";
import { useMapStore } from "@/store/mapStore";

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

async function svgToBase64(file: File): Promise<string> {
  // SVG dibaca sebagai text, lalu di-encode ke base64 data URL
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const svgText   = reader.result as string;
      const b64       = btoa(unescape(encodeURIComponent(svgText)));
      resolve(`data:image/svg+xml;base64,${b64}`);
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

// Deteksi tipe icon untuk preview
function renderIconPreview(icon: string, name: string, color: string) {
  if (!icon) {
    return (
      <span className="text-white text-sm font-bold text-center px-1">
        {name ? name.slice(0, 3).toUpperCase() : "?"}
      </span>
    );
  }

  // SVG inline string
  if (icon.trimStart().startsWith("<svg")) {
    return (
      <div
        className="w-14 h-14 flex items-center justify-center"
        style={{ color: "white" }}
        dangerouslySetInnerHTML={{ __html: icon }}
      />
    );
  }

  // base64 atau URL
  if (icon.startsWith("data:") || icon.startsWith("http")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={icon} alt="preview" className="w-14 h-14 object-contain" />
    );
  }

  // Fallback teks
  return (
    <span className="text-white text-sm font-bold text-center px-1">
      {name ? name.slice(0, 3).toUpperCase() : "?"}
    </span>
  );
}

// =============================================================================
// PROPS
// =============================================================================

interface Props {
  initialData?: Category | null;
  onClose: () => void;
  onSaved: (category: Category) => void;
}

// =============================================================================
// KOMPONEN UTAMA
// =============================================================================

export default function EditCategoryModal({ initialData, onClose, onSaved }: Props) {
  const isEdit = !!initialData;

  const [name,  setName]  = useState(initialData?.name  ?? "");
  const [icon,  setIcon]  = useState(initialData?.icon  ?? "");
  const [color, setColor] = useState(initialData?.color ?? "#3B82F6");
  const incrementFacilitiesVersion = useMapStore((s) => s.incrementFacilitiesVersion);

  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [uploading,  setUploading]  = useState(false);
  const [terminals,  setTerminals]  = useState<string[]>(
    initialData?.terminals ?? []
  );

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setIcon(initialData.icon ?? "");
      setColor(initialData.color);
      setTerminals(initialData.terminals ?? []);
    }
  }, [initialData]);

  // ── Upload file icon/foto ──────────────────────────────────────────────────
  async function handleIconUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Max 1MB untuk icon
    if (file.size > 1 * 1024 * 1024) {
      setError("Ukuran file maksimal 1MB.");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      let result: string;

      if (file.type === "image/svg+xml") {
        result = await svgToBase64(file);
      } else {
        result = await toBase64(file);
      }

      setIcon(result);
    } catch {
      setError("Gagal membaca file. Coba lagi.");
    } finally {
      setUploading(false);
    }
  }

    function toggleTerminal(id: string) {
      setTerminals((prev) =>
        prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
      );
    }

  // ── Save ───────────────────────────────────────────────────────────────────
  async function handleSave() {
    setError(null);

    if (!name.trim()) {
      setError("Nama kategori wajib diisi.");
      return;
    }
    if (!color.trim()) {
      setError("Warna wajib dipilih.");
      return;
    }

    setLoading(true);

    try {
      const url    = isEdit ? `/api/categories/${initialData!.id}` : "/api/categories";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:     name.trim(),
          icon:     icon.trim() || null,
          color:    color.trim(),
          terminals,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        setError(json.error ?? "Terjadi kesalahan.");
        return;
      }

      onSaved(json.data);
      incrementFacilitiesVersion();
      onClose();
    } catch {
      setError("Gagal menyimpan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="relative bg-[#dce8f5] rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex flex-col items-center text-gray-500 hover:text-gray-800 transition"
        >
          <span className="text-2xl leading-none">✕</span>
          <span className="text-[10px] mt-0.5">Close</span>
        </button>

        {/* Title */}
        <h2 className="text-xl font-bold text-gray-800 mb-4 border-b border-gray-300 pb-3">
          {isEdit ? "Edit Kategori" : "Tambah Kategori"}
        </h2>

        <div className="flex gap-6">

          {/* ── Kiri: preview + upload ── */}
          <div className="flex flex-col items-center gap-3 shrink-0">

            {/* Preview icon */}
            <div
              className="w-24 h-24 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-400 overflow-hidden"
              style={{ backgroundColor: color }}
            >
              {renderIconPreview(icon, name, color)}
            </div>

            {/* Upload button */}
            <label className={[
              "flex items-center gap-1.5 px-3 py-1.5 text-white text-xs rounded-lg transition cursor-pointer",
              uploading ? "bg-gray-400 cursor-not-allowed" : "bg-gray-700 hover:bg-gray-600",
            ].join(" ")}>
              <span>↑</span>
              <span>{uploading ? "Memuat..." : "Upload photo/icon"}</span>
              <input
                type="file"
                accept="image/*,.svg"
                className="hidden"
                disabled={uploading}
                onChange={handleIconUpload}
              />
            </label>

            {/* Hapus icon */}
            {icon && (
              <button
                onClick={() => setIcon("")}
                className="text-xs text-red-400 hover:text-red-600 transition"
              >
                Hapus icon
              </button>
            )}

            {/* Info format */}
            <p className="text-[10px] text-gray-400 text-center leading-tight">
              SVG, PNG, JPG<br />Maks. 1MB
            </p>
          </div>

          {/* ── Kanan: form fields ── */}
          <div className="flex-1 flex flex-col gap-4">

            {/* Nama kategori */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Nama kategori <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Transit Inter"
                className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              />
            </div>

            {/* Terminal */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                Tersedia di Terminal
              </label>
              <div className="flex gap-2">
                {(["T1", "T2"] as const).map((t) => {
                  const active = terminals.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTerminal(t)}
                      className={`flex-1 py-2 rounded-xl border-2 text-sm font-semibold transition-colors ${
                        active
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 bg-white text-gray-400 hover:border-gray-300"
                      }`}
                    >
                      Terminal {t.slice(1)}
                    </button>
                  );
                })}
              </div>
              {terminals.length === 0 && (
                <p className="text-[10px] text-amber-600 bg-amber-50 rounded-lg px-2 py-1">
                  Kosong = muncul di semua terminal
                </p>
              )}
            </div>

            {/* Color picker */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">
                Warna <span className="text-red-500">*</span>
              </label>
              <div className="bg-white rounded-xl p-3 shadow-sm flex flex-col gap-2">
                <HexColorPicker
                  color={color}
                  onChange={setColor}
                  style={{ width: "100%", height: "120px" }}
                />
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">Color code:</span>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) setColor(val);
                    }}
                    className="flex-1 px-2 py-1 text-xs rounded border border-gray-200 font-mono focus:outline-none focus:ring-1 focus:ring-blue-400"
                    maxLength={7}
                  />
                  <div
                    className="w-6 h-6 rounded border border-gray-200 shrink-0"
                    style={{ backgroundColor: color }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="mt-3 text-sm text-red-500 text-center">{error}</p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-5">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2 rounded-xl border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-100 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || uploading}
            className="px-5 py-2 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition disabled:opacity-60"
          >
            {loading ? "Menyimpan..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}