"use client";

// =============================================================================
// src/components/map/gridWallLayer.tsx
//
// Debug layer: tampilkan wall grid di atas peta saat mapMode === "grid"
// Koordinat identik dengan room box dan path (raw grid) → overlay selalu align
// =============================================================================

import { useMemo } from "react";
import { buildWallSet } from "@/lib/astar";
import type { WallDataJson } from "@/types";

const CELL = 6; // harus sama dengan mapCanvas.tsx

interface GridWallLayerProps {
  wallData: WallDataJson;
  rows: number;
  cols: number;
  f1Min: number;
  f2Min: number;
  f2Max: number;
  offsetX?: number;
  offsetY?: number;
}

export default function GridWallLayer({
  wallData,
  rows,
  cols,
  f1Min,
  f2Min,
  f2Max,
  offsetX = 7,
  offsetY = 23,
}: GridWallLayerProps) {
  const wallSet = useMemo(() => buildWallSet(wallData.walls), [wallData]);

  // Render wall cells sebagai rect kecil
  // Hanya wall yang di-render (walkable area = transparent/warna zone)
  const wallRects = useMemo(() => {
    const rects: { key: string; x: number; y: number }[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (wallSet.has(`${r},${c}`)) {
          rects.push({ key: `${r},${c}`, x: c * CELL, y: r * CELL });
        }
      }
    }
    return rects;
  }, [wallSet, rows, cols]);

  const svgW = cols * CELL;
  const svgH = rows * CELL;

  // Zone fills
  const f2ZoneY  = f2Min * CELL;
  const f2ZoneH  = (f2Max - f2Min + 1) * CELL;
  const f1ZoneY  = f1Min * CELL;
  const f1ZoneH  = (rows - f1Min) * CELL;
  const gapZoneY = (f2Max + 1) * CELL;
  const gapZoneH = Math.max(0, (f1Min - f2Max - 1) * CELL);

  // Grid lines setiap 10 cell
  const vLines = Array.from({ length: Math.floor(cols / 10) + 1 }, (_, i) => i * 10);
  const hLines = Array.from({ length: Math.floor(rows / 10) + 1 }, (_, i) => i * 10);

  return (
    <g id="grid-wall-layer" pointerEvents="none" transform={`translate(${offsetX}, ${offsetY})`}>
      {/* Zone fills */}
      <rect x={0} y={f2ZoneY} width={svgW} height={f2ZoneH}
        fill="#dbeafe" fillOpacity={0.5} />
      {gapZoneH > 0 && (
        <rect x={0} y={gapZoneY} width={svgW} height={gapZoneH}
          fill="#f3f4f6" fillOpacity={0.3} />
      )}
      <rect x={0} y={f1ZoneY} width={svgW} height={f1ZoneH}
        fill="#dcfce7" fillOpacity={0.5} />

      {/* Grid lines */}
      {vLines.map(c => (
        <line key={`vg-${c}`}
          x1={c * CELL} y1={0} x2={c * CELL} y2={svgH}
          stroke="#94a3b8" strokeWidth={0.3} strokeOpacity={0.5} />
      ))}
      {hLines.map(r => (
        <line key={`hg-${r}`}
          x1={0} y1={r * CELL} x2={svgW} y2={r * CELL}
          stroke="#94a3b8" strokeWidth={0.3} strokeOpacity={0.5} />
      ))}

      {/* Wall cells */}
      {wallRects.map(({ key, x, y }) => (
        <rect key={key} x={x} y={y} width={CELL} height={CELL}
          fill="#1e293b" fillOpacity={0.8} />
      ))}

      {/* Row labels setiap 5 */}
      {Array.from({ length: Math.floor(rows / 5) + 1 }, (_, i) => i * 5).map(r => (
        <text key={`rl-${r}`} x={2} y={r * CELL + 4}
          fontSize={3.5} fill="#334155" fillOpacity={0.8} fontFamily="monospace">
          {r}
        </text>
      ))}

      {/* Col labels setiap 10 */}
      {vLines.map(c => (
        <text key={`cl-${c}`} x={c * CELL + 1} y={7}
          fontSize={3.5} fill="#334155" fillOpacity={0.8} fontFamily="monospace">
          {c}
        </text>
      ))}

      {/* Zone labels */}
      <text x={svgW - 50} y={f2ZoneY + f2ZoneH / 2}
        fontSize={7} fontWeight="700" fill="#1d4ed8" fillOpacity={0.6}
        fontFamily="system-ui" dominantBaseline="middle">
        LANTAI 2
      </text>
      <text x={svgW - 50} y={f1ZoneY + f1ZoneH / 2}
        fontSize={7} fontWeight="700" fill="#15803d" fillOpacity={0.6}
        fontFamily="system-ui" dominantBaseline="middle">
        LANTAI 1
      </text>
    </g>
  );
}