"use client";

import { useEffect, useState } from "react";

// =============================================================================
// HELPERS
// =============================================================================

const MONTHS_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const DAYS_ID = [
  "Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu",
];

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

interface TimeData {
  hours: string;
  minutes: string;
  day: string;
  date: string;
  month: string;
}

function getTimeData(date: Date): TimeData {
  return {
    hours:   pad(date.getHours()),
    minutes: pad(date.getMinutes()),
    day:     DAYS_ID[date.getDay()],
    date:    date.getDate().toString(),
    month:   MONTHS_ID[date.getMonth()],
  };
}

// =============================================================================
// STYLES
// =============================================================================

const clockStyles = `
  .realtime-clock {
    display: flex;
    align-items: center;
    gap: 6px;
    user-select: none;
  }

  .clock-time {
    font-size: clamp(28px, 3.5vw, 42px);
    font-weight: 700;
    color: #1a1a2e;
    letter-spacing: -0.5px;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  .clock-separator {
    opacity: 0.6;
    animation: blink 1s step-end infinite;
  }

  @keyframes blink {
    0%, 100% { opacity: 0.6; }
    50%       { opacity: 0.15; }
  }

  .clock-date {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 1px;
    padding-left: 4px;
    border-left: 2px solid rgba(26, 26, 46, 0.15);
  }

  .clock-date-text {
    font-size: clamp(12px, 1.2vw, 15px);
    font-weight: 600;
    color: #1a1a2e;
    line-height: 1.2;
    white-space: nowrap;
  }

  .clock-day-text {
    font-size: clamp(11px, 1.1vw, 13px);
    font-weight: 400;
    color: rgba(26, 26, 46, 0.55);
    line-height: 1.2;
    white-space: nowrap;
  }
`;

// =============================================================================
// COMPONENT
// =============================================================================

export default function RealtimeClock() {
  // Inisialisasi null agar SSR dan client render output yang sama (kosong),
  // sehingga tidak terjadi hydration mismatch.
  const [time, setTime] = useState<TimeData | null>(null);

  useEffect(() => {
    // Interval callback berjalan secara async → aman dari aturan lint
    const interval = setInterval(() => {
      setTime(getTimeData(new Date()));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Belum mount di client → render placeholder dengan dimensi sama
  // supaya tidak ada layout shift
  if (!time) {
    return (
      <div className="realtime-clock" aria-hidden="true">
        <span className="clock-time">
          --<span className="clock-separator">.</span>--
        </span>
        <div className="clock-date">
          <span className="clock-date-text">-- -----</span>
          <span className="clock-day-text">------</span>
        </div>
        <style>{clockStyles}</style>
      </div>
    );
  }

  return (
    <div className="realtime-clock">
      {/* Jam */}
      <span className="clock-time">
        {time.hours}
        <span className="clock-separator">.</span>
        {time.minutes}
      </span>

      {/* Tanggal & Hari */}
      <div className="clock-date">
        <span className="clock-date-text">
          {time.date} {time.month}
        </span>
        <span className="clock-day-text">
          {time.day}
        </span>
      </div>

      <style>{clockStyles}</style>
    </div>
  );
}