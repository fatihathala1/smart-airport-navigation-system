"use client";

import { useState } from "react";
import type { Category } from "@/types";

interface Props {
  category: Category;
  onClose: () => void;
  onDeleted: (id: number) => void;
}

export default function DeleteConfirm({ category, onClose, onDeleted }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function handleDelete() {
    setError(null);
    setLoading(true);

    try {
      const res  = await fetch(`/api/categories/${category.id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (!json.success) {
        // API return 409 kalau kategori masih dipakai fasilitas
        setError(json.error ?? "Gagal menghapus kategori.");
        return;
      }

      onDeleted(category.id);
      onClose();
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-8 flex flex-col items-center gap-5">

        {/* Icon warning */}
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
          <span className="text-red-500 text-2xl">🗑</span>
        </div>

        {/* Pesan */}
        <div className="text-center">
          <p className="text-base font-semibold text-gray-800">
            Hapus kategori ini?
          </p>
          <p className="text-sm text-gray-500 mt-1">
            <span className="font-medium text-gray-700">{category.name}</span> akan
            dihapus permanen dan tidak bisa dikembalikan.
          </p>
        </div>

        {/* Error — muncul kalau kategori masih dipakai */}
        {error && (
          <p className="text-sm text-red-500 text-center bg-red-50 rounded-xl px-4 py-2 w-full">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition disabled:opacity-60"
          >
            {loading ? "Menghapus..." : "Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
}