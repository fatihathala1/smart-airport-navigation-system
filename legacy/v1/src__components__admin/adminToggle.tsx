"use client";

import { useMapStore } from "@/store/mapStore";

export default function AdminToggle() {
  const mapMode    = useMapStore((s) => s.mapMode);
  const setMapMode = useMapStore((s) => s.setMapMode);

  const isAdmin = mapMode === "admin";

  function handleToggle() {
    setMapMode(isAdmin ? "view" : "admin");
  }

  return (
    <button
      onClick={handleToggle}
      className={[
        "flex items-center gap-3 px-4 py-2",
        "rounded-full border",
        "bg-white shadow-sm",
        "transition-all duration-200",
        isAdmin
          ? "border-blue-300 shadow-blue-100"
          : "border-gray-200",
      ].join(" ")}
    >
      <span
        className={[
          "text-sm font-medium",
          isAdmin ? "text-blue-600" : "text-gray-500",
        ].join(" ")}
      >
        Admin Mode
      </span>

      {/* Toggle pill */}
      <div
        className={[
          "relative w-11 h-6 rounded-full transition-colors duration-200",
          isAdmin ? "bg-blue-500" : "bg-gray-300",
        ].join(" ")}
      >
        <div
          className={[
            "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow",
            "transition-transform duration-200",
            isAdmin ? "translate-x-5" : "translate-x-0.5",
          ].join(" ")}
        />
      </div>
    </button>
  );
}