export function getMapOrbitLimits() {
  return {
    minPolarAngle: 0,
    maxPolarAngle: (75 * Math.PI) / 180,
    screenSpacePanning: false,
  };
}
