"use client";

import {
  useEffect, useRef, useMemo, useCallback, useState, useId, memo,
} from "react";
import type { ReactNode } from "react";
import DOMPurify from "isomorphic-dompurify";
import { useMapStore } from "@/store/mapStore";
import { buildWallSet } from "@/lib/astar";
import type { FacilityWithRelations, DestinationPoint, WallDataJson } from "@/types";
import PathRenderer from "@/components/map/pathRenderer";
import { resolveNavigationAnchor } from "@/utils/roomAnchor";
import GridWallLayer from "@/components/map/gridWallLayer";

import {
  T1_WALL_DATA, DESTINATIONS as T1_DESTINATIONS,
  ROWS as T1_ROWS, COLS as T1_COLS,
  START_R as T1_START_R, START_C as T1_START_C,
  FLOOR1_ROW_MIN as T1_F1_MIN,
  FLOOR2_ROW_MIN as T1_F2_MIN, FLOOR2_ROW_MAX as T1_F2_MAX,
} from "@/data/walls/t1";

import {
  T2_WALL_DATA, DESTINATIONS as T2_DESTINATIONS,
  ROWS as T2_ROWS, COLS as T2_COLS,
  START_R as T2_START_R, START_C as T2_START_C,
  FLOOR1_ROW_MIN as T2_F1_MIN,
  FLOOR2_ROW_MIN as T2_F2_MIN, FLOOR2_ROW_MAX as T2_F2_MAX,
} from "@/data/walls/t2";

// =============================================================================
// CONSTANTS
// =============================================================================

const CELL           = 6;
const C_KIOSK        = "#00b4d8" as const;
const TOUCH_R        = 10;
const MIN_HIT        = 18;
const MIN_SCALE      = 0.5;
const MAX_SCALE      = 4;
const LOADING_DELAY_MS = 300;
const FETCH_TIMEOUT_MS = 10_000;




// =============================================================================
// CALIBRATION
// =============================================================================

const BG_CALIBRATION = {
  T1: { x: -7,  y: 0, widthScale: 1.0, heightScale: 1.0 },
  T2: { x: -3,  y:  -7, widthScale: 1.0, heightScale: 1.0 },
} as const;

const T1_ROOM_CALIBRATION = {
  floor2: { offsetX: 0, offsetY: 0, scaleX: 1, scaleY: 1 },
  floor1: { offsetX: -10, offsetY: 2, scaleX: 1, scaleY: 1 },
} as const;

const T2_ROOM_CALIBRATION = {
  floor2: { offsetX: 0, offsetY: 0, scaleX: 1, scaleY: 1 },
  floor1: { offsetX: 0, offsetY: 0, scaleX: 1, scaleY: 1 },
} as const;

// =============================================================================
// CATEGORY MAPPING
// =============================================================================

const PREFIX_TO_CATEGORY: Record<string, string> = {
  fnb: "Food & Beverages",
  gd:  "Gate",
  lo:  "Lounge",
  pr:  "Event & Promotion",
  tl:  "Toilet & Nursery",
  ret: "Retail",
  ll: "Services",
  kan: "Office",
  mus: "Musala",
  df:  "Retail",
  arr: "Arrival",
  nl:  "General Facilities",
  ld:  "General Facilities",
};

function getCategoryName(destId: string): string | null {
  const clean  = destId.replace(/^l[12]_/, "");
  const prefix = clean.match(/^([a-z]+)/)?.[1] ?? "";
  return PREFIX_TO_CATEGORY[prefix] ?? null;
}

// =============================================================================
// TYPES
// =============================================================================

type RoomBox = { r1: number; c1: number; r2: number; c2: number };
type DestinationWithRoom = DestinationPoint & { room?: RoomBox };

interface Category {
  id: number;
  name: string;
  color: string | null;
  icon: string | null;
}

function isApiResponse<T>(
  val: unknown,
  isData: (d: unknown) => d is T,
): val is { success: boolean; data: T } {
  return (
    typeof val === "object" &&
    val !== null &&
    "success" in val &&
    typeof (val as Record<string, unknown>).success === "boolean" &&
    "data" in val &&
    isData((val as Record<string, unknown>).data)
  );
}

function isFacilityArray(d: unknown): d is FacilityWithRelations[] {
  return Array.isArray(d);
}

function isCategoryArray(d: unknown): d is Category[] {
  return Array.isArray(d);
}

// =============================================================================
// TERMINAL CONFIG
// =============================================================================

interface TerminalConfig {
  rows: number; cols: number;
  wallData: WallDataJson;
  destinations: DestinationPoint[];
  startR: number; startC: number;
  f1Min: number; f2Min: number; f2Max: number;
  gapMin: number; gapMax: number;
  bgSvg: string;
  calibKey: "T1" | "T2";
  labelL2Y: number;
  labelL1Y: number;
}

const T1_CFG: TerminalConfig = {
  rows: T1_ROWS, cols: T1_COLS,
  wallData: T1_WALL_DATA, destinations: T1_DESTINATIONS,
  startR: T1_START_R, startC: T1_START_C,
  f1Min: T1_F1_MIN, f2Min: T1_F2_MIN, f2Max: T1_F2_MAX,
  gapMin: T1_F2_MAX + 1, gapMax: T1_F1_MIN - 1,
  bgSvg: "/map/t1_gabungan.svg",
  calibKey: "T1",
  labelL2Y: Math.round((T1_F2_MIN + T1_F2_MAX) / 2) * CELL + CELL / 2,
  labelL1Y: Math.round((T1_F1_MIN + T1_ROWS - 1) / 2) * CELL + CELL / 2,
};

const T2_CFG: TerminalConfig = {
  rows: T2_ROWS, cols: T2_COLS,
  wallData: T2_WALL_DATA, destinations: T2_DESTINATIONS,
  startR: T2_START_R, startC: T2_START_C,
  f1Min: T2_F1_MIN, f2Min: T2_F2_MIN, f2Max: T2_F2_MAX,
  gapMin: -1, gapMax: -1,
  bgSvg: "/map/t2_gabungan.svg",
  calibKey: "T2",
  labelL2Y: Math.round((T2_F2_MIN + T2_F2_MAX) / 2) * CELL + CELL / 2,
  labelL1Y: Math.round((T2_F1_MIN + T2_ROWS - 1) / 2) * CELL + CELL / 2,
};

