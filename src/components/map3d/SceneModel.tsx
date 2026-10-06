"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ThreeEvent } from "@react-three/fiber";
import { Html, useGLTF } from "@react-three/drei";
import { clone as cloneScene } from "three/examples/jsm/utils/SkeletonUtils.js";
import * as THREE from "three";
import {
  createSelectedObject,
  getObjectMetadata,
  getRuntimeMaterialStyle,
  type ObjectMetadata,
  type SelectedObject,
} from "@/lib/map3d/object-metadata";
import { GROUND_FLOOR_MODEL_URL } from "@/lib/map3d/assets";
import { defaultMapObjectConfig, readMapObjectConfigs, type MapObjectConfigByName, type MapObjectDoor } from "@/lib/map3d/admin-object-config";

// These meshes are duplicate wall/pillar geometry directly above the
// commercial frontage (T1-GF-41 through T1-GF-48) in the supplied export.
// The source GLB is left untouched; only their runtime visibility is disabled
// so the website matches the approved latest map composition.
const HIDDEN_COMMERCIAL_OVERHEAD_OBJECT =
  /^tembok_pilar_(?:31[0-9]|63[1-9]|640|358)$/i;

// These exported zone meshes are decorative overlays that make the 3D map
// visually noisy. Doors remain available; only the colored arrival/departure
// area surfaces and their outlines are hidden at runtime.
const HIDDEN_TERMINAL_ZONE_OBJECT =
  /^(?:keberangkatan|kedatangan)_|^(?:OUTLINE__)?ZONE_(?:DEPARTURE|KEBERANGKATAN|KEDATANGAN)_|^T1[-_]GF[-_]ZONE_(?:DEPARTURE|KEBERANGKATAN|KEDATANGAN)_/i;

export type SceneObjectRecord = {
  uuid: string;
  name: string;
  object: THREE.Object3D;
  metadata: ObjectMetadata;
  nodeIndex: number;
  selectable: boolean;
  selectableLabel?: string;
};

export type SceneBounds = {
  box: THREE.Box3;
  center: THREE.Vector3;
  size: THREE.Vector3;
  radius: number;
  colorCoverage: {
    renderMeshes: number;
    materialSlots: number;
    styledMaterialSlots: number;
    categories: Record<string, number>;
  };
  runtimeHiddenObjectNames: string[];
};

type SceneModelProps = {
  selectedUuid: string | null;
  onSelect: (selection: SelectedObject) => void;
  onSelectFloor?: (point: THREE.Vector3) => void;
  onSelectEntryPoint?: (point: THREE.Vector3, objectName: string, side: MapObjectDoor["side"]) => void;
  onReady: (bounds: SceneBounds, objects: SceneObjectRecord[]) => void;
  objectConfigs?: MapObjectConfigByName;
};

type ColorMaterial = THREE.Material & {
  color?: THREE.Color;
  emissive?: THREE.Color;
  emissiveIntensity?: number;
  map?: THREE.Texture | null;
  opacity: number;
  transparent: boolean;
  depthWrite: boolean;
  roughness?: number;
  metalness?: number;
};

type GltfAssociation = {
  nodes?: number;
};

type GltfNodeDefinition = {
  name?: string;
  mesh?: number;
};

let floorTileTexture: THREE.CanvasTexture | null = null;

