"use client";

import { useEffect, useCallback, useState } from "react";
import { useMapStore } from "@/store/mapStore";
import {
  astarWithStairs,
  buildWallSet,
  calcMultiPathMeters,
  calcWalkMinutes,
} from "@/lib/astar";

import {
  T1_WALL_DATA, ROWS as T1_ROWS, COLS as T1_COLS,
  START_R as T1_START_R, START_C as T1_START_C,
  STAIRCASE_L1 as T1_STAIRCASE_L1, STAIRCASE_L2 as T1_STAIRCASE_L2,
  FLOOR1_ROW_MIN as T1_FLOOR1_ROW_MIN,
} from "@/data/walls/t1";

import {
  T2_WALL_DATA, ROWS as T2_ROWS, COLS as T2_COLS,
  START_R as T2_START_R, START_C as T2_START_C,
  STAIRCASE_L1 as T2_STAIRCASE_L1, STAIRCASE_L2 as T2_STAIRCASE_L2,
  FLOOR1_ROW_MIN as T2_FLOOR1_ROW_MIN,
} from "@/data/walls/t2";

import { resolveWalkableCoords } from "@/utils/resolveWalkable";

const TERMINAL_DATA = {
  T1: {
    wallSet: buildWallSet(T1_WALL_DATA.walls), rows: T1_ROWS, cols: T1_COLS,
    startR: T1_START_R, startC: T1_START_C,
    staircaseL1: T1_STAIRCASE_L1, staircaseL2: T1_STAIRCASE_L2,
    floor1RowMin: T1_FLOOR1_ROW_MIN,
  },
  T2: {
    wallSet: buildWallSet(T2_WALL_DATA.walls), rows: T2_ROWS, cols: T2_COLS,
    startR: T2_START_R, startC: T2_START_C,
    staircaseL1: T2_STAIRCASE_L1, staircaseL2: T2_STAIRCASE_L2,
    floor1RowMin: T2_FLOOR1_ROW_MIN,
  },
} as const;

function buildDestId(code: string | undefined | null, gridRow: number, floor1RowMin: number): string {
  if (code && /^l[12]_/.test(code)) return code;
  const floorPrefix = gridRow >= floor1RowMin ? "l1" : "l2";
  return `${floorPrefix}_${code ?? gridRow}`;
}

