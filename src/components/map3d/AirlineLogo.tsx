"use client";

import { useState } from "react";

const LOGO_EXTENSIONS = ["svg", "png", "webp"] as const;

function initials(name: string) {
  return name.split(/\s+/).map((word) => word[0]).join("").slice(0, 2).toUpperCase();
}

/** Logo dari `public/airlines/<slug>.<svg|png|webp>`. Jika belum ada, tampil inisial. */
export function AirlineLogo({ slug, name }: { slug: string; name: string }) {
  const [attempt, setAttempt] = useState(0);

  if (attempt >= LOGO_EXTENSIONS.length) {
    return <span className="departure-logo-monogram" aria-hidden="true">{initials(name)}</span>;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- logo kecil dari folder public, fallback ditangani onError
    <img
      className="departure-logo"
      src={`/airlines/${slug}.${LOGO_EXTENSIONS[attempt]}`}
      alt=""
      width={56}
      height={28}
      loading="lazy"
      onError={() => setAttempt((current) => current + 1)}
    />
  );
}
