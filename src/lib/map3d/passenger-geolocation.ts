import { T1_METERS_PER_MODEL_UNIT } from "./distance-calibration";

export type GeographicPoint = {
  latitude: number;
  longitude: number;
};

export type ModelPoint = [x: number, z: number];

/**
 * Retain the geographic origin/heading from the exterior fit, but use the
 * accepted Google Earth distance calibration for movement along X/Z.
 */
export const T1_GEO_CALIBRATION = {
  origin: { longitude: 112.7953, latitude: -7.375 },
  rotationDeg: -9.2,
  // Original OSM fit is used only to preserve the existing model origin.
  anchorFitScale: 0.81,
  metersPerModelUnit: T1_METERS_PER_MODEL_UNIT,
  centroid: [-58.8628, -1.2603] as const,
  shift: [-47.5, 4.5] as const,
  /** Hindari menempelkan lokasi berbasis IP yang masih jauh dari Terminal 1. */
  maximumTerminalDistanceMeters: 1_200,
  /** Di atas nilai ini marker dapat berpindah ke koridor yang keliru. */
  maximumUsableAccuracyMeters: 150,
} as const;

const EARTH_RADIUS_METERS = 6_378_137;

export function distanceFromT1Origin(point: GeographicPoint) {
  const origin = T1_GEO_CALIBRATION.origin;
  const latitudeDelta = ((point.latitude - origin.latitude) * Math.PI) / 180;
  const longitudeDelta = ((point.longitude - origin.longitude) * Math.PI) / 180;
  const latitudeA = (origin.latitude * Math.PI) / 180;
  const latitudeB = (point.latitude * Math.PI) / 180;
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(latitudeA) * Math.cos(latitudeB) * Math.sin(longitudeDelta / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(haversine)));
}

export function geographicToT1Model(point: GeographicPoint): ModelPoint {
  const calibration = T1_GEO_CALIBRATION;
  const latitudeRadians = (calibration.origin.latitude * Math.PI) / 180;
  const east =
    ((point.longitude - calibration.origin.longitude) * Math.PI * EARTH_RADIUS_METERS *
      Math.cos(latitudeRadians)) /
    180;
  const north =
    ((point.latitude - calibration.origin.latitude) * Math.PI * EARTH_RADIUS_METERS) /
    180;

  const rotation = (calibration.rotationDeg * Math.PI) / 180;
  const cosine = Math.cos(rotation);
  const sine = Math.sin(rotation);
  const [cx, cz] = calibration.centroid;
  const originX = (-cosine * cx + sine * cz) * calibration.anchorFitScale + calibration.shift[0];
  const originZ = (-sine * cx - cosine * cz) * calibration.anchorFitScale + calibration.shift[1];

  return [
    originX + (cosine * east + sine * north) / calibration.metersPerModelUnit[0],
    originZ + (sine * east - cosine * north) / calibration.metersPerModelUnit[2],
  ];
}

export function isUsableT1Position(point: GeographicPoint, accuracyMeters: number) {
  return (
    Number.isFinite(point.latitude) &&
    Number.isFinite(point.longitude) &&
    Number.isFinite(accuracyMeters) &&
    accuracyMeters <= T1_GEO_CALIBRATION.maximumUsableAccuracyMeters &&
    distanceFromT1Origin(point) <= T1_GEO_CALIBRATION.maximumTerminalDistanceMeters
  );
}
