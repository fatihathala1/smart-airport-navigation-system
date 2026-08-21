"use client";

// PathRenderer di-render sebagai children di dalam <svg> MapCanvas.
// Komponen ini HANYA mengembalikan elemen SVG (fragment) — tidak ada div wrapper.

import { useMemo } from "react";
import { useMapStore } from "@/store/mapStore";
import type { GridPoint, PathSegment } from "@/types";

// =============================================================================
// CONSTANTS
// =============================================================================

/** Harus sinkron dengan CELL di MapCanvas.tsx */
const CELL = 6;

/** Ketebalan garis jalur */
const STROKE_WIDTH      = 3.5;
const STROKE_GLOW_WIDTH = STROKE_WIDTH * 3.5;

/** Durasi animasi per langkah (detik) */
const SEC_PER_STEP = 0.008;
const MIN_DURATION = 0.6;
const MAX_DURATION = 3.0;

// =============================================================================
// UTILS
// =============================================================================

/** Konversi array GridPoint → SVG points string untuk <polyline> */
function toSvgPoints(path: GridPoint[]): string {
  return path
    .map(({ r, c }) => `${c * CELL + CELL / 2},${r * CELL + CELL / 2}`)
    .join(" ");
}

/** Hitung durasi animasi dari jumlah langkah */
function calcDuration(steps: number): number {
  return Math.min(MAX_DURATION, Math.max(MIN_DURATION, steps * SEC_PER_STEP));
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function PathRenderer() {
  const routeResult = useMapStore((s) => s.routeResult);

  // Key unik per hasil rute → memaksa remount → restart animasi
  const routeKey = useMemo(() => {
    if (!routeResult) return "empty";
    const { segments, totalSteps } = routeResult.multiPath;
    const first = segments[0]?.path[0];
    const last  = segments.at(-1)?.path.at(-1);
    return `${first?.r},${first?.c}-${last?.r},${last?.c}-${totalSteps}`;
  }, [routeResult]);

  if (!routeResult) return null;

  const { segments, usedStairs, stairsLabel } = routeResult.multiPath;

  // Hitung delay kumulatif per segment
  const durations: number[] = segments.map((seg: PathSegment) =>
    calcDuration(seg.path.length - 1)
  );
  const delays: number[] = durations.map((_: number, i: number) =>
    durations.slice(0, i).reduce((sum: number, d: number) => sum + d, 0)
  );

  // Titik tangga = titik akhir segment pertama = titik awal segment kedua
  const stairsPoint: GridPoint | null =
    usedStairs && segments.length >= 2
      ? (segments[0].path.at(-1) ?? null)
      : null;

  return (
    // Key pada fragment ini memicu re-mount saat rute berubah → animasi restart
    <g key={routeKey}>

      {/* ── CSS keyframes — ditempatkan di dalam SVG via <defs><style> ── */}
      <defs>
        <style>{`
          @keyframes drawPath {
            from { stroke-dashoffset: 1; }
            to   { stroke-dashoffset: 0; }
          }
          @keyframes fadeInMarker {
            from { opacity: 0; transform: scale(0.4); }
            to   { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </defs>

      {/* ── Render tiap segment jalur ── */}
      {segments.map((seg, i) => (
        <PathSegmentLayer
          key={i}
          segment={seg}
          duration={durations[i]}
          delay={delays[i]}
        />
      ))}

      {/* ── Titik tangga (hanya saat lintas lantai) ── */}
      {stairsPoint && (
        <StairsMarker
          r={stairsPoint.r}
          c={stairsPoint.c}
          label={stairsLabel}
          delay={delays[1] ?? 0}
        />
      )}

      {/* ── Marker titik tujuan (akhir segment terakhir) ── */}
      {segments.at(-1)?.path.at(-1) && (
        <DestinationMarker
          r={segments.at(-1)!.path.at(-1)!.r}
          c={segments.at(-1)!.path.at(-1)!.c}
          color={segments.at(-1)!.color}
          delay={delays.at(-1)! + durations.at(-1)!}
        />
      )}
    </g>
  );
}

// =============================================================================
// SUB-COMPONENTS (SVG only)
// =============================================================================

// ─── Satu segment jalur: glow + garis utama ───────────────────────────────────
interface PathSegmentLayerProps {
  segment: PathSegment;
  duration: number;
  delay: number;
}

function PathSegmentLayer({ segment, duration, delay }: PathSegmentLayerProps) {
  const points = useMemo(() => toSvgPoints(segment.path), [segment.path]);

  const animStyle: React.CSSProperties = {
    strokeDasharray:  1,
    strokeDashoffset: 1,
    animation: `drawPath ${duration}s ease-out ${delay}s forwards`,
  };

  return (
    <g>
      {/* Glow layer */}
      <polyline
        points={points}
        pathLength={1}
        fill="none"
        stroke={segment.color}
        strokeWidth={STROKE_GLOW_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.22}
        style={animStyle}
        pointerEvents="none"
      />
      {/* Garis utama */}
      <polyline
        points={points}
        pathLength={1}
        fill="none"
        stroke={segment.color}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={1}
        style={animStyle}
        pointerEvents="none"
      />
    </g>
  );
}

// ─── Marker tangga di titik pertemuan dua segment ─────────────────────────────
interface StairsMarkerProps {
  r: number;
  c: number;
  label: string | undefined;
  delay: number;
}

function StairsMarker({ r, c, label, delay }: StairsMarkerProps) {
  const cx = c * CELL + CELL / 2;
  const cy = r * CELL + CELL / 2;

  return (
    <g
      pointerEvents="none"
      style={{
        transformOrigin: `${cx}px ${cy}px`,
        animation: `fadeInMarker 0.35s ease-out ${delay}s both`,
      }}
    >
      {/* Lingkaran luar */}
      <circle cx={cx} cy={cy} r={9}  fill="#ffffff" opacity={0.9} />
      <circle cx={cx} cy={cy} r={9}  fill="none" stroke="#f39c12" strokeWidth={2} />
      {/* Icon tangga — dua kotak kecil diagonal */}
      <rect x={cx - 4} y={cy - 1} width={4} height={4} rx={0.5} fill="#f39c12" />
      <rect x={cx}     y={cy - 5} width={4} height={4} rx={0.5} fill="#f39c12" />
      {/* Label */}
      {label && (
        <text
          x={cx}
          y={cy + 18}
          textAnchor="middle"
          fontSize={8}
          fontWeight="700"
          fill="#f39c12"
          fontFamily="system-ui, sans-serif"
          letterSpacing={0.3}
        >
          {label}
        </text>
      )}
    </g>
  );
}

// ─── Marker titik tujuan ──────────────────────────────────────────────────────
interface DestinationMarkerProps {
  r: number;
  c: number;
  color: string;
  delay: number;
}

function DestinationMarker({ r, c, color, delay }: DestinationMarkerProps) {
  const cx = c * CELL + CELL / 2;
  const cy = r * CELL + CELL / 2;

  return (
    <g
      pointerEvents="none"
      style={{
        transformOrigin: `${cx}px ${cy}px`,
        animation: `fadeInMarker 0.4s ease-out ${delay}s both`,
      }}
    >
      {/* Pulse ring */}
      <circle cx={cx} cy={cy} r={12} fill={color} opacity={0.2} />
      {/* Lingkaran utama */}
      <circle cx={cx} cy={cy} r={7}  fill={color} />
      {/* Border putih */}
      <circle cx={cx} cy={cy} r={7}  fill="none" stroke="#ffffff" strokeWidth={1.5} />
      {/* Center dot */}
      <circle cx={cx} cy={cy} r={2.5} fill="#ffffff" />
    </g>
  );
}