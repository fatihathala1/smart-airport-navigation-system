"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useMapStore } from "@/store/mapStore";

// Berapa detik sebelum reset → warning countdown muncul
const WARNING_BEFORE_MS = 30_000;

// Event yang dianggap sebagai interaksi user
const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "touchstart",
  "touchmove",
  "keydown",
] as const;

interface UseIdleTimerReturn {
  /** Sisa detik sebelum reset (null = tidak dalam warning) */
  countdown: number | null;
}

/**
 * useIdleTimer
 *
 * Otomatis reset semua state setelah user tidak ada interaksi selama
 * `timeoutMs` milidetik. 30 detik sebelum reset, `countdown` mulai
 * menghitung mundur sehingga UI bisa menampilkan warning banner.
 *
 * @param timeoutMs - Total idle timeout, default 3 menit (180.000ms)
 */
export function useIdleTimer(timeoutMs = 180_000): UseIdleTimerReturn {
  const resetToIdle = useMapStore((s) => s.resetToIdle);
  const [countdown, setCountdown] = useState<number | null>(null);

  const resetTimerRef        = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const warningTimerRef      = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Bersihkan semua timer — TIDAK memanggil setState ───────────────────────
  const clearAllTimers = useCallback(() => {
    if (resetTimerRef.current)         clearTimeout(resetTimerRef.current);
    if (warningTimerRef.current)       clearTimeout(warningTimerRef.current);
    if (countdownIntervalRef.current)  clearInterval(countdownIntervalRef.current);
    resetTimerRef.current        = null;
    warningTimerRef.current      = null;
    countdownIntervalRef.current = null;
  }, []);

  // ─── Hanya atur setTimeout/setInterval — TIDAK memanggil setState ───────────
  //
  // Aturan React: setState TIDAK boleh dipanggil synchronous di body useEffect.
  // setState hanya boleh dari:
  //   (a) callback async  → setTimeout / setInterval  ✅
  //   (b) event handler   → addEventListener callback ✅
  //
  // restartTimers() hanya mengatur timer, semua setCountdown ada di dalam
  // callback setTimeout/setInterval di bawah — bukan di body effect.
  const restartTimers = useCallback(() => {
    clearAllTimers();

    // Timer 1: setelah (timeoutMs - 30s) → mulai countdown warning
    warningTimerRef.current = setTimeout(() => {
      const warningSeconds = Math.floor(WARNING_BEFORE_MS / 1000);
      setCountdown(warningSeconds); // ✅ async callback

      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => { // ✅ async callback
          if (prev === null || prev <= 1) return null;
          return prev - 1;
        });
      }, 1000);
    }, timeoutMs - WARNING_BEFORE_MS);

    // Timer 2: setelah timeoutMs penuh → eksekusi reset
    resetTimerRef.current = setTimeout(() => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
      setCountdown(null);  // ✅ async callback
      resetToIdle();
    }, timeoutMs);
  }, [timeoutMs, clearAllTimers, resetToIdle]);

  useEffect(() => {
    // Mount: hanya set up timer (restartTimers tidak memanggil setState → aman)
    restartTimers();

    // Activity handler: setState di dalam event handler → aman
    const handleActivity = () => {
      setCountdown(null); // ✅ event handler
      restartTimers();
    };

    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, handleActivity, { passive: true })
    );

    return () => {
      clearAllTimers();
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, handleActivity)
      );
    };
  }, [restartTimers, clearAllTimers]);

  return { countdown };
}