export default function RoutePanel() {
  const activeTerminal        = useMapStore((s) => s.activeTerminal);
  const selectedFacility      = useMapStore((s) => s.selectedFacility);
  const routeResult           = useMapStore((s) => s.routeResult);
  const isSearchOpen          = useMapStore((s) => s.isSearchOpen);
  const setIsRouteOpen        = useMapStore((s) => s.setIsRouteOpen);
  const setRouteResult        = useMapStore((s) => s.setRouteResult);
  const clearSelectedFacility = useMapStore((s) => s.clearSelectedFacility);

  const [panelPos, setPanelPos]     = useState({ x: 24, y: 420 });
  const [dragging, setDragging]     = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setDragging(true);
    setDragOffset({ x: e.clientX - panelPos.x, y: e.clientY - panelPos.y });
  };
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragging) return;
    setPanelPos({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
  };
  const handleMouseUp = () => setDragging(false);

  const calculate = useCallback(async () => {
    if (!selectedFacility) { setRouteResult(null); return; }
    if (selectedFacility.gridRow == null || selectedFacility.gridCol == null) { setRouteResult(null); return; }

    const td = TERMINAL_DATA[activeTerminal];
    await new Promise<void>((r) => setTimeout(r, 30));

    // Resolve koordinat walkable yang benar — menangani kasus facility yang
    // datang dari searchModal (DB mentah) maupun dari mapCanvas (sudah di-resolve).
    // Logika ini identik dengan handleDestinationClick di mapCanvas:
    //   1. resolveNavigationAnchor → anchor tepi room dari JSON
    //   2. nearestWalkable         → geser ke cell kosong terdekat
    const resolved = resolveWalkableCoords(
      selectedFacility.destId,
      selectedFacility.gridRow,
      selectedFacility.gridCol,
      activeTerminal,
    );

    const destId = buildDestId(selectedFacility.code, resolved.r, td.floor1RowMin);

    const multiPath = astarWithStairs(
      td.startR, td.startC,
      resolved.r, resolved.c,
      destId, td.wallSet, td.rows, td.cols,
      td.staircaseL1, td.staircaseL2, td.floor1RowMin,
    );

    if (!multiPath) { setRouteResult(null); return; }

    setRouteResult({ multiPath, destId, destLabel: selectedFacility.name });
  }, [selectedFacility, activeTerminal, setRouteResult]);

  useEffect(() => {
    void calculate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFacility?.id, selectedFacility?.code, activeTerminal]);

  const handleClose = useCallback(() => {
    setIsRouteOpen(false);
    setRouteResult(null);
    clearSelectedFacility();
  }, [setIsRouteOpen, setRouteResult, clearSelectedFacility]);

  const usedStairs  = routeResult?.multiPath?.usedStairs ?? false;
  const stairsLabel = routeResult?.multiPath?.stairsLabel;

  // Hide behind search modal — avoids panel being "frozen" under the backdrop
  if (isSearchOpen) return null;

  // ── Distance metric ──────────────────────────────────────────────────────
  // Dihitung dari segment path asli (bukan totalSteps) agar akurat untuk
  // gerakan diagonal. totalSteps tetap dipakai pathRenderer untuk timing animasi.
  const distanceMeters = routeResult
    ? calcMultiPathMeters(routeResult.multiPath.segments)
    : 0;
  const walkMinutes = calcWalkMinutes(distanceMeters);

  return (
    <div
      className="fixed z-50 w-80 rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
      style={{ left: panelPos.x, top: panelPos.y }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* HEADER */}
      <div
        className="flex cursor-move items-center justify-between px-4 py-3 border-b select-none bg-white"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <span>🗺️</span>
          <span className="text-sm font-bold text-gray-900">Petunjuk Arah</span>
        </div>
        <button
          onClick={handleClose}
          className="text-gray-500 hover:text-black cursor-pointer text-base font-bold"
        >
          ✕
        </button>
      </div>

      {/* CONTENT */}
      <div className="p-4 space-y-3 max-h-64 overflow-y-auto">

        {/* DARI */}
        <div>
          <p className="text-xs font-bold text-gray-900 uppercase tracking-wide">Dari</p>
          <p className="font-semibold text-sm text-gray-900">Kiosk Informasi</p>
        </div>

        {/* KE */}
        <div>
          <p className="text-xs font-bold text-gray-900 uppercase tracking-wide">Ke</p>
          <p className="font-semibold text-sm text-gray-900">
            {routeResult?.destLabel ?? selectedFacility?.name ?? "—"}
          </p>
        </div>

        {/* Status loading */}
        {!routeResult && (
          <div className="bg-gray-100 rounded-xl px-3 py-2 text-sm text-gray-900">
            Menghitung rute…
          </div>
        )}

        {/* Tidak ditemukan */}
        {routeResult && distanceMeters === 0 && (
          <div className="bg-red-50 rounded-xl px-3 py-2 text-sm font-semibold text-red-600">
            ❌ Jalur tidak ditemukan
          </div>
        )}

        {/* Hasil rute */}
        {routeResult && distanceMeters > 0 && (
          <>
            {/* Metric utama: jarak + estimasi waktu */}
            <div className="bg-blue-50 rounded-xl px-3 py-2 text-sm flex items-center gap-2">
              <span className="font-bold text-gray-900">{distanceMeters} m</span>
              <span className="text-gray-500">·</span>
              <span className="text-gray-900 font-medium">
                ±{walkMinutes} menit
              </span>
            </div>

            {usedStairs && stairsLabel && (
              <div className="bg-amber-50 rounded-xl px-3 py-2 text-xs font-semibold text-amber-800">
                🪜 Via {stairsLabel}
              </div>
            )}

            <div className="space-y-1">
              {routeResult.multiPath.segments.map((seg, i) => (
                <div
                  key={i}
                  className="text-xs bg-gray-100 rounded-lg px-3 py-2 flex justify-between text-gray-900"
                >
                  <span className="font-semibold">Segmen {i + 1}</span>
                  <span className="font-bold">
                    {calcMultiPathMeters([seg])} m
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}