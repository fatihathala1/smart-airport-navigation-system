export type GeographicPoint = {
  latitude: number;
  longitude: number;
};

export type ModelPoint = [x: number, z: number];

/**
 * Kalibrasi yang sama dengan scripts/build-exterior.mjs. Menyatukan koordinat
 * GPS, lingkungan OpenStreetMap, dan model Terminal 1 dalam satu bidang X/Z.
 */
export const T1_GEO_CALIBRATION = {
  origin: { longitude: 112.7953, latitude: -7.375 },
  rotationDeg: -9.2,
  scale: 0.81,
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

  const px = east - calibration.centroid[0];
  const pz = -north - calibration.centroid[1];
  const rotation = (calibration.rotationDeg * Math.PI) / 180;
  const cosine = Math.cos(rotation);
  const sine = Math.sin(rotation);

  return [
    (cosine * px - sine * pz) * calibration.scale + calibration.shift[0],
    (sine * px + cosine * pz) * calibration.scale + calibration.shift[1],
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
