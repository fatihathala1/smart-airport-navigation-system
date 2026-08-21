// src/utils/resolveWalkable.ts
//
// Utility murni — tidak ada React / Zustand dependency.
// Dipakai RoutePanel untuk memastikan gridRow/gridCol dari facility
// (yang mungkin datang dari DB mentah via searchModal) sudah walkable
// sebelum dikirim ke A*.
//
// Ini mencerminkan logika yang sama dengan handleDestinationClick di mapCanvas:
//   1. resolveNavigationAnchor  → cari anchor tepi room
//   2. nearestWalkable          → geser ke cell kosong terdekat
// =============================================================================

import { resolveNavigationAnchor } from "@/utils/roomAnchor";
import type { TerminalId } from "@/types";

import {
  T1_WALL_DATA, ROWS as T1_ROWS, COLS as T1_COLS,
  DESTINATIONS as T1_DESTINATIONS,
} from "@/data/walls/t1";

import {
  T2_WALL_DATA, ROWS as T2_ROWS, COLS as T2_COLS,
  DESTINATIONS as T2_DESTINATIONS,
} from "@/data/walls/t2";

import { buildWallSet } from "@/lib/astar";

// =============================================================================
// WALL SETS — dibangun sekali, di-cache di module level
// =============================================================================

const T1_WALL_SET = buildWallSet(T1_WALL_DATA.walls);
const T2_WALL_SET = buildWallSet(T2_WALL_DATA.walls);

// =============================================================================
// nearestWalkable
// Identik dengan yang ada di mapCanvas — cari cell walkable terdekat
// dengan BFS radial (spiral expand) dari titik awal.
// =============================================================================

function nearestWalkable(
  r: number,
  c: number,
  rows: number,
  cols: number,
  wallSet: Set<string>,
): { r: number; c: number } {
  if (!wallSet.has(`${r},${c}`)) return { r, c };

  for (let radius = 1; radius <= 10; radius++) {
    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        if (Math.abs(dr) !== radius && Math.abs(dc) !== radius) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
        if (!wallSet.has(`${nr},${nc}`)) return { r: nr, c: nc };
      }
    }
  }

  return { r, c }; // fallback — seharusnya tidak tercapai
}

// =============================================================================
// resolveWalkableCoords
//
// Entry point utama. Diberikan:
//   - destId       : string ID dari JSON (misalnya "l1_gate12"), dipakai untuk
//                    lookup DESTINATIONS agar dapat room box
//   - gridRow/Col  : koordinat dari DB (mungkin belum walkable)
//   - terminal     : "T1" | "T2"
//
// Mengembalikan { r, c } yang dijamin walkable dan siap dipakai A*.
// =============================================================================

export function resolveWalkableCoords(
  destId: string | null | undefined,
  gridRow: number,
  gridCol: number,
  terminal: TerminalId,
): { r: number; c: number } {
  const wallSet   = terminal === "T1" ? T1_WALL_SET   : T2_WALL_SET;
  const rows      = terminal === "T1" ? T1_ROWS        : T2_ROWS;
  const cols      = terminal === "T1" ? T1_COLS        : T2_COLS;
  const dests     = terminal === "T1" ? T1_DESTINATIONS : T2_DESTINATIONS;

  // Jika destId ada, cari entry JSON untuk dapat room box
  const destEntry = destId
    ? dests.find((d) => d.id === destId)
    : undefined;

  if (destEntry) {
    // Pakai resolveNavigationAnchor (sama dengan mapCanvas) → dapat anchor tepi room
    const anchor   = resolveNavigationAnchor(destEntry, rows, cols, wallSet);
    const walkable = nearestWalkable(anchor.r, anchor.c, rows, cols, wallSet);
    return walkable;
  }

  // Fallback: tidak ada destId / tidak ketemu di JSON → pakai DB coords langsung
  // tapi tetap pastikan walkable
  const walkable = nearestWalkable(gridRow, gridCol, rows, cols, wallSet);
  return walkable;
}