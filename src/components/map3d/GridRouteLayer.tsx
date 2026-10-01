"use client";

import { Html, Line } from "@react-three/drei";
import type { RouteWorldPoint } from "@/lib/map3d/route-guidance";

type GridRouteLayerProps = {
  points: RouteWorldPoint[];
  highlightedPoints: RouteWorldPoint[];
  start: RouteWorldPoint | null;
  destination: RouteWorldPoint | null;
  visitorPosition: RouteWorldPoint | null;
};

export function GridRouteLayer({ points, highlightedPoints, start, destination, visitorPosition }: GridRouteLayerProps) {
  return (
    <group name="GEOMETRY_ROUTE_OVERLAY">
      {points.length >= 2 && (
        <>
          <Line points={points} color="#f7fbff" lineWidth={8} depthTest={false} depthWrite={false} renderOrder={28} raycast={() => undefined} />
          <Line points={points} color="#06a9e5" lineWidth={5} depthTest={false} depthWrite={false} renderOrder={29} raycast={() => undefined} />
        </>
      )}
      {highlightedPoints.length >= 2 && (
        <Line points={highlightedPoints} color="#f47b36" lineWidth={7} depthTest={false} depthWrite={false} renderOrder={30} raycast={() => undefined} />
      )}
      {start && (
        <group position={visitorPosition ?? start}>
          <mesh renderOrder={31} raycast={() => undefined}>
            <sphereGeometry args={[0.38, 12, 12]} />
            <meshBasicMaterial color="#16a36a" depthTest={false} depthWrite={false} toneMapped={false} />
          </mesh>
          <Html position={[0, 0.75, 0]} center zIndexRange={[40, 0]} style={{ pointerEvents: "none" }}>
            <span className="navigation-marker-label start-marker-label">TITIK AWAL</span>
          </Html>
        </group>
      )}
      {destination && (
        <group position={destination}>
          <mesh renderOrder={31} raycast={() => undefined}>
            <sphereGeometry args={[0.4, 12, 12]} />
            <meshBasicMaterial color="#ff5a36" depthTest={false} depthWrite={false} toneMapped={false} />
          </mesh>
          <Html position={[0, 0.75, 0]} center zIndexRange={[40, 0]} style={{ pointerEvents: "none" }}>
            <span className="navigation-marker-label destination-marker-label">TUJUAN</span>
          </Html>
        </group>
      )}
    </group>
  );
}