function getFloorTileTexture() {
  if (floorTileTexture || typeof document === "undefined") {
    return floorTileTexture;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (!context) return null;

  context.fillStyle = "#FFFFFF";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = "#C4C9CC";
  context.lineWidth = 2;

  for (let offset = 0; offset <= canvas.width; offset += 32) {
    context.beginPath();
    context.moveTo(offset, 0);
    context.lineTo(offset, canvas.height);
    context.stroke();

    context.beginPath();
    context.moveTo(0, offset);
    context.lineTo(canvas.width, offset);
    context.stroke();
  }

  floorTileTexture = new THREE.CanvasTexture(canvas);
  floorTileTexture.colorSpace = THREE.SRGBColorSpace;
  floorTileTexture.wrapS = THREE.RepeatWrapping;
  floorTileTexture.wrapT = THREE.RepeatWrapping;
  floorTileTexture.repeat.set(18, 18);
  floorTileTexture.anisotropy = 8;
  floorTileTexture.needsUpdate = true;
  return floorTileTexture;
}

function tagSourceHierarchy(
  source: THREE.Object3D,
  runtime: THREE.Object3D,
  associations: Map<THREE.Object3D, GltfAssociation>,
  nodeDefinitions: GltfNodeDefinition[],
  inheritedName?: string,
  inheritedUuid?: string,
) {
  const association = associations.get(source);
  let logicalName = inheritedName;
  let logicalUuid = inheritedUuid;

  if (association?.nodes !== undefined) {
    const nodeIndex = association.nodes;
    logicalName = nodeDefinitions[nodeIndex]?.name || source.name;
    logicalUuid = runtime.uuid;
    runtime.name = logicalName;
    runtime.userData.gltfNodeIndex = nodeIndex;
  }

  if (logicalName && logicalUuid) {
    runtime.userData.sourceObjectName = logicalName;
    runtime.userData.logicalObjectUuid = logicalUuid;
  }

  source.children.forEach((sourceChild, index) => {
    const runtimeChild = runtime.children[index];
    if (!runtimeChild) return;
    tagSourceHierarchy(
      sourceChild,
      runtimeChild,
      associations,
      nodeDefinitions,
      logicalName,
      logicalUuid,
    );
  });
}

export function isSelectableBuildingName(objectName: string) {
  if (/ZONE_(?:DEPARTURE|KEBERANGKATAN|KEDATANGAN)/i.test(objectName)) return false;
  return /^(T1|TI)-GF-|^BAGGAGE[ _-](?:CLAIM[- _](?:A1|B[1-6])|WRAP[- _])|^DOOR__(?:KEBERANGKATAN|KEDATANGAN)_|^tembok[-_]pillar_?(?:5|6)$|^tembok_pilar_(?:42|43)$/i.test(objectName);
}

export function getSelectableLabel(objectName: string) {
  const normalized = objectName.toLocaleLowerCase("id-ID");
  const departureAnchor = {
    "tembok-pillar_6": "Departure 1",
    "tembok-pillar_5": "Departure 2",
    "tembok_pilar_43": "Departure 3",
    "tembok_pilar_42": "Departure 4",
  }[normalized];
  if (departureAnchor) return departureAnchor;
  return undefined;
}

function prepareRuntimeMaterial(material: THREE.Material, objectName: string) {
  const runtimeMaterial = material as ColorMaterial;
  const style = getRuntimeMaterialStyle(objectName, material.name);

  if (runtimeMaterial.color instanceof THREE.Color) {
    runtimeMaterial.color.set(style.color);
    runtimeMaterial.userData.baseColor = runtimeMaterial.color.getHex();
  }
  runtimeMaterial.opacity = style.opacity;
  runtimeMaterial.transparent = style.transparent;
  runtimeMaterial.depthWrite = !style.transparent;
  if (typeof runtimeMaterial.roughness === "number") {
    runtimeMaterial.roughness = style.roughness;
  }
  if (typeof runtimeMaterial.metalness === "number") {
    runtimeMaterial.metalness = style.metalness;
  }
  if (style.key === "visitor") {
    const tileTexture = getFloorTileTexture();
    if (tileTexture) runtimeMaterial.map = tileTexture;
  }
  runtimeMaterial.userData.runtimeColorKey = style.key;
  runtimeMaterial.userData.runtimeColor = style.color;

  if (runtimeMaterial.emissive instanceof THREE.Color) {
    runtimeMaterial.userData.baseEmissive = runtimeMaterial.emissive.getHex();
    runtimeMaterial.userData.baseEmissiveIntensity = runtimeMaterial.emissiveIntensity ?? 1;
  }

  runtimeMaterial.needsUpdate = true;
}

function updateSelectionMaterial(material: THREE.Material, selected: boolean) {
  const runtimeMaterial = material as ColorMaterial;
  const baseColor = runtimeMaterial.userData.baseColor;

  if (selected) {
    if (runtimeMaterial.emissive instanceof THREE.Color) {
      runtimeMaterial.emissive.set("#FF7A45");
      runtimeMaterial.emissiveIntensity = 0.38;
    } else if (
      runtimeMaterial.color instanceof THREE.Color &&
      typeof baseColor === "number"
    ) {
      runtimeMaterial.color
        .setHex(baseColor)
        .lerp(new THREE.Color("#FF7A45"), 0.42);
    }
  } else {
    if (runtimeMaterial.emissive instanceof THREE.Color) {
      runtimeMaterial.emissive.setHex(
        runtimeMaterial.userData.baseEmissive ?? 0x000000,
      );
      runtimeMaterial.emissiveIntensity =
        runtimeMaterial.userData.baseEmissiveIntensity ?? 1;
    }
    if (
      runtimeMaterial.color instanceof THREE.Color &&
      typeof baseColor === "number"
    ) {
      runtimeMaterial.color.setHex(baseColor);
    }
  }
}

export function SceneModel({ selectedUuid, onSelect, onSelectFloor, onSelectEntryPoint, onReady, objectConfigs = {} }: SceneModelProps) {
  const gltf = useGLTF(GROUND_FLOOR_MODEL_URL);
  const sourceScene = gltf.scene;
  const sourceParser = gltf.parser as typeof gltf.parser & {
    associations: Map<THREE.Object3D, GltfAssociation>;
    json: { nodes?: GltfNodeDefinition[] };
  };
  const [hovered, setHovered] = useState(false);
  const [storedObjectConfigs, setStoredObjectConfigs] = useState<MapObjectConfigByName>(() => readMapObjectConfigs());
  const pointerStart = useRef<{ x: number; y: number; button: number } | null>(null);
  const effectiveObjectConfigs = Object.keys(objectConfigs).length ? objectConfigs : storedObjectConfigs;

  useEffect(() => {
    const sync = () => setStoredObjectConfigs(readMapObjectConfigs());
    window.addEventListener("storage", sync);
    window.addEventListener("todjuanda-map-config-change", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("todjuanda-map-config-change", sync);
    };
  }, []);

  const model = useMemo(() => {
    const runtimeScene = cloneScene(sourceScene);
    const nodeDefinitions = sourceParser.json.nodes ?? [];

    tagSourceHierarchy(
      sourceScene,
      runtimeScene,
      sourceParser.associations,
      nodeDefinitions,
    );

    runtimeScene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;

      const sourceObjectName = object.userData.sourceObjectName || object.name;
      const objectConfig = effectiveObjectConfigs[sourceObjectName];
      if (HIDDEN_COMMERCIAL_OVERHEAD_OBJECT.test(sourceObjectName)) {
        object.visible = false;
        object.userData.runtimeVisibilityReason = "commercial-overhead-obstruction";
      }
      if (HIDDEN_TERMINAL_ZONE_OBJECT.test(sourceObjectName)) {
        object.visible = false;
        object.userData.runtimeVisibilityReason = "decorative-terminal-zone";
      }
      if (objectConfig?.occupancy === "WALKABLE") {
        object.visible = false;
        object.userData.runtimeVisibilityReason = "admin-configured-walkable";
      }
      const metadata = getObjectMetadata(sourceObjectName);
      const sourceMaterials = Array.isArray(object.material) ? object.material : [object.material];
      const runtimeMaterials = sourceMaterials.map((sourceMaterial) => {
        const runtimeMaterial = sourceMaterial.clone();
        prepareRuntimeMaterial(runtimeMaterial, sourceObjectName);
        if (objectConfig?.occupancy === "OBSTACLE") {
          const colorMaterial = runtimeMaterial as ColorMaterial;
          colorMaterial.color?.set("#68747C");
          colorMaterial.userData.baseColor = colorMaterial.color?.getHex();
          colorMaterial.userData.runtimeColorKey = "wall";
          colorMaterial.userData.runtimeColor = "#68747C";
        }
        if (objectConfig?.color && /^#[0-9a-f]{6}$/i.test(objectConfig.color)) {
          const colorMaterial = runtimeMaterial as ColorMaterial;
          colorMaterial.color?.set(objectConfig.color);
          colorMaterial.userData.baseColor = colorMaterial.color?.getHex();
          colorMaterial.userData.runtimeColor = objectConfig.color;
        }
        return runtimeMaterial;
      });

      object.material = Array.isArray(object.material) ? runtimeMaterials : runtimeMaterials[0];
      object.userData.runtimeCategory = metadata.key;
    });

    return runtimeScene;
  }, [sourceScene, sourceParser, effectiveObjectConfigs]);

  const selectedEntryObject = useMemo(() => {
    if (!selectedUuid) return null;
    return model.getObjectByProperty("uuid", selectedUuid) ?? null;
  }, [model, selectedUuid]);

  const selectedEntryObjectName = selectedEntryObject?.userData.sourceObjectName || selectedEntryObject?.name || "";
  const selectedEntryDoors = selectedEntryObject
    ? effectiveObjectConfigs[selectedEntryObjectName]?.entryDoors ?? defaultMapObjectConfig(selectedEntryObjectName).entryDoors
    : undefined;

  useLayoutEffect(() => {
    model.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const radius = Math.max(box.getBoundingSphere(new THREE.Sphere()).radius, 0.001);
    const objects: SceneObjectRecord[] = [];
    const colorCoverage: SceneBounds["colorCoverage"] = {
      renderMeshes: 0,
      materialSlots: 0,
      styledMaterialSlots: 0,
      categories: {},
    };
    const runtimeHiddenObjectNames: string[] = [];
    const nodeDefinitions = sourceParser.json.nodes ?? [];

    model.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (
          object.userData.runtimeVisibilityReason ===
          "commercial-overhead-obstruction" ||
          object.userData.runtimeVisibilityReason === "decorative-terminal-zone" ||
          object.userData.runtimeVisibilityReason === "admin-configured-walkable"
        ) {
          runtimeHiddenObjectNames.push(
            object.userData.sourceObjectName || object.name,
          );
        }
        colorCoverage.renderMeshes += 1;
        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material];
        for (const material of materials) {
          colorCoverage.materialSlots += 1;
          const colorKey = material.userData.runtimeColorKey;
          if (typeof colorKey !== "string") continue;
          colorCoverage.styledMaterialSlots += 1;
          colorCoverage.categories[colorKey] =
            (colorCoverage.categories[colorKey] ?? 0) + 1;
        }
      }
      const nodeIndex = object.userData.gltfNodeIndex;
      if (typeof nodeIndex !== "number" || nodeDefinitions[nodeIndex]?.mesh === undefined) return;
      const sourceObjectName = object.userData.sourceObjectName || object.name;
      objects.push({
        uuid: object.uuid,
        name: sourceObjectName,
        object,
        metadata: getObjectMetadata(sourceObjectName),
        nodeIndex,
        selectable: isSelectableBuildingName(sourceObjectName),
        selectableLabel: getSelectableLabel(sourceObjectName),
      });
    });

    objects.sort((a, b) => a.nodeIndex - b.nodeIndex);
    onReady(
      {
        box,
        center,
        size,
        radius,
        colorCoverage,
        runtimeHiddenObjectNames,
      },
      objects,
    );
  }, [sourceParser, model, onReady]);

  useLayoutEffect(() => {
    model.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) =>
        updateSelectionMaterial(material, object.userData.logicalObjectUuid === selectedUuid),
      );
    });
  }, [model, selectedUuid]);

  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "default";
    return () => {
      document.body.style.cursor = "default";
    };
  }, [hovered]);

  const handlePointerUp = (event: ThreeEvent<PointerEvent>) => {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (!start || start.button !== 0 || event.button !== 0) return;
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 5) return;

    event.stopPropagation();
    if (event.object instanceof THREE.Mesh) {
      let logicalObject: THREE.Object3D | null = event.object;
      while (
        logicalObject &&
        typeof logicalObject.userData.gltfNodeIndex !== "number" &&
        logicalObject !== model
      ) {
        logicalObject = logicalObject.parent;
      }
      const selectedObject = logicalObject || event.object;
      const sourceName =
        selectedObject.userData.sourceObjectName || selectedObject.name;
      if (isSelectableBuildingName(sourceName)) {
        onSelect(createSelectedObject(selectedObject));
      } else if (/^(?:FLOOR__)?area_visitor$/i.test(sourceName)) {
        onSelectFloor?.(event.point.clone());
      }
    }
  };

  return (
    <>
      <primitive
        object={model}
        dispose={null}
        onPointerDown={(event: ThreeEvent<PointerEvent>) => {
        pointerStart.current = {
          x: event.clientX,
          y: event.clientY,
          button: event.button,
        };
        }}
        onPointerUp={handlePointerUp}
        onPointerOver={(event: ThreeEvent<PointerEvent>) => {
        let logicalObject: THREE.Object3D | null = event.object;
        while (
          logicalObject &&
          typeof logicalObject.userData.gltfNodeIndex !== "number" &&
          logicalObject !== model
        ) {
          logicalObject = logicalObject.parent;
        }
        const sourceName =
          logicalObject?.userData.sourceObjectName || logicalObject?.name || "";
        if (isSelectableBuildingName(sourceName) || (onSelectFloor && /^(?:FLOOR__)?area_visitor$/i.test(sourceName))) {
          event.stopPropagation();
          setHovered(true);
        }
        }}
        onPointerOut={() => setHovered(false)}
        onPointerCancel={() => {
          pointerStart.current = null;
        }}
      />
      {selectedEntryObject && selectedEntryDoors && !/^DOOR__/i.test(selectedEntryObjectName) && <EntryDoorMarkers object={selectedEntryObject} objectName={selectedEntryObjectName} doors={selectedEntryDoors} onSelect={onSelectEntryPoint} />}
    </>
  );
}

