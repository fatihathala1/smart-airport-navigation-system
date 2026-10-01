import * as THREE from "three";

export function getPreviewCameraPose(
  center: THREE.Vector3,
  size: THREE.Vector3,
  aspect: number,
  fieldOfView: number,
) {
  const safeAspect = Math.max(aspect, 0.5);
  const visibleFraction = safeAspect < 1.5 ? 0.43 : 0.32;
  const halfAngle = THREE.MathUtils.degToRad(fieldOfView * 0.5);
  const distance = Math.max(
    24,
    (size.x * visibleFraction * 1.12) / (2 * Math.tan(halfAngle) * safeAspect),
  );
  const target = center.clone().add(new THREE.Vector3(0, 0, -size.z * 0.12));
  const position = target.clone().add(
    new THREE.Vector3(0.24, 0.86, 0.45).normalize().multiplyScalar(distance),
  );
  return { position, target };
}
