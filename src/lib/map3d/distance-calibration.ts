/** Model-space axes are X (longitudinal), Y (height), Z (transverse). */
export type MetersPerModelUnit = readonly [x: number, y: number, z: number];

/**
 * Google Earth measurements supplied by the user, accepted as the reference.
 * Model endpoints were matched visually to the supplied screenshots, not surveyed.
 * These coordinates apply to the current t1-gabungan.glb export only.
 */
export const T1_DISTANCE_REFERENCES = {
  longitudinal: {
    meters: 648.57,
    // Left frontage at T1-GF-02.minX; right wall tembok_pilar_106.centerX.
    startX: -226.12233442572142,
    endX: 289.27855150820324,
  },
  transverse: {
    meters: 100.79,
    // Cross-section X=-50: area_visitor north edge to area_merah south edge.
    sectionX: -50,
    startZ: -39.035394100895246,
    endZ: 39.03525785908914,
  },
} as const;

const { longitudinal, transverse } = T1_DISTANCE_REFERENCES;

/** Height retains the existing floor-merge convention (3 units = 3 m). */
export const T1_METERS_PER_MODEL_UNIT: MetersPerModelUnit = [
  longitudinal.meters / (longitudinal.endX - longitudinal.startX),
  1,
  transverse.meters / (transverse.endZ - transverse.startZ),
];

export const T1_DISTANCE_CALIBRATION_ID = "t1-google-earth-648.57x100.79-v1";
