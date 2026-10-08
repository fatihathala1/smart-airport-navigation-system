"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { createAircraftParts, type AircraftStand } from "@/lib/map3d/aircraft";
import { EXTERIOR_GROUND_OFFSET } from "./ExteriorScene";

type ApronAircraftProps = {
  stands: AircraftStand[];
  /** Ketinggian lantai dasar terminal; apron berada sedikit di bawahnya. */
  groundY: number;
};

/** Pesawat terparkir di setiap stand garbarata. Hanya hiasan: tidak bisa diklik dan tidak menghalangi rute. */
export function ApronAircraft({ stands, groundY }: ApronAircraftProps) {
  const parts = useMemo(() => createAircraftParts(), []);
  const materials = useMemo(() => ({
    body: new THREE.MeshStandardMaterial({ color: "#f3f5f7", roughness: 0.55, metalness: 0.05 }),
    engine: new THREE.MeshStandardMaterial({ color: "#a3adb4", roughness: 0.45, metalness: 0.3 }),
    glass: new THREE.MeshStandardMaterial({ color: "#1f2b35", roughness: 0.25, metalness: 0.1 }),
    gear: new THREE.MeshStandardMaterial({ color: "#2f3439", roughness: 0.8, metalness: 0.1 }),
  }), []);
  const liveries = useMemo(() => {
    const byColor = new Map<string, THREE.MeshStandardMaterial>();
    for (const stand of stands) {
      if (!byColor.has(stand.livery)) byColor.set(stand.livery, new THREE.MeshStandardMaterial({ color: stand.livery, roughness: 0.5 }));
    }
    return byColor;
  }, [stands]);

  useEffect(() => () => Object.values(parts).forEach((geometry) => geometry.dispose()), [parts]);
  useEffect(() => () => Object.values(materials).forEach((material) => material.dispose()), [materials]);
  useEffect(() => () => liveries.forEach((material) => material.dispose()), [liveries]);

  const y = groundY + EXTERIOR_GROUND_OFFSET;
  return (
    <group name="APRON_AIRCRAFT">
      {stands.map((stand) => (
        <group key={stand.id} position={[stand.nose[0], y, stand.nose[1]]}>
          <mesh geometry={parts.body} material={materials.body} raycast={() => undefined} />
          <mesh geometry={parts.livery} material={liveries.get(stand.livery)} raycast={() => undefined} />
          <mesh geometry={parts.engine} material={materials.engine} raycast={() => undefined} />
          <mesh geometry={parts.glass} material={materials.glass} raycast={() => undefined} />
          <mesh geometry={parts.gear} material={materials.gear} raycast={() => undefined} />
        </group>
      ))}
    </group>
  );
}