function EntryDoorMarkers({ object, objectName, doors, onSelect }: { object: THREE.Object3D; objectName: string; doors: MapObjectDoor[]; onSelect?: SceneModelProps["onSelectEntryPoint"] }) {
  const box = new THREE.Box3().setFromObject(object);
  const width = Math.max(box.max.x - box.min.x, 0.6);
  const depth = Math.max(box.max.z - box.min.z, 0.6);
  const y = box.min.y + 0.85;
  const labels: Record<MapObjectDoor["side"], string> = { NORTH: "U", EAST: "T", SOUTH: "S", WEST: "B" };
  return <group>
    {doors.slice(0, 4).map((door, index) => {
      const ratio = Math.max(0, Math.min(100, door.position ?? 50)) / 100;
      const point = door.side === "NORTH" ? new THREE.Vector3(box.min.x + width * ratio, y, box.min.z - 0.2)
        : door.side === "SOUTH" ? new THREE.Vector3(box.min.x + width * ratio, y, box.max.z + 0.2)
          : door.side === "WEST" ? new THREE.Vector3(box.min.x - 0.2, y, box.min.z + depth * ratio)
            : new THREE.Vector3(box.max.x + 0.2, y, box.min.z + depth * ratio);
      return <group key={`${objectName}-entry-door-${index}`} position={point}>
        <mesh renderOrder={1000} onPointerUp={(event) => { event.stopPropagation(); if (door.open) onSelect?.(point.clone(), objectName, door.side); }}>
          <sphereGeometry args={[Math.max(Math.min(width, depth) * 0.045, 0.3), 20, 12]} />
          <meshBasicMaterial color={door.open ? "#16C784" : "#E05252"} depthTest={false} depthWrite={false} />
        </mesh>
        <Html center distanceFactor={8} style={{ pointerEvents: "none" }}><span className={`map-door-marker-label${door.open ? " is-open" : " is-closed"}`}>{labels[door.side]} {door.open ? "Pintu" : "Tutup"}</span></Html>
      </group>;
    })}
  </group>;
}

useGLTF.preload(GROUND_FLOOR_MODEL_URL);