// =============================================================================
// HELPERS
// =============================================================================

function nearestWalkable(
  r: number, c: number,
  rows: number, cols: number,
  wallSet: Set<string>,
  maxDist = 6,
): { r: number; c: number } {
  if (!wallSet.has(`${r},${c}`)) return { r, c };
  for (let d = 1; d <= maxDist; d++) {
    for (let dr = -d; dr <= d; dr++) {
      for (let dc = -d; dc <= d; dc++) {
        if (Math.abs(dr) !== d && Math.abs(dc) !== d) continue;
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
        if (!wallSet.has(`${nr},${nc}`)) return { r: nr, c: nc };
      }
    }
  }
  return { r, c };
}

function getRoomTransform(terminal: "T1" | "T2", dest: DestinationWithRoom) {
  const isFloor2 = dest.id.startsWith("l2_");
  if (terminal === "T1") {
    return isFloor2 ? T1_ROOM_CALIBRATION.floor2 : T1_ROOM_CALIBRATION.floor1;
  }
  return isFloor2 ? T2_ROOM_CALIBRATION.floor2 : T2_ROOM_CALIBRATION.floor1;
}

// Perkiraan tinggi total bubble preview (card + tail + gap), dipakai sebagai
// ambang batas saat memutuskan apakah bubble masih cukup ruang ditaruh di
// ATAS pin, atau harus di-flip ke BAWAH supaya tidak terpotong oleh
// overflow-hidden saat pin berada dekat tepi atas canvas.
const BUBBLE_EST_HEIGHT = 100;
const BUBBLE_EDGE_SAFE  = 8;

/**
 * Hitung posisi layar (dalam px, relatif ke kotak outer) dari sebuah titik
 * SVG, lalu putuskan apakah bubble preview harus ditaruh di atas atau di
 * bawah pin. Dipanggil sekali saat user tap pin (bukan terus-menerus saat
 * pan), jadi cukup pakai getBoundingClientRect + snapshot pan/zoom state
 * tanpa berdampak ke performa drag.
 *
 * Rumus mengikuti transform CSS `translate(x,y) scale(s)` dengan
 * transform-origin "center center": P' = O + s*(P-O) + (x,y)
 */
function getBubblePlacement(
  outerEl: HTMLDivElement | null,
  pan: { x: number; y: number; scale: number },
  svgX: number, svgY: number,
  viewW: number, viewH: number,
): "above" | "below" {
  if (!outerEl) return "above";
  const { width: W, height: H } = outerEl.getBoundingClientRect();
  if (W === 0 || H === 0) return "above";

  const py = (svgY / viewH) * H;
  const pinScreenY = H / 2 + pan.scale * (py - H / 2) + pan.y;

  return pinScreenY - BUBBLE_EST_HEIGHT < BUBBLE_EDGE_SAFE ? "below" : "above";
}

const makeSyntheticIdGenerator = () => {
  let counter = -1;
  return () => counter--;
};
const nextSyntheticId = makeSyntheticIdGenerator();

function makeSyntheticFacility(
  dest: DestinationWithRoom,
  walkableR: number,
  walkableC: number,
  floorId: number,
  categoryId: number,
  categoryName: string,
  terminal: string,
): FacilityWithRelations {
  return {
    id: nextSyntheticId(),
    name: dest.label,
    code: dest.id,
    destId: dest.id,
    description: null,
    categoryId,
    floorId,
    nodeId: null,
    isActive: true,
    gridRow: walkableR,
    gridCol: walkableC,
    photo: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: {
      id: categoryId,
      name: categoryName,
      icon: null,
      color: dest.color,
      terminals: [],
      sortOrder: 0,
      createdAt: new Date(),
    },
    floor: {
      id: floorId,
      terminal,
      floorNumber: dest.id.startsWith("l2_") ? 2 : 1,
      label: dest.id.startsWith("l2_") ? "Lantai 2" : "Lantai 1",
      gridRows: null, gridCols: null,
      startRow: null, startCol: null,
      wallData: null,
    },
    node: null,
    operationalHours: [],
  } as FacilityWithRelations;
}

function makeAddFacilityTemplate(
  dest: DestinationWithRoom,
  walkableR: number,
  walkableC: number,
  terminal: string,
): FacilityWithRelations {
  const isL2 = dest.id.startsWith("l2_");
  return {
    id: 0,
    name: dest.label,
    code: dest.id,
    destId: dest.id,
    description: null,
    categoryId: 0,
    floorId: 0,
    isActive: true,
    gridRow: walkableR,
    gridCol: walkableC,
    photo: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: {
      id: 0, name: "", icon: null,
      color: "#3B82F6", terminals: [], sortOrder: 0, createdAt: new Date(),
    },
    floor: {
      id: 0,
      terminal,
      floorNumber: isL2 ? 2 : 1,
      label: isL2 ? "Lantai 2" : "Lantai 1",
      gridRows: null, gridCols: null,
      startRow: null, startCol: null,
      wallData: null,
    },
    operationalHours: [],
  };
}

// =============================================================================
// HOOK — useMapData
// =============================================================================

type FetchStatus = "idle" | "loading" | "success" | "error";

interface UseMapDataResult {
  facilities: FacilityWithRelations[];
  categories: Category[];
  status: FetchStatus;
  errorMessage: string | null;
}

