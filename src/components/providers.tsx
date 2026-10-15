"use client";

import { SessionProvider } from "next-auth/react";

if (typeof window !== "undefined") {
  if (typeof Element !== "undefined") {
    const origRelease = Element.prototype.releasePointerCapture;
    if (origRelease) {
      Element.prototype.releasePointerCapture = function (pointerId: number) {
        try {
          if (typeof this.hasPointerCapture === "function" && !this.hasPointerCapture(pointerId)) {
            return;
          }
          origRelease.call(this, pointerId);
        } catch {}
      };
    }
  }
  window.addEventListener(
    "error",
    (event) => {
      if (event && event.message && event.message.includes("releasePointerCapture")) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}