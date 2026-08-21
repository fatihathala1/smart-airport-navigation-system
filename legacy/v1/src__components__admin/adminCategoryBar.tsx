"use client";

import { useEffect, useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMapStore } from "@/store/mapStore";
import type { Category } from "@/types";
import EditCategoryModal from "@/components/admin/category/editCategoryModal";
import DeleteConfirm from "@/components/admin/category/deleteConfirm";

// =============================================================================
// HELPER — render icon sesuai tipe konten
// =============================================================================

function CategoryIcon({ icon, name }: { icon: string | null; name: string }) {
  if (!icon) {
    return (
      <span className="text-white text-xs font-bold text-center leading-tight px-1">
        {name.slice(0, 3).toUpperCase()}
      </span>
    );
  }
  if (icon.trimStart().startsWith("<svg")) {
    return (
      <div
        className="w-7 h-7 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:fill-white"
        dangerouslySetInnerHTML={{ __html: icon }}
      />
    );
  }
  if (icon.startsWith("data:") || icon.startsWith("http") || icon.startsWith("/")) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={icon} alt={name} className="w-7 h-7 object-contain" />;
  }
  return <span className="text-2xl leading-none">{icon}</span>;
}

// =============================================================================
// SORTABLE CATEGORY ITEM
// =============================================================================