function useMapData(
  activeTerminal: string,
  facilitiesVersion: number,
): UseMapDataResult {
  const [facilities,    setFacilities]    = useState<FacilityWithRelations[]>([]);
  const [categories,    setCategories]    = useState<Category[]>([]);
  const [status,        setStatus]        = useState<FetchStatus>("idle");
  const [errorMessage,  setErrorMessage]  = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    let loadingTimer: ReturnType<typeof setTimeout> | null = setTimeout(() => {
      if (!cancelled) setStatus("loading");
    }, LOADING_DELAY_MS);

    const controller  = new AbortController();
    const timeoutTimer = setTimeout(
      () => controller.abort(new DOMException("Fetch timeout", "TimeoutError")),
      FETCH_TIMEOUT_MS,
    );

    async function load() {
      try {
        const [facRes, catRes] = await Promise.all([
          fetch(`/api/facilities?terminal=${activeTerminal}`, { signal: controller.signal }),
          fetch("/api/categories",                            { signal: controller.signal }),
        ]);

        if (!facRes.ok || !catRes.ok) {
          throw new Error(
            `Respons server tidak OK: facilities=${facRes.status}, categories=${catRes.status}`,
          );
        }

        const [facBody, catBody] = await Promise.all([
          facRes.json() as Promise<unknown>,
          catRes.json() as Promise<unknown>,
        ]);

        if (cancelled) return;

        const facOk = isApiResponse(facBody, isFacilityArray) && facBody.success;
        const catOk = isApiResponse(catBody, isCategoryArray) && catBody.success;

        // Kegagalan logis (HTTP 200 tapi success:false / bentuk respons tak sesuai)
        // tidak boleh diam-diam dianggap berhasil — pengguna harus tahu data gagal dimuat.
        if (!facOk || !catOk) {
          throw new Error(
            `Respons API tidak valid: facilities.success=${facOk}, categories.success=${catOk}`,
          );
        }

        setFacilities(facBody.data);
        setCategories(catBody.data);
        setStatus("success");
        setErrorMessage(null);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof DOMException && err.name === "AbortError") return;

        // Keamanan: jangan tampilkan detail error mentah (bisa berisi info backend)
        // ke pengguna kiosk publik. Detail lengkap hanya dicatat ke console.
        console.error("[MapCanvas] Fetch error:", err);
        setErrorMessage("Gagal memuat data peta. Periksa koneksi internet Anda atau coba lagi.");
        setStatus("error");
      } finally {
        clearTimeout(timeoutTimer);
        if (loadingTimer !== null) { clearTimeout(loadingTimer); loadingTimer = null; }
        if (!cancelled) setStatus((prev) => (prev === "loading" ? "success" : prev));
      }
    }

    void load();
    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timeoutTimer);
      if (loadingTimer !== null) clearTimeout(loadingTimer);
    };
  }, [activeTerminal, facilitiesVersion]);

  return { facilities, categories, status, errorMessage };
}

// =============================================================================
// HOOK — usePanZoom
// =============================================================================

interface PanZoomState { x: number; y: number; scale: number; }

interface UsePanZoomResult {
  innerRef: React.RefObject<HTMLDivElement | null>;
  getState: () => PanZoomState;
  resetView: () => void;
  handlers: {
    onMouseDown:  (e: React.MouseEvent) => void;
    onMouseMove:  (e: React.MouseEvent) => void;
    onMouseUp:    () => void;
    onWheel:      (e: React.WheelEvent) => void;
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove:  (e: React.TouchEvent) => void;
    onTouchEnd:   () => void;
  };
  isDragging: React.RefObject<boolean>;
  didDrag:    React.RefObject<boolean>;
}

function usePanZoom(onResetDependency: string): UsePanZoomResult {
  const innerRef   = useRef<HTMLDivElement>(null);
  const stateRef   = useRef<PanZoomState>({ x: 0, y: 0, scale: 1 });
  const isDragging = useRef(false);
  const didDrag    = useRef(false);
  const lastPos    = useRef({ x: 0, y: 0 });
  const pinchDist  = useRef<number | null>(null);
  const lastTap    = useRef(0);
  const rafId      = useRef<number | null>(null);

  const applyTransform = useCallback((s: PanZoomState) => {
    if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      if (innerRef.current)
        innerRef.current.style.transform = `translate(${s.x}px, ${s.y}px) scale(${s.scale})`;
      rafId.current = null;
    });
  }, []);

  const resetView = useCallback(() => {
    stateRef.current = { x: 0, y: 0, scale: 1 };
    applyTransform(stateRef.current);
  }, [applyTransform]);

  useEffect(() => { resetView(); }, [onResetDependency, resetView]);

  const clampScale = (s: number) => Math.min(Math.max(s, MIN_SCALE), MAX_SCALE);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    didDrag.current    = false;
    lastPos.current    = { x: e.clientX, y: e.clientY };
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDrag.current = true;
    lastPos.current  = { x: e.clientX, y: e.clientY };
    stateRef.current = { ...stateRef.current, x: stateRef.current.x + dx, y: stateRef.current.y + dy };
    applyTransform(stateRef.current);
  }, [applyTransform]);

  const onMouseUp = useCallback(() => { isDragging.current = false; }, []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    stateRef.current = { ...stateRef.current, scale: clampScale(stateRef.current.scale - e.deltaY * 0.001) };
    applyTransform(stateRef.current);
  }, [applyTransform]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDragging.current = true;
      didDrag.current    = false;
      lastPos.current    = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      const now = Date.now();
      if (now - lastTap.current < 300) resetView();
      lastTap.current = now;
    }
    if (e.touches.length === 2) {
      isDragging.current = false;
      pinchDist.current  = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
    }
  }, [resetView]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging.current) {
      const dx = e.touches[0].clientX - lastPos.current.x;
      const dy = e.touches[0].clientY - lastPos.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDrag.current = true;
      lastPos.current  = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      stateRef.current = { ...stateRef.current, x: stateRef.current.x + dx, y: stateRef.current.y + dy };
      applyTransform(stateRef.current);
    }
    if (e.touches.length === 2 && pinchDist.current !== null) {
      const newDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      stateRef.current = { ...stateRef.current, scale: clampScale(stateRef.current.scale * (newDist / pinchDist.current)) };
      pinchDist.current = newDist;
      applyTransform(stateRef.current);
    }
  }, [applyTransform]);

  const onTouchEnd = useCallback(() => {
    isDragging.current = false;
    pinchDist.current  = null;
  }, []);

  const getState = useCallback(() => stateRef.current, []);

  return {
    innerRef, getState, resetView,
    handlers: { onMouseDown, onMouseMove, onMouseUp, onWheel, onTouchStart, onTouchMove, onTouchEnd },
    isDragging, didDrag,
  };
}

// =============================================================================
// LOADING OVERLAY COMPONENT
// =============================================================================
interface MapLoadingOverlayProps {
  id: string;
  isError: boolean;
  errorMessage: string | null;
  terminal: string;
}

function MapLoadingOverlay({ id, isError, errorMessage, terminal }: MapLoadingOverlayProps) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center rounded-2xl"
      style={{
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        backgroundColor: isError
          ? "rgba(255, 237, 237, 0.75)"
          : "rgba(224, 242, 248, 0.55)",
      }}
    >
      <div
        id={id}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="flex flex-col items-center gap-3"
      >
        {isError ? (
          <ErrorContent message={errorMessage} />
        ) : (
          <LoadingContent terminal={terminal} />
        )}
      </div>
    </div>
  );
}

