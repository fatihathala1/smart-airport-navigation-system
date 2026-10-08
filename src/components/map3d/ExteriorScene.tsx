"use client";

import { useEffect, useMemo, useState } from "react";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import {
  centroid,
  extrudedPolygon,
  flatPolygon,
  merge,
  polygonArea,
  ribbon,
  type ExteriorData,
} from "@/lib/map3d/exterior-geometry";

export const EXTERIOR_DATA_URL = "/exterior/t1-exterior.json?v=20261007d";

/**
 * Lapisan datar digambar paling awal tanpa menulis depth. Dengan begitu lantai
 * terminal, gedung, dan garis rute selalu menimpa lapisan luar, tanpa
 * z-fighting walaupun kamera berada jauh.
 */
const LAYERS = {
  ground: { color: "#5b6d63", order: -20 },
  grass: { color: "#5d8165", order: -19 },
  water: { color: "#4a86a8", order: -19 },
  apron: { color: "#a8b2b8", order: -18 },
  taxiway: { color: "#b9c1c6", order: -17 },
  taxiwayMark: { color: "#e2b93b", order: -16 },
  parking: { color: "#8b989f", order: -15 },
  road: { color: "#4d5a63", order: -14 },
} as const;

const BUILDING_COLOR = "#cfc9bf";

/** Ketinggian lapisan relatif terhadap lantai terminal, dalam satuan model. */
const GROUND_OFFSET = -0.25;

function FlatLayer({ geometry, layer }: { geometry: THREE.BufferGeometry | null; layer: keyof typeof LAYERS }) {
  if (!geometry) return null;
  const { color, order } = LAYERS[layer];
  return (
    <mesh geometry={geometry} renderOrder={order} raycast={() => undefined}>
      <meshStandardMaterial color={color} roughness={1} metalness={0} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

type ExteriorSceneProps = {
  /** Ketinggian lantai dasar terminal. */
  baseY: number;
  visible: boolean;
  onAttribution?: (text: string | null) => void;
};

export function ExteriorScene({ baseY, visible, onAttribution }: ExteriorSceneProps) {
  const [data, setData] = useState<ExteriorData | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(EXTERIOR_DATA_URL, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((json: ExteriorData | null) => setData(json))
      .catch(() => setData(null));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    onAttribution?.(visible && data ? data.meta.attribution : null);
  }, [data, onAttribution, visible]);

  const layers = useMemo(() => {
    if (!data) return null;
    const y = baseY + GROUND_OFFSET;
    const byKind = (kind: string) => data.areas.filter((area) => area.kind === kind);
    const roads = data.lines.filter((line) => line.kind === "road");
    const taxiways = data.lines.filter((line) => line.kind === "taxiway");
    return {
      ground: merge([flatPolygon(data.ground, y)]),
      grass: merge(byKind("grass").map((area) => flatPolygon(area.points, y))),
      water: merge(byKind("water").map((area) => flatPolygon(area.points, y))),
      apron: merge(byKind("apron").map((area) => flatPolygon(area.points, y))),
      taxiway: merge(taxiways.map((line) => ribbon(line.points, line.width, y))),
      taxiwayMark: merge(taxiways.map((line) => ribbon(line.points, 0.35, y))),
      parking: merge(byKind("parking").map((area) => flatPolygon(area.points, y))),
      road: merge(roads.map((line) => ribbon(line.points, line.width, y))),
      buildings: merge(data.buildings.map((building) => extrudedPolygon(building.points, y, building.height))),
    };
  }, [baseY, data]);

  const labels = useMemo(() => {
    if (!data) return [];
    const parking = data.areas
      .filter((area) => area.kind === "parking" && polygonArea(area.points) > 400)
      .map((area) => ({ text: area.name ?? "Parkir", kind: "parking" as const, at: centroid(area.points) }));
    // Label gedung yang terlalu dekat dengan label parkir disembunyikan agar tidak bertumpuk.
    const buildings = data.buildings
      .filter((building) => building.name)
      .map((building) => ({ text: building.name as string, kind: "building" as const, at: centroid(building.points) }))
      .filter((label) => parking.every((other) => Math.hypot(other.at[0] - label.at[0], other.at[1] - label.at[1]) > 40));
    return [...parking, ...buildings];
  }, [data]);

  useEffect(() => () => {
    if (!layers) return;
    Object.values(layers).forEach((geometry) => geometry?.dispose());
  }, [layers]);

  if (!layers || !visible) return null;

  return (
    <group name="EXTERIOR_CONTEXT">
      <FlatLayer geometry={layers.ground} layer="ground" />
      <FlatLayer geometry={layers.grass} layer="grass" />
      <FlatLayer geometry={layers.water} layer="water" />
      <FlatLayer geometry={layers.apron} layer="apron" />
      <FlatLayer geometry={layers.taxiway} layer="taxiway" />
      <FlatLayer geometry={layers.taxiwayMark} layer="taxiwayMark" />
      <FlatLayer geometry={layers.parking} layer="parking" />
      <FlatLayer geometry={layers.road} layer="road" />
      {layers.buildings && (
        <mesh geometry={layers.buildings} raycast={() => undefined}>
          <meshStandardMaterial color={BUILDING_COLOR} roughness={0.95} metalness={0} />
        </mesh>
      )}
      {labels.map((label) => (
        <Html
          key={`${label.kind}-${label.text}-${label.at[0]}`}
          position={[label.at[0], baseY + 3, label.at[1]]}
          center
          zIndexRange={[20, 0]}
          style={{ pointerEvents: "none" }}
        >
          <span className={`exterior-label is-${label.kind}`}>
            {label.kind === "parking" && <b aria-hidden="true">P</b>}
            {label.text}
          </span>
        </Html>
      ))}
    </group>
  );
}
