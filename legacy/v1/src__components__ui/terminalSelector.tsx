"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMapStore } from "@/store/mapStore";
import type { TerminalId } from "@/types";

const TERMINALS: { value: TerminalId; label: string; sub: string }[] = [
  { value: "T1", label: "Terminal 1", sub: "Domestik & Internasional" },
  { value: "T2", label: "Terminal 2", sub: "Internasional" },
];

export default function TerminalSelector() {
  const activeTerminal    = useMapStore((s) => s.activeTerminal);
  const setActiveTerminal = useMapStore((s) => s.setActiveTerminal);

  const [open, setOpen] = useState(false);
  const containerRef    = useRef<HTMLDivElement>(null);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Tutup dropdown saat Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const handleSelect = useCallback(
    (value: TerminalId) => {
      setActiveTerminal(value);
      setOpen(false);
    },
    [setActiveTerminal],
  );

  const active = TERMINALS.find((t) => t.value === activeTerminal)!;

  return (
    <div ref={containerRef} className="relative flex items-center gap-2.5">
      {/* Label */}
      <span className="text-[13px] font-medium text-gray-400 select-none" aria-hidden="true">
        Terminal
      </span>

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Pilih terminal, saat ini ${active.label}`}
        className={[
          "relative flex items-center gap-2.5 h-10 pl-4 pr-3.5 min-w-37",
          "rounded-xl border bg-white",
          "text-[14px] font-semibold text-gray-800",
          "shadow-[0_1px_3px_rgba(0,0,0,0.08)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-1",
          "transition-[border-color,box-shadow] duration-150",
          open
            ? "border-sky-400 shadow-[0_0_0_3px_rgba(56,189,248,0.15)]"
            : "border-gray-200 hover:border-gray-300 hover:shadow-[0_2px_6px_rgba(0,0,0,0.10)]",
        ].join(" ")}
      >
        {/* Badge terminal aktif */}
        <span
          className="flex items-center justify-center w-5 h-5 rounded-md bg-sky-500 text-white text-[10px] font-bold leading-none shrink-0"
          aria-hidden="true"
        >
          {active.value}
        </span>

        <span className="flex-1 text-left">{active.label}</span>

        {/* Chevron */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
          className={[
            "shrink-0 text-gray-400 transition-transform duration-200",
            open ? "rotate-180" : "",
          ].join(" ")}
        >
          <path
            d="M2 4.5L6 8L10 4.5"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <ul
          role="listbox"
          aria-label="Pilih terminal"
          className={[
            "absolute top-[calc(100%+6px)] left-12.5 z-50",
            "min-w-50",
            "bg-white rounded-xl border border-gray-200",
            "shadow-[0_8px_24px_rgba(0,0,0,0.12),0_2px_6px_rgba(0,0,0,0.06)]",
            "overflow-hidden",
            "animate-in fade-in zoom-in-95 duration-100",
          ].join(" ")}
        >
          {TERMINALS.map((t) => {
            const isActive = t.value === activeTerminal;
            return (
              <li
                key={t.value}
                role="option"
                aria-selected={isActive}
              >
                <button
                  type="button"
                  onClick={() => handleSelect(t.value)}
                  className={[
                    "w-full flex items-center gap-3 px-4 py-3",
                    "text-left transition-colors duration-100",
                    isActive
                      ? "bg-sky-50"
                      : "hover:bg-gray-50",
                  ].join(" ")}
                >
                  {/* Badge */}
                  <span
                    className={[
                      "flex items-center justify-center w-7 h-7 rounded-lg text-[11px] font-bold leading-none shrink-0",
                      isActive
                        ? "bg-sky-500 text-white"
                        : "bg-gray-100 text-gray-500",
                    ].join(" ")}
                    aria-hidden="true"
                  >
                    {t.value}
                  </span>

                  {/* Text */}
                  <div className="flex flex-col min-w-0">
                    <span className={[
                      "text-[13px] font-semibold leading-tight",
                      isActive ? "text-sky-600" : "text-gray-800",
                    ].join(" ")}>
                      {t.label}
                    </span>
                    <span className="text-[11px] text-gray-400 leading-tight mt-0.5 truncate">
                      {t.sub}
                    </span>
                  </div>

                  {/* Checkmark */}
                  {isActive && (
                    <svg
                      className="ml-auto shrink-0 text-sky-500"
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M2.5 7L5.5 10L11.5 4"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}