function LoadingContent({ terminal }: { terminal: string }) {
  return (
    <>
      <style>{`
        @keyframes map-ring-spin {
          to { stroke-dashoffset: -251; }
        }
        @keyframes map-dot-orbit {
          to { transform: rotate(360deg); }
        }
        @keyframes map-fade-in {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .map-ring-track,
          .map-ring-fill,
          .map-dot-orbit-wrapper,
          .map-loading-text { animation: none !important; }
        }
      `}</style>

      {/* Ring spinner — CSS stroke-dashoffset, zero JS */}
      <svg
        aria-hidden="true"
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        style={{ animation: "map-fade-in 0.3s ease both" }}
      >
        {/* Track ring */}
        <circle
          className="map-ring-track"
          cx="24" cy="24" r="20"
          stroke="#b6dde8"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="125.6"
          strokeDashoffset="0"
          opacity="0.5"
        />
        {/* Spinning fill arc */}
        <circle
          className="map-ring-fill"
          cx="24" cy="24" r="20"
          stroke="#1a7a9a"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="62 63.6"
          strokeDashoffset="0"
          style={{
            transformOrigin: "center",
            animation: "map-ring-spin 1.1s linear infinite",
          }}
        />
        {/* Orbiting dot */}
        <g
          className="map-dot-orbit-wrapper"
          style={{
            transformOrigin: "24px 24px",
            animation: "map-dot-orbit 1.1s linear infinite",
          }}
        >
          <circle cx="24" cy="4" r="2.5" fill="#00b4d8" />
        </g>
      </svg>

      <div
        className="map-loading-text flex flex-col items-center gap-0.5"
        style={{ animation: "map-fade-in 0.4s ease 0.1s both" }}
      >
        <span
          className="text-[13px] font-semibold tracking-wide"
          style={{ color: "#1a4a5c" }}
        >
          Memuat peta
        </span>
        <span
          className="text-[11px] font-normal"
          style={{ color: "#1a4a5c", opacity: 0.5 }}
        >
          Terminal {terminal}
        </span>
      </div>
    </>
  );
}