function SortableCategoryItem({
  cat,
  isAdmin,
  isDragging,
  onEdit,
  onDelete,
}: {
  cat: Category;
  isAdmin: boolean;
  isDragging: boolean;
  onEdit: (cat: Category) => void;
  onDelete: (cat: Category) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSelfDragging,
  } = useSortable({ id: cat.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSelfDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative flex flex-col items-center gap-1"
    >
      {/* Admin badges — sembunyikan saat drag aktif */}
      {isAdmin && !isDragging && (
        <>
          <button
            onClick={() => onDelete(cat)}
            className="absolute -top-1 -left-1 z-10 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center shadow hover:bg-red-600 transition"
            title="Hapus kategori"
          >
            ×
          </button>
          <button
            onClick={() => onEdit(cat)}
            className="absolute -top-1 -right-1 z-10 w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center shadow hover:bg-blue-600 transition"
            title="Edit kategori"
          >
            ✎
          </button>
        </>
      )}

      {/* Icon — drag handle hanya di mode admin */}
      <div
        {...(isAdmin ? { ...attributes, ...listeners } : {})}
        className={[
          "w-12 h-12 rounded-2xl flex items-center justify-center",
          "shadow-[0_2px_6px_rgba(0,0,0,0.14)]",
          "hover:scale-105 transition-transform duration-150",
          isAdmin ? "cursor-grab active:cursor-grabbing" : "",
        ].join(" ")}
        style={{ backgroundColor: cat.color }}
      >
        <CategoryIcon icon={cat.icon} name={cat.name} />
      </div>

      <span className="text-[10px] text-gray-500 font-medium leading-tight text-center w-12 line-clamp-1">
        {cat.name}
      </span>
    </div>
  );
}

// =============================================================================
// DRAG OVERLAY GHOST
// =============================================================================

function DragGhostItem({ cat }: { cat: Category }) {
  return (
    <div className="flex flex-col items-center gap-1 opacity-90 scale-110 rotate-2">
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
        style={{ backgroundColor: cat.color }}
      >
        <CategoryIcon icon={cat.icon} name={cat.name} />
      </div>
      <span className="text-[10px] text-gray-500 font-medium leading-tight text-center w-12 line-clamp-1">
        {cat.name}
      </span>
    </div>
  );
}

// =============================================================================
// KOMPONEN UTAMA
// =============================================================================

export default function AdminCategoryBar() {
  const mapMode         = useMapStore((s) => s.mapMode);
  const setIsSearchOpen = useMapStore((s) => s.setIsSearchOpen);
  const activeTerminal  = useMapStore((s) => s.activeTerminal);
  const isAdmin         = mapMode === "admin";

  const [categories,   setCategories]   = useState<Category[]>([]);
  const [editTarget,   setEditTarget]   = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [activeId,     setActiveId]     = useState<number | null>(null);
  const [isSaving,     setIsSaving]     = useState(false);

  // ── FIX: state untuk modal Add Kategori (dipindah dari page.tsx) ──────────
  const [showAdd, setShowAdd] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  useEffect(() => {
    async function load() {
      const res  = await fetch("/api/categories");
      const json = await res.json();
      if (json.success) {
        const sorted = [...json.data].sort(
          (a: Category, b: Category) => a.sortOrder - b.sortOrder
        );
        setCategories(sorted);
      }
    }
    load();
  }, []);

  const persistOrder = useCallback(async (ordered: Category[]) => {
    setIsSaving(true);
    try {
      await fetch("/api/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          ordered.map((c, i) => ({ id: c.id, sortOrder: i }))
        ),
      });
    } finally {
      setIsSaving(false);
    }
  }, []);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as number);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    setCategories((prev) => {
      const oldIndex = prev.findIndex((c) => c.id === active.id);
      const newIndex = prev.findIndex((c) => c.id === over.id);
      const next = arrayMove(prev, oldIndex, newIndex);
      persistOrder(next);
      return next;
    });
  }

  function handleSaved(updated: Category) {
    setCategories((prev) => {
      const exists = prev.find((c) => c.id === updated.id);
      if (exists) return prev.map((c) => (c.id === updated.id ? updated : c));
      // ── FIX: kategori baru langsung masuk state lokal tanpa remount ────────
      return [...prev, updated];
    });
  }

  function handleDeleted(id: number) {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }

  // ── FIX: di mode admin tampilkan SEMUA kategori tanpa filter terminal ──────
  // Ini mencegah kategori baru tersembunyi karena terminal tidak cocok
  const visibleCategories = isAdmin
    ? categories
    : categories.filter(
        (c) => c.terminals.length === 0 || c.terminals.includes(activeTerminal)
      );

  // Search selalu slot pertama, sisanya kategori
  const half             = Math.ceil((visibleCategories.length + 1) / 2);
  const rowOneCategories = visibleCategories.slice(0, half - 1);
  const rowTwoCategories = visibleCategories.slice(half - 1);

  const activeCat = activeId ? categories.find((c) => c.id === activeId) : null;

  const renderSearchButton = () => (
    <button
      key="search"
      onClick={() => setIsSearchOpen(true)}
      aria-label="Buka pencarian fasilitas"
      className="flex flex-col items-center gap-1 transition-all duration-150 active:scale-95"
    >
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-orange-500 shadow-[0_3px_8px_rgba(249,115,22,0.40)] hover:scale-105 transition-transform duration-150">
        <svg
          className="w-6 h-6 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
          />
        </svg>
      </div>
      <span className="text-[10px] text-gray-500 font-medium leading-tight text-center">
        Search
      </span>
    </button>
  );

  // ── FIX: tombol Add Kategori dipindah ke sini ─────────────────────────────
  const renderAddButton = () => (
    <button
      onClick={() => setShowAdd(true)}
      aria-label="Tambah kategori baru"
      className="flex flex-col items-center gap-1 transition-all duration-150 active:scale-95"
    >
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gray-800 shadow-[0_2px_6px_rgba(0,0,0,0.20)] hover:scale-105 hover:bg-gray-700 transition-all duration-150">
        <svg
          className="w-6 h-6 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </div>
      <span className="text-[10px] text-gray-500 font-medium leading-tight text-center">
        Tambah
      </span>
    </button>
  );

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col items-center gap-2 px-4 py-2">
          {isSaving && (
            <span className="text-[9px] text-gray-400 animate-pulse">
              Menyimpan urutan...
            </span>
          )}

          {/* Baris 1 */}
          <SortableContext
            items={rowOneCategories.map((c) => c.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex gap-3 justify-center">
              {renderSearchButton()}
              {rowOneCategories.map((cat) => (
                <SortableCategoryItem
                  key={cat.id}
                  cat={cat}
                  isAdmin={isAdmin}
                  isDragging={activeId !== null}
                  onEdit={setEditTarget}
                  onDelete={setDeleteTarget}
                />
              ))}
              {/* ── FIX: tombol Add muncul di baris 1 setelah semua kategori baris 1 ── */}
              {isAdmin && rowTwoCategories.length === 0 && renderAddButton()}
            </div>
          </SortableContext>

          {/* Baris 2 */}
          {(rowTwoCategories.length > 0) && (
            <SortableContext
              items={rowTwoCategories.map((c) => c.id)}
              strategy={horizontalListSortingStrategy}
            >
              <div className="flex gap-3 justify-center">
                {rowTwoCategories.map((cat) => (
                  <SortableCategoryItem
                    key={cat.id}
                    cat={cat}
                    isAdmin={isAdmin}
                    isDragging={activeId !== null}
                    onEdit={setEditTarget}
                    onDelete={setDeleteTarget}
                  />
                ))}
                {/* ── FIX: tombol Add di baris 2 kalau ada baris 2 ── */}
                {isAdmin && renderAddButton()}
              </div>
            </SortableContext>
          )}
        </div>

        <DragOverlay dropAnimation={{ duration: 200, easing: "ease" }}>
          {activeCat ? <DragGhostItem cat={activeCat} /> : null}
        </DragOverlay>
      </DndContext>

      {/* Modal Edit kategori */}
      {editTarget && (
        <EditCategoryModal
          initialData={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Modal Delete kategori */}
      {deleteTarget && (
        <DeleteConfirm
          category={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={handleDeleted}
        />
      )}

      {/* ── FIX: Modal Add kategori — onSaved langsung pakai handleSaved lokal ── */}
      {showAdd && (
        <EditCategoryModal
          initialData={null}
          onClose={() => setShowAdd(false)}
          onSaved={(newCat) => {
            handleSaved(newCat);
            setShowAdd(false);
          }}
        />
      )}
    </>
  );
}