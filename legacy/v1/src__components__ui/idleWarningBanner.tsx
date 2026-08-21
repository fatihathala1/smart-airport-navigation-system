"use client";

// Komponen banner yang muncul 30 detik sebelum idle reset.
// Dipasang di page.tsx, menerima countdown dari useIdleTimer().

interface IdleWarningBannerProps {
  countdown: number;
}

export default function IdleWarningBanner({ countdown }: IdleWarningBannerProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={[
        // Posisi: sticky di atas, di dalam map area scroll
        // z-50 supaya tampil di atas semua elemen kecuali modal
        "fixed top-0 left-0 right-0 z-50",
        "flex items-center justify-between gap-4",
        "px-6 py-3",
        "bg-amber-500 text-white",
        "shadow-[0_2px_16px_rgba(0,0,0,0.18)]",
        // Animasi masuk dari atas
        "animate-[slideDown_0.3s_ease-out]",
      ].join(" ")}
    >
      {/* Icon + teks */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Clock icon */}
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          className="shrink-0 opacity-90"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <path
            d="M12 7v5l3 3"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <span className="text-[clamp(14px,1.4vw,16px)] font-medium leading-snug">
          Sesi tidak aktif. Layar akan direset dalam{" "}
          <span className="font-bold tabular-nums">
            {countdown} detik
          </span>
          .
        </span>
      </div>

      {/* Hint interaksi */}
      <span className="text-[clamp(12px,1.1vw,14px)] opacity-80 whitespace-nowrap shrink-0">
        Sentuh layar untuk melanjutkan
      </span>
    </div>
  );
}