// Bump these immutable asset revisions whenever a new Blender/SVG export is
// placed in public. The query string avoids a browser reusing an older map
// during the configured public-asset cache lifetime.
export const GROUND_FLOOR_MODEL_URL =
  "/models/buildings-ground-floor.glb?v=buildings-ground-floor-v3-20261005";

/**
 * Lantai 1 dan Lantai 2 dalam satu file, hasil `node scripts/merge-floors.mjs`.
 * Naikkan versinya setiap kali file ini dibuat ulang.
 */
export const TERMINAL_MODEL_URL =
  "/models/t1-gabungan.glb?v=t1-gabungan-v1-20261008";

export const GROUND_FLOOR_NAVIGATION_URL =
  "/navigation/navigation-graph-ground-floor.svg?v=b34e7066";