function ErrorContent({ message }: { message: string | null }) {
  return (
    <>
      <style>{`
        @keyframes map-error-shake {
          0%,100% { transform: translateX(0); }
          20%,60%  { transform: translateX(-4px); }
          40%,80%  { transform: translateX(4px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .map-error-icon { animation: none !important; }
        }
      `}</style>

      <svg
        aria-hidden="true"
        className="map-error-icon"
        width="40" height="40" viewBox="0 0 40 40"
        fill="none"
        style={{ animation: "map-error-shake 0.4s ease" }}
      >
        <circle cx="20" cy="20" r="18" fill="rgba(220,38,38,0.1)" stroke="#dc2626" strokeWidth="1.5" />
        <line x1="20" y1="12" x2="20" y2="22" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" />
        <circle cx="20" cy="27" r="1.5" fill="#dc2626" />
      </svg>

      <div className="flex flex-col items-center gap-0.5 text-center px-4">
        <span className="text-[13px] font-semibold" style={{ color: "#b91c1c" }}>
          Gagal memuat peta
        </span>
        <span className="text-[11px]" style={{ color: "#b91c1c", opacity: 0.7 }}>
          {message ?? "Periksa koneksi internet Anda"}
        </span>
      </div>
    </>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

// =============================================================================
// BUBBLE PREVIEW — muncul saat pin di-tap pertama kali
// =============================================================================

interface BubblePreview {
  facility: FacilityWithRelations;
  /** posisi pin dalam koordinat SVG (grid units * CELL) */
  svgX: number;
  svgY: number;
  /** "above" (default) kalau ruang cukup, "below" kalau pin terlalu dekat tepi atas canvas */
  placement: "above" | "below";
}

interface PinBubbleProps {
  bubble: BubblePreview;
  onConfirm: () => void;
  onDismiss: () => void;
  /** dimensi viewBox SVG (svgW/svgH) — buat konversi svgX/svgY → posisi persen */
  viewW: number;
  viewH: number;
}

function PinBubble({ bubble, onConfirm, onDismiss, viewW, viewH }: PinBubbleProps) {
  const { facility, svgX, svgY, placement } = bubble;
  const cat   = facility.category;
  const color = cat?.color ?? "#64748b";
  const icon  = cat?.icon  ?? null;
  const isBelow = placement === "below";

  const BUBBLE_W  = 200;
  const TAIL_H    = 8;
  const BUBBLE_UP = 8;

  // Keamanan: icon kategori bersumber dari data admin (DB) — markup SVG harus
  // disanitasi sebelum di-render via dangerouslySetInnerHTML, untuk mencegah
  // stored-XSS lewat atribut event (onload/onerror) di dalam SVG.
  const sanitizedIcon = useMemo(() => {
    if (!icon || !icon.trimStart().startsWith("<svg")) return null;
    return DOMPurify.sanitize(icon, {
      USE_PROFILES: { svg: true, svgFilters: true },
    });
  }, [icon]);

  // Posisi bubble dihitung sebagai persentase dari viewBox SVG, BUKAN dari
  // getBoundingClientRect(). Karena bubble ini dirender sebagai child di
  // dalam layer yang sama dengan transform pan/zoom (data-pan-inner), posisi
  // persen ini otomatis ikut ter-translate/ter-scale bareng peta — tanpa
  // perlu listen ke perubahan pan/zoom sama sekali (itu yang bikin bubble
  // sebelumnya "freeze" saat user geser map, karena pan/zoom di-apply
  // langsung ke DOM lewat rAF dan tidak men-trigger re-render React).
  const leftPct = (svgX / viewW) * 100;
  const topPct  = (svgY / viewH) * 100;

  return (
    <div
      style={{
        position:  "absolute",
        left:      `${leftPct}%`,
        top:       `${topPct}%`,
        transform: isBelow
          ? `translate(-50%, ${BUBBLE_UP + TAIL_H}px)`
          : `translate(-50%, calc(-100% - ${BUBBLE_UP + TAIL_H}px))`,
        zIndex:      30,
        width:       BUBBLE_W,
        pointerEvents: "auto",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Ekor segitiga: kalau "below" diletakkan SEBELUM card & mengarah ke atas
          (nempel ke pin di atasnya); kalau "above" diletakkan SESUDAH card &
          mengarah ke bawah (nempel ke pin di bawahnya). */}
      {isBelow && (
        <div
          style={{
            width: 0, height: 0,
            borderLeft:   "7px solid transparent",
            borderRight:  "7px solid transparent",
            borderBottom: "8px solid white",
            margin:       "0 auto",
            filter:       "drop-shadow(0 -2px 2px rgba(0,0,0,0.08))",
          }}
          aria-hidden="true"
        />
      )}

      {/* Bubble card */}
      <button
        onClick={onConfirm}
        aria-label={`Lihat detail ${facility.name}`}
        className={[
          "w-full text-left",
          "bg-white rounded-2xl px-3 py-2.5",
          "border border-slate-200",
          "shadow-[0_4px_20px_rgba(0,0,0,0.14)]",
          "flex items-center gap-2.5",
          "active:scale-[0.97] transition-transform duration-100",
        ].join(" ")}
        style={{ borderTop: `3px solid ${color}` }}
      >
        {/* Icon kategori dalam lingkaran warna */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white"
          style={{ backgroundColor: color }}
        >
          {!icon && (
            <span className="text-[10px] font-bold leading-none">
              {facility.category?.name?.slice(0, 2).toUpperCase() ?? "?"}
            </span>
          )}
          {icon && sanitizedIcon && (
            <span
              className="w-4 h-4 [&>svg]:w-full [&>svg]:h-full [&>svg]:fill-white"
              aria-hidden="true"
              dangerouslySetInnerHTML={{ __html: sanitizedIcon }}
            />
          )}
          {icon && !sanitizedIcon && (
            icon.startsWith("data:") || icon.startsWith("http") || icon.startsWith("/") || /\.(png|jpe?g|gif|webp|svg)$/i.test(icon)
              ? <img src={icon} alt="" aria-hidden="true" className="w-4 h-4 object-contain" />
              : <span aria-hidden="true" className="text-sm leading-none">{icon}</span>
          )}
        </div>

        {/* Nama + kategori */}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-slate-800 leading-tight truncate">
            {facility.name}
          </p>
          <p className="text-[11px] leading-tight mt-0.5 truncate" style={{ color }}>
            {cat?.name ?? ""} · {facility.floor.label}
          </p>
        </div>

        {/* Arrow hint */}
        <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
        </svg>
      </button>

      {!isBelow && (
        <div
          style={{
            width: 0, height: 0,
            borderLeft:  "7px solid transparent",
            borderRight: "7px solid transparent",
            borderTop:   "8px solid white",
            margin:      "0 auto",
            filter:      "drop-shadow(0 2px 2px rgba(0,0,0,0.08))",
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function MapCanvas({ children }: { children?: ReactNode }) {
  const activeTerminal           = useMapStore((s) => s.activeTerminal);
  const activeCategories         = useMapStore((s) => s.activeCategories);
  const selectedFacility         = useMapStore((s) => s.selectedFacility);
  const setSelectedFacility      = useMapStore((s) => s.setSelectedFacility);
  const setIsRouteOpen           = useMapStore((s) => s.setIsRouteOpen);
  const clearRoute               = useMapStore((s) => s.clearRoute);
  const adminSelectedFacility    = useMapStore((s) => s.adminSelectedFacility);
  const setAdminSelectedFacility = useMapStore((s) => s.setAdminSelectedFacility);
  const facilitiesVersion        = useMapStore((s) => s.facilitiesVersion);
  const mapMode                  = useMapStore((s) => s.mapMode);

  const [pinBubble, setPinBubble] = useState<BubblePreview | null>(null);

  const loadingId = useId();

  const { facilities, categories, status, errorMessage } = useMapData(
    activeTerminal,
    facilitiesVersion,
  );
  const isLoading = status === "loading";
  const isError   = status === "error";

  const outerRef = useRef<HTMLDivElement>(null);
  const { innerRef, handlers, isDragging, didDrag, getState } = usePanZoom(activeTerminal);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const prevent = (e: TouchEvent) => e.preventDefault();
    el.addEventListener("touchmove", prevent, { passive: false });
    return () => el.removeEventListener("touchmove", prevent);
  }, []);

  const cfg = useMemo<TerminalConfig>(
    () => (activeTerminal === "T1" ? T1_CFG : T2_CFG),
    [activeTerminal],
  );

  const wallSet = useMemo(() => buildWallSet(cfg.wallData.walls), [cfg]);

  // Performa: satu pass tunggal atas `facilities` untuk membangun semua index
  // sekaligus (sebelumnya 4 useMemo terpisah = 4x iterasi penuh array yang sama).
  const facilityIndexes = useMemo(() => {
    const byCoord  = new Map<string, FacilityWithRelations>();
    const byCode   = new Map<string, FacilityWithRelations>();
    const byDestId = new Map<string, FacilityWithRelations>();
    const colorBy  = new Map<string, string>();

    for (const f of facilities) {
      const coordKey = f.gridRow != null && f.gridCol != null ? `${f.gridRow},${f.gridCol}` : null;

      if (coordKey)  byCoord.set(coordKey, f);
      if (f.code)    byCode.set(f.code, f);
      if (f.destId)  byDestId.set(f.destId, f);

      const color = f.category?.color;
      if (color) {
        if (f.destId)  colorBy.set(f.destId, color);
        if (f.code)    colorBy.set(f.code, color);
        if (coordKey)  colorBy.set(coordKey, color);
      }
    }
    return { byCoord, byCode, byDestId, colorBy };
  }, [facilities]);

  const facilityMap     = facilityIndexes.byCoord;
  const facilityCodeMap = facilityIndexes.byCode;
  const facilityDestMap = facilityIndexes.byDestId;
  const destColorMap    = facilityIndexes.colorBy;

  // Map nama kategori → id untuk fallback prefix-based
  const categoryIdByName = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of categories) map.set(c.name, c.id);
    return map;
  }, [categories]);

  // Set berisi category.id yang aktif — bandingkan langsung, tanpa konversi nama
  const activeCategorySet = useMemo(
    () => (activeCategories.length === 0 ? null : new Set(activeCategories)),
    [activeCategories],
  );

  const GRAY_DEFAULT = "#9ca3af";

  const getDestColor = useCallback(
    (dest: DestinationPoint): string => {
      // Tidak ada filter aktif → semua abu-abu
      if (!activeCategorySet) return GRAY_DEFAULT;
      // Ada filter aktif → tampilkan warna kategori

      return destColorMap.get(dest.id) ?? destColorMap.get(`${dest.r},${dest.c}`) ?? dest.color;
    },
    [destColorMap, activeCategorySet],
  );

  const isVisible = useCallback((dest: DestinationPoint): boolean => {
    if (!activeCategorySet) return true;

    // Prioritas: destId → grid koordinat (sama dengan handleDestinationClick)
    const facility =
      facilityDestMap.get(dest.id) ??
      facilityMap.get(`${dest.r},${dest.c}`);

    if (facility) {
      // Bandingkan categoryId langsung — tidak perlu konversi nama string
      return activeCategorySet.has(facility.categoryId);
    }

    // Fallback prefix-based untuk dest yang belum ada di DB
    // Kalau tidak dikenal → sembunyikan saat filter aktif
    const catName = getCategoryName(dest.id);
    if (!catName) return false;
    const catId = categoryIdByName.get(catName);
    if (catId == null) return false;
    return activeCategorySet.has(catId);
  }, [activeCategorySet, facilityDestMap, facilityMap, categoryIdByName]);

  // Performa: cast + filter destinasi sekali per perubahan data, bukan 3x
  // setiap render (room boxes, pin markers, dan debug overlay sebelumnya
  // masing-masing melakukan map+filter terpisah atas array yang sama).
  const allDestinations = useMemo(
    () => cfg.destinations as DestinationWithRoom[],
    [cfg.destinations],
  );

  const { roomDests, pointDests } = useMemo(() => {
    const rooms: DestinationWithRoom[] = [];
    const points: DestinationWithRoom[] = [];
    for (const dest of allDestinations) {
      if (!isVisible(dest)) continue;
      (dest.room ? rooms : points).push(dest);
    }
    return { roomDests: rooms, pointDests: points };
  }, [allDestinations, isVisible]);

  const handleDestinationClick = useCallback(
    (dest: DestinationPoint, svgX: number, svgY: number) => {
      if (didDrag.current) return;

      const anchor   = resolveNavigationAnchor(dest, cfg.rows, cfg.cols, wallSet);
      const walkable = nearestWalkable(anchor.r, anchor.c, cfg.rows, cfg.cols, wallSet);

      const dbFacility =
        facilityDestMap.get(dest.id)
        ?? facilityMap.get(`${dest.r},${dest.c}`)
        ?? facilityMap.get(`${walkable.r},${walkable.c}`)
        ?? facilityCodeMap.get(dest.id);

      if (mapMode === "admin") {
        // NOTE (code quality): wallDestR/wallDestC belum jadi field formal di tipe
        // FacilityWithRelations / parameter setAdminSelectedFacility, sehingga di sini
        // perlu `as typeof ...` agar lolos excess-property check TypeScript. Akibatnya
        // TS tidak lagi tahu field ini ada di object hasil — kalau dibaca lagi nanti
        // (misal di editFacilityModal.tsx) butuh cast manual juga.
        // Perbaikan formal: tambahkan `wallDestR`/`wallDestC` ke tipe yang relevan di
        // src/types/index.ts dan ke signature setAdminSelectedFacility di mapStore.ts,
        // lalu hapus cast ini.
        if (dbFacility && dbFacility.id > 0) {
          const facilityWithCoords =
            (dbFacility.gridRow == null || dbFacility.gridCol == null)
              ? { ...dbFacility, gridRow: walkable.r, gridCol: walkable.c }
              : dbFacility;
          setAdminSelectedFacility({
            ...facilityWithCoords,
            wallDestR: dest.r,
            wallDestC: dest.c,
          } as typeof facilityWithCoords);
        } else {
          const template = makeAddFacilityTemplate(
            dest as DestinationWithRoom, walkable.r, walkable.c, activeTerminal,
          );
          setAdminSelectedFacility({
            ...template,
            wallDestR: dest.r,
            wallDestC: dest.c,
          } as typeof template);
        }
        return;
      }

      let facility: FacilityWithRelations;

      if (!dbFacility) {
        const floorId  = dest.id.startsWith("l2_") ? 2 : 1;
        const catName  = getCategoryName(dest.id) ?? "Services";
        const catEntry = categories.find(c => c.name === catName);
        const catId    = catEntry?.id ?? 1;
        facility = makeSyntheticFacility(
          dest as DestinationWithRoom, walkable.r, walkable.c,
          floorId, catId, catName, activeTerminal,
        );
      } else if (walkable.r !== dest.r || walkable.c !== dest.c) {
        facility = { ...dbFacility, gridRow: walkable.r, gridCol: walkable.c };
      } else {
        facility = dbFacility;
      }

      // Tap pin → tampilkan bubble preview dulu (bukan langsung POIDetail)
      const placement = getBubblePlacement(
        outerRef.current, getState(), svgX, svgY, cfg.cols * CELL, cfg.rows * CELL,
      );
      setPinBubble({ facility, svgX, svgY, placement });
    },
    [
      didDrag, facilityMap, facilityDestMap, facilityCodeMap,
      wallSet, cfg.rows, cfg.cols, mapMode, activeTerminal, categories,
      setAdminSelectedFacility, getState,
    ],
  );

  const handleBubbleConfirm = useCallback(() => {
    if (!pinBubble) return;
    setIsRouteOpen(false);
    clearRoute();
    setSelectedFacility(pinBubble.facility);
    setPinBubble(null);
  }, [pinBubble, setSelectedFacility, setIsRouteOpen, clearRoute]);

  const handleBubbleDismiss = useCallback(() => {
    setPinBubble(null);
  }, []);

  const svgW      = cfg.cols * CELL;
  const svgH      = cfg.rows * CELL;
  const calib     = BG_CALIBRATION[cfg.calibKey];
  const isGridMode  = mapMode === "grid";
  const isAdminMode = mapMode === "admin";

  return (
    <div
      ref={outerRef}
      className="relative h-full w-auto max-w-full rounded-2xl overflow-hidden shadow-[0_2px_24px_rgba(0,0,0,0.08)]"
      style={{ aspectRatio: `${cfg.cols} / ${cfg.rows}`, cursor: "grab", userSelect: "none", touchAction: "none" }}
      aria-busy={isLoading}
      aria-describedby={isLoading || isError ? loadingId : undefined}
      {...handlers}
    >
      <style>{`
        .map-focusable { outline: none; }
        .map-focusable:focus-visible {
          outline: 2.5px solid #2563eb;
          outline-offset: 2px;
          border-radius: 2px;
        }
      `}</style>
      <div
        ref={innerRef}
        data-pan-inner="true"
        className="absolute inset-0"
        style={{ transform: "translate(0px, 0px) scale(1)", transformOrigin: "center center", willChange: "transform" }}
      >
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox={`0 0 ${svgW} ${svgH}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={`Peta Terminal ${activeTerminal} Bandara Juanda`}
          onClick={() => handleBubbleDismiss()}
        >
          {/* LAYER 1: Background */}
          {!isGridMode && (
            <image
              href={cfg.bgSvg}
              x={calib.x} y={calib.y}
              width={svgW * calib.widthScale} height={svgH * calib.heightScale}
              preserveAspectRatio="none"
            />
          )}

          {/* LAYER 1b: Grid/Wall debug */}
          {isGridMode && (
            <GridWallLayer
              wallData={cfg.wallData} rows={cfg.rows} cols={cfg.cols}
              f1Min={cfg.f1Min} f2Min={cfg.f2Min} f2Max={cfg.f2Max}
              offsetX={calib.x * -1} offsetY={calib.y * 0}
            />
          )}

          {/* LAYER 2: Room boxes */}
          {roomDests.map((dest, i) => {
            const isSelected = isAdminMode
              ? adminSelectedFacility?.gridRow === dest.r && adminSelectedFacility?.gridCol === dest.c
              : selectedFacility?.code === dest.id || (selectedFacility?.gridRow === dest.r && selectedFacility?.gridCol === dest.c);

            return (
              <RoomMarker
                key={`room-${dest.id}-${i}`}
                dest={dest}
                activeTerminal={activeTerminal}
                color={getDestColor(dest)}
                isSelected={isSelected}
                onClick={(x, w, y) => handleDestinationClick(dest, x + w / 2, y)}
              />
            );
          })}

          {/* LAYER 3: Map-pin markers */}
          {pointDests.map((dest) => {
            const cx = dest.c * CELL + CELL / 2;
            const cy = dest.r * CELL + CELL / 2;
            const isSelected = isAdminMode
              ? adminSelectedFacility?.gridRow === dest.r && adminSelectedFacility?.gridCol === dest.c
              : selectedFacility?.code === dest.id || (selectedFacility?.gridRow === dest.r && selectedFacility?.gridCol === dest.c)
                || pinBubble?.facility.code === dest.id || (pinBubble?.facility.gridRow === dest.r && pinBubble?.facility.gridCol === dest.c);

            return (
              <DestMarker
                key={dest.id}
                cx={cx} cy={cy}
                color={getDestColor(dest)}
                label={dest.label}
                isSelected={isSelected}
                onClick={() => handleDestinationClick(dest, cx, cy)}
              />
            );
          })}

          {/* LAYER 4: Floor labels */}
          <FloorLabel x={12} y={cfg.labelL2Y} label="LANTAI 2" />
          <FloorLabel x={12} y={cfg.labelL1Y} label="LANTAI 1" />

          {/* LAYER 5: Kiosk marker */}
          <KioskMarker
            cx={cfg.startC * CELL + CELL / 2}
            cy={cfg.startR * CELL + CELL / 2}
            color={C_KIOSK}
          />

          {/* LAYER 6: Route + children */}
          <PathRenderer />
          {children}
        </svg>

        {/* BUBBLE PREVIEW — HTML overlay, tapi tetap di dalam layer pan/zoom
            yang sama dengan SVG, supaya ikut ter-translate/ter-scale saat
            user geser/zoom map (lihat komentar di komponen PinBubble). */}
        {pinBubble && (
          <PinBubble
            bubble={pinBubble}
            onConfirm={handleBubbleConfirm}
            onDismiss={handleBubbleDismiss}
            viewW={svgW}
            viewH={svgH}
          />
        )}
      </div>

      {/* DEBUG TOGGLE — hanya di admin mode */}
      {isAdminMode && (
        <button
          onClick={() => setShowDebug(v => !v)}
          style={{
            position: "absolute", top: 8, right: 8, zIndex: 50,
            background: showDebug ? "#ef4444" : "#1a4a5c",
            color: "#fff", border: "none", borderRadius: 6,
            padding: "3px 8px", fontSize: 11, fontWeight: 700,
            cursor: "pointer", opacity: 0.85,
          }}
        >
          {showDebug ? "Hide Debug" : "Debug r,c"}
        </button>
      )}

      {/* DEBUG OVERLAY — highlight match/no-match ke DB */}
      {isAdminMode && showDebug && (
        <svg
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 40 }}
          viewBox={`0 0 ${cfg.cols * CELL} ${cfg.rows * CELL}`}
          preserveAspectRatio="none"
        >
          {allDestinations.map((dest, i) => {
            const matched =
              facilityDestMap.has(dest.id) ||
              facilityMap.has(`${dest.r},${dest.c}`);
            const cx = (dest.room ? (dest.room.c1 + dest.room.c2) / 2 : dest.c) * CELL + CELL / 2;
            const cy = (dest.room ? (dest.room.r1 + dest.room.r2) / 2 : dest.r) * CELL + CELL / 2;
            return (
              <g key={`dbg-${dest.id}-${i}`}>
                <circle cx={cx} cy={cy} r={8} fill={matched ? "#22c55e" : "#ef4444"} opacity={0.85} />
                <text
                  x={cx} y={cy - 10}
                  textAnchor="middle" fontSize={4} fontWeight="700"
                  fill={matched ? "#166534" : "#7f1d1d"}
                >
                  {dest.id}
                </text>
                <text
                  x={cx} y={cy + 14}
                  textAnchor="middle" fontSize={4}
                  fill={matched ? "#166534" : "#7f1d1d"}
                >
                  r{dest.r},c{dest.c}
                </text>
              </g>
            );
          })}
        </svg>
      )}

      {(isLoading || isError) && (
        <MapLoadingOverlay
          id={loadingId}
          isError={isError}
          errorMessage={errorMessage}
          terminal={activeTerminal}
        />
      )}
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function FloorLabel({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <text
      x={x} y={y} fontSize={14} fontWeight="700" fill="#1a4a5c" opacity={0.35}
      fontFamily="system-ui, sans-serif" letterSpacing={1.5}
      pointerEvents="none" dominantBaseline="middle" aria-hidden="true"
    >
      {label}
    </text>
  );
}

interface RoomMarkerProps {
  dest: DestinationWithRoom;
  activeTerminal: "T1" | "T2";
  color: string;
  isSelected: boolean;
  onClick: (x: number, w: number, y: number) => void;
}

// React.memo: room box hanya re-render kalau props-nya benar-benar berubah,
// bukan setiap kali parent re-render (misal saat bubble preview dibuka/tutup).
const RoomMarker = memo(function RoomMarker({ dest, activeTerminal, color, isSelected, onClick }: RoomMarkerProps) {
  if (!dest.room) return null;
  const { r1, c1, r2, c2 } = dest.room;
  const roomCal = getRoomTransform(activeTerminal, dest);
  const x = c1 * CELL * roomCal.scaleX + roomCal.offsetX;
  const y = r1 * CELL * roomCal.scaleY + roomCal.offsetY;
  const w = (c2 - c1 + 1) * CELL * roomCal.scaleX;
  const h = (r2 - r1 + 1) * CELL * roomCal.scaleY;
  const hitPadX   = Math.max(0, (MIN_HIT - w) / 2);
  const hitPadY   = Math.max(0, (MIN_HIT - h) / 2);
  const showLabel = w >= 36 && h >= 18;

  return (
    <g
      role="button" tabIndex={0}
      className="map-focusable"
      aria-label={dest.label} aria-pressed={isSelected}
      style={{ cursor: "pointer" }}
      onClick={(e) => { e.stopPropagation(); onClick(x, w, y); }}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(x, w, y); } }}
    >
      {(hitPadX > 0 || hitPadY > 0) && (
        <rect x={x - hitPadX} y={y - hitPadY} width={w + hitPadX * 2} height={h + hitPadY * 2} rx={3} fill="transparent" stroke="none" />
      )}
      <rect
        x={x} y={y} width={w} height={h} rx={3}
        fill={color}
        stroke={isSelected ? "#f39c12" : color}
        fillOpacity={isSelected ? 0.55 : 0.28}
        strokeWidth={isSelected ? 2.5 : 1.2}
        strokeOpacity={isSelected ? 1 : 0.75}
      />
      <rect x={x + 1} y={y + 1} width={Math.max(0, w - 2)} height={Math.max(0, h - 2)} rx={2} fill="none" stroke="white" strokeOpacity={0.3} strokeWidth={0.7} pointerEvents="none" />
      {showLabel && (
        <text
          x={x + w / 2} y={y + h / 2}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={Math.min(8, Math.max(5, h * 0.3))} fontWeight={700}
          fill={isSelected ? "#111827" : "#1a1a2e"} fillOpacity={0.85}
          pointerEvents="none" className="select-none" aria-hidden="true"
        >
          {dest.label}
        </text>
      )}
      {isSelected && (
        <rect x={x - 1} y={y - 1} width={w + 2} height={h + 2} rx={4} fill="none" stroke="#f39c12" strokeWidth={2} strokeDasharray="4 2" pointerEvents="none" />
      )}
    </g>
  );
});

interface DestMarkerProps {
  cx: number; cy: number; color: string;
  label: string; isSelected: boolean; onClick: () => void;
}

const DestMarker = memo(function DestMarker({ cx, cy, color, label, isSelected, onClick }: DestMarkerProps) {
  // Map-pin teardrop — lebih mudah dibedakan & di-tap di layar sentuh
  const PH     = isSelected ? 17 : 14;   // total pin height
  const PR     = (PH * 0.72) / 2;        // radius kepala pin
  const headCY = cy - PH + PR;           // center Y kepala, ujung ekor di cy
  const pinPath = [
    `M ${cx} ${cy}`,
    `C ${cx - PR * 0.4} ${cy - PH * 0.35}, ${cx - PR} ${headCY + PR * 0.7}, ${cx - PR} ${headCY}`,
    `A ${PR} ${PR} 0 1 1 ${cx + PR} ${headCY}`,
    `C ${cx + PR} ${headCY + PR * 0.7}, ${cx + PR * 0.4} ${cy - PH * 0.35}, ${cx} ${cy}`,
    "Z",
  ].join(" ");
  return (
    <g
      role="button" tabIndex={0}
      className="map-focusable"
      aria-label={label} aria-pressed={isSelected}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
      style={{ cursor: "pointer" }}
    >
      {/* Invisible touch target */}
      <circle cx={cx} cy={cy - PH / 2} r={TOUCH_R} fill="transparent" />
      {/* Glow saat selected */}
      {isSelected && (
        <circle cx={cx} cy={headCY} r={PR + 5} fill={color} opacity={0.25} pointerEvents="none" />
      )}
      {/* Pin body */}
      <path
        d={pinPath}
        fill={color}
        fillOpacity={isSelected ? 1 : 0.88}
        stroke="white"
        strokeWidth={isSelected ? 1.5 : 1}
        strokeOpacity={0.9}
        pointerEvents="none"
      />
      {/* Dot putih di kepala pin */}
      <circle cx={cx} cy={headCY} r={PR * 0.32} fill="white" fillOpacity={0.95} pointerEvents="none" />
    </g>
  );
});

const KioskMarker = memo(function KioskMarker({ cx, cy, color }: { cx: number; cy: number; color: string }) {
  return (
    <g role="img" aria-label="Posisi Anda saat ini">
      <circle cx={cx} cy={cy} r={14} fill={color} opacity={0.15} aria-hidden="true" />
      <circle cx={cx} cy={cy} r={8}  fill={color} aria-hidden="true" />
      <circle cx={cx} cy={cy} r={3}  fill="#ffffff" aria-hidden="true" />
      <text
        x={cx + 13} y={cy + 4}
        fontSize={8} fontWeight="700"
        fill={color} fontFamily="system-ui, sans-serif" letterSpacing={0.3}
        aria-hidden="true"
      >
        Anda di sini
      </text>
    </g>
  );
});