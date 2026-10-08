"use client";

import {
  forwardRef,
  Suspense,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useProgress } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  Box,
  ChevronRight,
  MapPin,
  Minus,
  Plus,
  RotateCcw,
  Search,
  Trees,
  X,
} from "lucide-react";
import * as THREE from "three";
import { PassengerRoadmap } from "./PassengerRoadmap";
import { FloorSwitcher } from "./FloorSwitcher";
import { ExteriorScene } from "./ExteriorScene";
import { ApronAircraft } from "./ApronAircraft";
import { findAircraftStands } from "@/lib/map3d/aircraft";
import { FLOOR_LABELS, FLOOR_ORDER, floorViewLabel, type FloorId, type FloorView } from "@/lib/map3d/floors";
import { TERMINAL_MODEL_URL } from "@/lib/map3d/assets";
import {
  SceneModel,
  getSelectableLabel,
  type SceneBounds,
  type SceneObjectRecord,
} from "@/components/map3d/SceneModel";
import { GridRouteLayer } from "@/components/map3d/GridRouteLayer";
import { RoutePlaybackController } from "@/components/map3d/RoutePlaybackController";
import {
  createPlaybackSnapshot,
  createRouteMetrics,
  type RouteWorldPoint,
  type RoutePlaybackSnapshot,
} from "@/lib/map3d/route-guidance";
import { createRouteSteps } from "@/lib/map3d/route-steps";
import {
  createSelectedObject,
  type SelectedObject,
} from "@/lib/map3d/object-metadata";
import { getMapOrbitLimits } from "@/lib/map3d/map-camera";
import { isMapModelLoading } from "@/lib/map3d/loading-state";
import {
  createFloorNavigation,
  findFloorRoute,
  floorAtHeight,
  placeElevation,
  snapPlace,
  type FloorNavigation,
  type FloorTransition,
  type RoutePlace,
} from "@/lib/map3d/multi-floor-route";
import { defaultMapObjectConfig, getMapObjectPhotoUrl, readMapObjectConfigs, type MapObjectConfig } from "@/lib/map3d/admin-object-config";

type ViewerApi = {
  resetView: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  focusObject: (object: THREE.Object3D) => void;
  focusPoint: (point: THREE.Vector3) => void;
  focusRoute: (points: THREE.Vector3[]) => void;
  visitorPov: (point: THREE.Vector3, direction: THREE.Vector3) => void;
};

type CameraMode = "map" | "pov";

const CameraController = forwardRef<
  ViewerApi,
  { bounds: SceneBounds | null; viewMode: CameraMode }
>(function CameraController({ bounds, viewMode }, ref) {
    const { camera, invalidate, size: viewportSize } = useThree();
    const controlsRef = useRef<OrbitControlsImpl>(null);

    const getFitDistance = useCallback(
      (box: THREE.Box3, viewDirection: THREE.Vector3, margin: number) => {
        if (!(camera instanceof THREE.PerspectiveCamera)) return 1;
        const center = box.getCenter(new THREE.Vector3());
        const direction = viewDirection.clone().normalize();
        const forward = direction.clone().multiplyScalar(-1);
        const right = forward.clone().cross(camera.up).normalize();
        const viewUp = right.clone().cross(forward).normalize();
        const tanVertical = Math.tan(
          THREE.MathUtils.degToRad(camera.fov * 0.5),
        );
        const aspect = viewportSize.width / Math.max(viewportSize.height, 1);
        const tanHorizontal = tanVertical * aspect;
        let requiredDistance = 0;

        for (const x of [box.min.x, box.max.x]) {
          for (const y of [box.min.y, box.max.y]) {
            for (const z of [box.min.z, box.max.z]) {
              const relative = new THREE.Vector3(x, y, z).sub(center);
              const outwardDepth = relative.dot(direction);
              const horizontal = Math.abs(relative.dot(right));
              const vertical = Math.abs(relative.dot(viewUp));
              requiredDistance = Math.max(
                requiredDistance,
                outwardDepth + horizontal / tanHorizontal,
                outwardDepth + vertical / tanVertical,
              );
            }
          }
        }
        return Math.max(requiredDistance * margin, 0.01);
      },
      [camera, viewportSize.height, viewportSize.width],
    );

    const fitView = useCallback(() => {
      if (
        !bounds ||
        !(camera instanceof THREE.PerspectiveCamera) ||
        !controlsRef.current
      ) {
        return;
      }
      const direction = new THREE.Vector3(0, 1, 0.55).normalize();
      const distance = getFitDistance(bounds.box, direction, 1.1);
      camera.position.copy(bounds.center).add(direction.multiplyScalar(distance));
      controlsRef.current.target.copy(bounds.center);
      controlsRef.current.minDistance = Math.max(bounds.radius * 0.015, 0.01);
      controlsRef.current.maxDistance = Math.max(bounds.radius * 12, 100);
      controlsRef.current.update();
      invalidate();
    }, [bounds, camera, getFitDistance, invalidate]);

    const zoomBy = useCallback(
      (factor: number) => {
        if (!controlsRef.current) return;
        const target = controlsRef.current.target;
        const offset = camera.position.clone().sub(target);
        const nextDistance = THREE.MathUtils.clamp(
          offset.length() * factor,
          controlsRef.current.minDistance,
          controlsRef.current.maxDistance,
        );
        camera.position
          .copy(target)
          .add(offset.normalize().multiplyScalar(nextDistance));
        controlsRef.current.update();
        invalidate();
      },
      [camera, invalidate],
    );

    const focusObject = useCallback(
      (object: THREE.Object3D) => {
        if (
          !controlsRef.current ||
          !(camera instanceof THREE.PerspectiveCamera)
        ) {
          return;
        }
        object.updateWorldMatrix(true, false);
        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        const direction = camera.position
          .clone()
          .sub(controlsRef.current.target)
          .normalize();
        const minFocusDistance = bounds ? bounds.radius * 0.025 : 1;
        const distance = Math.max(
          getFitDistance(box, direction, 1.5),
          minFocusDistance,
        );
        controlsRef.current.target.copy(center);
        camera.position.copy(center).add(direction.multiplyScalar(distance));
        controlsRef.current.update();
        invalidate();
      },
      [bounds, camera, getFitDistance, invalidate],
    );

    const focusPoint = useCallback(
      (point: THREE.Vector3) => {
        if (!controlsRef.current || !(camera instanceof THREE.PerspectiveCamera)) {
          return;
        }
        const direction = new THREE.Vector3(0, 1, 0.62).normalize();
        const distance = Math.max(bounds ? bounds.radius * 0.1 : 12, 8);
        controlsRef.current.target.copy(point);
        camera.position.copy(point).add(direction.multiplyScalar(distance));
        controlsRef.current.update();
        invalidate();
      },
      [bounds, camera, invalidate],
    );

    const focusRoute = useCallback(
      (points: THREE.Vector3[]) => {
        if (
          !points.length ||
          !controlsRef.current ||
          !(camera instanceof THREE.PerspectiveCamera)
        ) {
          return;
        }
        const box = new THREE.Box3().setFromPoints(points);
        box.expandByVector(new THREE.Vector3(2, 2.5, 2));
        const center = box.getCenter(new THREE.Vector3());
        const direction = new THREE.Vector3(0, 1, 0.68).normalize();
        const minimumDistance = bounds ? bounds.radius * 0.04 : 8;
        const distance = Math.max(
          getFitDistance(box, direction, 1.28),
          minimumDistance,
        );
        controlsRef.current.target.copy(center);
        camera.position.copy(center).add(direction.multiplyScalar(distance));
        controlsRef.current.update();
        invalidate();
      },
      [bounds, camera, getFitDistance, invalidate],
    );

    const visitorPov = useCallback(
      (point: THREE.Vector3, direction: THREE.Vector3) => {
        if (!controlsRef.current || !(camera instanceof THREE.PerspectiveCamera)) {
          return;
        }
        const forward = direction.clone();
        forward.y = 0;
        if (forward.lengthSq() < 0.0001) forward.set(0, 0, 1);
        forward.normalize();
        const eye = point.clone();
        eye.y = Math.max(point.y + 1.53, 1.65);
        const target = eye.clone().add(forward.multiplyScalar(8));
        camera.position.copy(eye);
        controlsRef.current.target.copy(target);
        controlsRef.current.update();
        camera.lookAt(target);
        invalidate();
      },
      [camera, invalidate],
    );

    useEffect(() => {
      fitView();
    }, [fitView]);

    useImperativeHandle(
      ref,
      () => ({
        resetView: fitView,
        zoomIn: () => zoomBy(0.78),
        zoomOut: () => zoomBy(1.28),
        focusObject,
        focusPoint,
        focusRoute,
        visitorPov,
      }),
      [fitView, focusObject, focusPoint, focusRoute, visitorPov, zoomBy],
    );

    return (
      <OrbitControls
        ref={controlsRef}
        makeDefault
        {...getMapOrbitLimits()}
        enabled={viewMode === "map"}
        enableDamping
        dampingFactor={0.08}
        enablePan
        enableRotate
        enableZoom
        panSpeed={1.15}
        rotateSpeed={0.5}
        zoomSpeed={0.9}
        mouseButtons={{
          LEFT: THREE.MOUSE.PAN,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.ROTATE,
        }}
        touches={{
          ONE: THREE.TOUCH.PAN,
          TWO: THREE.TOUCH.DOLLY_PAN,
        }}
      />
    );
  },
);

function LoadingOverlay({ modelReady }: { modelReady: boolean }) {
  const { progress } = useProgress();
  if (!isMapModelLoading(modelReady)) return null;
  return (
    <div className="loading-overlay" aria-live="polite">
      <div className="loader-mark">
        <Box size={22} strokeWidth={1.6} />
      </div>
      <div className="loader-copy">
        <span>MEMUAT MODEL LANTAI</span>
        <strong>{Math.round(progress)}%</strong>
      </div>
      <div className="loader-track">
        <div style={{ width: progress + "%" }} />
      </div>
    </div>
  );
}

/** Objek yang menjadi tujuan rute: kotak pembatasnya pada bidang XZ. */
function recordRect(record: SceneObjectRecord) {
  record.object.updateWorldMatrix(true, false);
  const box = new THREE.Box3().setFromObject(record.object);
  return { minX: box.min.x, maxX: box.max.x, minZ: box.min.z, maxZ: box.max.z };
}

function recordCenter(record: SceneObjectRecord): RoutePlace {
  const rect = recordRect(record);
  return { floor: record.floor, point: [(rect.minX + rect.maxX) / 2, (rect.minZ + rect.maxZ) / 2] };
}

const DEPARTURE_ENTRANCE = /^DOOR__Keberangkatan_/i;

const GATE_OBJECT = /^T1-FF-GATE-(\d+)$/i;

/** Nama pintu masuk untuk ditampilkan: `DOOR__Keberangkatan_1A_4` → `Pintu Keberangkatan 1A`. */
function entranceLabel(name: string) {
  return `Pintu ${name.replace(DEPARTURE_ENTRANCE, "Keberangkatan ").replace(/_\d+$/, "")}`;
}

export function AirportWayfinding() {
  const viewerApi = useRef<ViewerApi>(null);
  const [bounds, setBounds] = useState<SceneBounds | null>(null);
  const [objects, setObjects] = useState<SceneObjectRecord[]>([]);
  const [selected, setSelected] = useState<SelectedObject | null>(null);
  const [mapObjectConfigs, setMapObjectConfigs] = useState<Record<string, MapObjectConfig>>({});
  const [query, setQuery] = useState(() =>
    typeof window === "undefined"
      ? ""
      : new URLSearchParams(window.location.search).get("q")?.trim() ?? "",
  );
  const [searchFocused, setSearchFocused] = useState(() =>
    typeof window !== "undefined" && Boolean(new URLSearchParams(window.location.search).get("q")?.trim()),
  );
  const [navigation, setNavigation] = useState<FloorNavigation | null>(null);
  const [gridError, setGridError] = useState<string | null>(null);
  const [startPoint, setStartPoint] = useState<RoutePlace | null>(null);
  const [destinationPoint, setDestinationPoint] = useState<RoutePlace | null>(null);
  const [startName, setStartName] = useState<string | null>(null);
  const [destinationName, setDestinationName] = useState<string | null>(null);
  const [routeWorldPoints, setRouteWorldPoints] = useState<RouteWorldPoint[]>([]);
  const [routeTransitions, setRouteTransitions] = useState<FloorTransition[]>([]);
  const [routePointFloors, setRoutePointFloors] = useState<FloorId[]>([]);
  const [routeMessage, setRouteMessage] = useState("Pilih posisi awal terlebih dahulu.");
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [selectingStart, setSelectingStart] = useState(false);
  const [viewMode, setViewMode] = useState<CameraMode>("map");
  const [routePaused, setRoutePaused] = useState(false);
  const [routeProgress, setRouteProgress] =
    useState<RoutePlaybackSnapshot | null>(null);
  const [routeRestartToken, setRouteRestartToken] = useState(0);
  const [routeRecenterToken, setRouteRecenterToken] = useState(0);
  const [floorView, setFloorView] = useState<FloorView>("ALL");
  const [showExterior, setShowExterior] = useState(true);
  const [exteriorAttribution, setExteriorAttribution] = useState<string | null>(null);
  useEffect(() => {
    const sync = () => setMapObjectConfigs(readMapObjectConfigs());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("todjuanda-map-config-change", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("todjuanda-map-config-change", sync);
    };
  }, []);
  const selectedLocationConfig = useMemo(
    () => selected ? mapObjectConfigs[selected.name] ?? defaultMapObjectConfig(selected.name) : null,
    [mapObjectConfigs, selected],
  );
  const handleReady = useCallback(
    (nextBounds: SceneBounds, nextObjects: SceneObjectRecord[]) => {
      setBounds(nextBounds);
      setObjects(nextObjects);
      try {
        setNavigation(createFloorNavigation(nextObjects));
        setGridError(null);
      } catch (error) {
        setNavigation(null);
        setGridError(error instanceof Error ? error.message : "Area jalan dari model GLB tidak dapat diproses.");
      }
    },
    [],
  );

  const modelFloors = useMemo(
    () => FLOOR_ORDER.filter((floor) => objects.some((record) => record.floor === floor)),
    [objects],
  );
  const multiFloor = modelFloors.length > 1;

  const selectableBuildings = useMemo(
    () => objects.filter((record) => record.selectable),
    [objects],
  );

  const gateRecords = useMemo(() => {
    const gates = new Map<number, SceneObjectRecord>();
    for (const record of objects) {
      const match = GATE_OBJECT.exec(record.name);
      if (match) gates.set(Number(match[1]), record);
    }
    return gates;
  }, [objects]);
  const gateNumbers = useMemo(() => [...gateRecords.keys()].sort((left, right) => left - right), [gateRecords]);

  const routeMetrics = useMemo(
    () => createRouteMetrics(routeWorldPoints),
    [routeWorldPoints],
  );
  const routeSessionActive = Boolean(routeMetrics);
  const routeSteps = useMemo(
    () => routeMetrics
      ? createRouteSteps(routeMetrics, routeTransitions.map((transition) => ({
        index: transition.index,
        direction: FLOOR_ORDER.indexOf(transition.to) > FLOOR_ORDER.indexOf(transition.from) ? "up" : "down",
        label: transition.label,
      })))
      : [],
    [routeMetrics, routeTransitions],
  );
  const activeStep = routeSteps[activeStepIndex] ?? null;
  const visibleRouteProgress = useMemo(
    () =>
      routeProgress ??
      (routeMetrics ? createPlaybackSnapshot(routeMetrics, 0) : null),
    [routeMetrics, routeProgress],
  );

  // Saat simulasi berjalan dengan satu lantai terpilih, peta mengikuti lantai
  // tempat pengunjung berada tanpa mengubah pilihan pengguna.
  const playbackFloor = viewMode === "pov" && routeProgress && navigation ? floorAtHeight(navigation, routeProgress.position[1]) : null;
  const shownFloorView: FloorView = playbackFloor && floorView !== "ALL" ? playbackFloor : floorView;
  const highlightedPoints = useMemo(
    () => activeStep
      ? routeWorldPoints.slice(activeStep.startIndex, activeStep.kind === "arrive" ? activeStep.startIndex + 1 : activeStep.endIndex + 1)
      : [],
    [activeStep, routeWorldPoints],
  );

  const clearRoute = useCallback(() => {
    setRouteWorldPoints([]);
    setRouteTransitions([]);
    setRoutePointFloors([]);
    setDestinationPoint(null);
    setDestinationName(null);
    setActiveStepIndex(0);
    setRouteProgress(null);
    setRoutePaused(false);
  }, []);

  const commitStartPoint = useCallback(
    (place: RoutePlace, name: string) => {
      if (!navigation) return;
      const snapped = snapPlace(navigation, place);
      if (!snapped) {
        setRouteMessage("Tidak ada area jalan yang valid di dekat titik awal.");
        return;
      }
      setStartPoint(snapped);
      setStartName(name);
      clearRoute();
      setRouteMessage("Titik awal berada di area jalan terdekat. Pilih tujuan.");
      setSelectingStart(false);
      setViewMode("map");
      // Titik awal di lantai yang sedang disembunyikan tetap harus terlihat.
      setFloorView((view) => view === "ALL" || view === snapped.floor ? view : snapped.floor);
      viewerApi.current?.focusPoint(new THREE.Vector3(snapped.point[0], placeElevation(navigation, snapped), snapped.point[1]));
    },
    [clearRoute, navigation],
  );

  const chooseEntryPoint = useCallback(
    (point: THREE.Vector3, objectName: string, side: "NORTH" | "EAST" | "SOUTH" | "WEST") => {
      if (!navigation) return;
      commitStartPoint({ floor: floorAtHeight(navigation, point.y), point: [point.x, point.z] }, `${objectName} · Pintu ${side}`);
    },
    [commitStartPoint, navigation],
  );

  const setBuildingAsStart = useCallback(
    (record: SceneObjectRecord) => {
      setSelected(createSelectedObject(record.object));
      commitStartPoint(recordCenter(record), record.selectableLabel ?? record.name);
    },
    [commitStartPoint],
  );

  /**
   * Hitung rute dari `start` ke sebuah objek, di lantai yang sama atau lewat
   * eskalator/tangga. Dipakai oleh pencarian, klik peta, dan panduan penumpang.
   */
  const planRoute = useCallback(
    (start: RoutePlace, record: SceneObjectRecord) => {
      if (!navigation) return false;
      const objectConfig = mapObjectConfigs[record.name] ?? defaultMapObjectConfig(record.name);
      const route = findFloorRoute(navigation, start, {
        floor: record.floor,
        rect: recordRect(record),
        entryDoors: objectConfig.entryDoors,
      });
      const label = record.selectableLabel ?? record.name;
      setRouteProgress(null);
      setRoutePaused(false);
      setActiveStepIndex(0);
      setViewMode("map");
      if (!route) {
        setRouteWorldPoints([]);
        setRouteTransitions([]);
        setRoutePointFloors([]);
        setDestinationPoint(null);
        setDestinationName(label);
        setRouteMessage(start.floor === record.floor
          ? "Tidak ditemukan jalur aman pada lantai ini. Coba titik awal atau tujuan lain."
          : "Tidak ditemukan jalur lewat eskalator atau tangga menuju lantai tujuan.");
        return false;
      }

      const end = route.points.at(-1);
      setRouteWorldPoints(route.points);
      setRouteTransitions(route.transitions);
      setRoutePointFloors(route.pointFloors);
      setDestinationPoint(end ? { floor: record.floor, point: [end[0], end[2]] } : null);
      setDestinationName(label);
      setRouteMessage(route.transitions.length
        ? `Rute melewati ${route.transitions.map((transition) => transition.label.toLocaleLowerCase("id-ID")).join(", ")}.`
        : "Rute terdekat menghindari tembok dan pilar, melalui bukaan pintu yang ada pada model.");
      setSelected(createSelectedObject(record.object));
      // Mulai dari lantai titik awal. Lantai lain disembunyikan agar rute tidak
      // tertutup pelat lantai di atasnya.
      if (multiFloor) setFloorView(start.floor);
      return true;
    },
    [mapObjectConfigs, multiFloor, navigation],
  );

  const calculateRoute = useCallback(
    (record: SceneObjectRecord) => {
      if (!startPoint || !navigation) {
        setRouteMessage("Pilih posisi awal terlebih dahulu.");
        return;
      }
      planRoute(startPoint, record);
    },
    [navigation, planRoute, startPoint],
  );

  /** Pintu masuk keberangkatan terdekat ke sebuah objek, sebagai titik awal penumpang. */
  const nearestEntrance = useCallback(
    (record: SceneObjectRecord) => {
      const target = recordCenter(record).point;
      let best: { record: SceneObjectRecord; distance: number } | null = null;
      for (const entrance of objects) {
        if (!DEPARTURE_ENTRANCE.test(entrance.name)) continue;
        const [x, z] = recordCenter(entrance).point;
        const distance = Math.hypot(x - target[0], z - target[1]);
        if (!best || distance < best.distance) best = { record: entrance, distance };
      }
      return best?.record ?? null;
    },
    [objects],
  );

  const startPassengerRoute = useCallback(
    (from: SceneObjectRecord, fromName: string, to: SceneObjectRecord) => {
      if (!navigation) return;
      const start = snapPlace(navigation, recordCenter(from));
      if (!start) {
        setRouteMessage(`Tidak ada area jalan di dekat ${fromName}.`);
        return;
      }
      setSelectingStart(false);
      setQuery("");
      setStartPoint(start);
      setStartName(fromName);
      planRoute(start, to);
    },
    [navigation, planRoute],
  );

  const routeToDeparture = useCallback(
    (departure: number) => {
      const target = objects.find((record) => record.selectableLabel === `Departure ${departure}`);
      if (!target) {
        setRouteMessage(`Area Departure ${departure} belum ditandai pada peta.`);
        return;
      }
      const entrance = nearestEntrance(target);
      if (!entrance) {
        setRouteMessage("Pintu masuk keberangkatan belum ditandai pada peta.");
        return;
      }
      startPassengerRoute(entrance, entranceLabel(entrance.name), target);
    },
    [nearestEntrance, objects, startPassengerRoute],
  );

  const routeToGate = useCallback(
    (gate: number, departure: number | null) => {
      const target = gateRecords.get(gate);
      if (!target) {
        setRouteMessage(`Gate ${gate} tidak ada pada peta Lantai 2.`);
        return;
      }
      const checkIn = departure === null ? null : objects.find((record) => record.selectableLabel === `Departure ${departure}`);
      if (checkIn) {
        startPassengerRoute(checkIn, `Departure ${departure}`, target);
        return;
      }
      if (startPoint) {
        planRoute(startPoint, target);
        return;
      }
      const entrance = nearestEntrance(target);
      if (entrance) startPassengerRoute(entrance, entranceLabel(entrance.name), target);
    },
    [gateRecords, nearestEntrance, objects, planRoute, startPassengerRoute, startPoint],
  );

  const handleSelect = useCallback(
    (selection: SelectedObject) => {
      const record = objects.find((item) => item.uuid === selection.uuid);
      if (selectingStart && record) {
        setBuildingAsStart(record);
        return;
      }
      if (!record) return;
      if (startPoint) calculateRoute(record);
      else setBuildingAsStart(record);
    },
    [calculateRoute, objects, selectingStart, setBuildingAsStart, startPoint],
  );

  const searchResults = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("id-ID");
    if (!normalizedQuery) return [];
    return selectableBuildings
      .filter((item) => {
        const displayName = mapObjectConfigs[item.name]?.displayName ?? "";
        return `${item.name} ${item.selectableLabel ?? getSelectableLabel(item.name) ?? ""} ${displayName}`
          .toLocaleLowerCase("id-ID")
          .includes(normalizedQuery);
      })
      .slice(0, 8);
  }, [mapObjectConfigs, query, selectableBuildings]);

  const chooseSearchResult = (record: SceneObjectRecord) => {
    if (selectingStart) {
      setQuery("");
      setSearchFocused(false);
      setBuildingAsStart(record);
      return;
    }
    if (startPoint) calculateRoute(record);
    else setBuildingAsStart(record);
    setQuery("");
    setSearchFocused(false);
    if (multiFloor && !startPoint) setFloorView(record.floor);
    viewerApi.current?.focusObject(record.object);
  };

  const beginStartSelection = useCallback(() => {
    setQuery("");
    setSelectingStart(true);
    setViewMode("map");
    clearRoute();
    setRouteMessage(multiFloor
      ? "Klik area lantai atau building pada peta untuk memilih titik awal. Pilih lantai lewat tombol lantai."
      : "Klik area lantai atau building pada peta untuk memilih titik awal.");
  }, [clearRoute, multiFloor]);

  const showMapView = useCallback(() => {
    setViewMode("map");
    window.requestAnimationFrame(() => {
      if (routeMetrics) {
        viewerApi.current?.focusRoute(routeMetrics.points);
      } else {
        viewerApi.current?.resetView();
      }
    });
  }, [routeMetrics]);

  const selectRouteStep = useCallback((index: number) => {
    if (!routeMetrics || index < 0 || index >= routeSteps.length) return;
    setActiveStepIndex(index);
    setViewMode("map");
    const step = routeSteps[index];
    // Langkah naik/turun memperlihatkan kedua lantai; langkah lain hanya lantainya.
    const stepFloor = routePointFloors[step.startIndex];
    if (multiFloor) setFloorView(step.kind === "up" || step.kind === "down" ? "ALL" : stepFloor ?? "ALL");
    const focusIndex = Math.round((step.startIndex + step.endIndex) / 2);
    window.requestAnimationFrame(() => {
      viewerApi.current?.focusPoint(routeMetrics.points[focusIndex]);
    });
  }, [multiFloor, routeMetrics, routePointFloors, routeSteps]);

  useEffect(() => {
    if (!routeMetrics) return;
    const frame = window.requestAnimationFrame(() => viewerApi.current?.focusRoute(routeMetrics.points));
    return () => window.cancelAnimationFrame(frame);
  }, [routeMetrics]);

  const startWorldPoint: RouteWorldPoint | null = startPoint && navigation
    ? [startPoint.point[0], placeElevation(navigation, startPoint), startPoint.point[1]]
    : null;
  const destinationWorldPoint: RouteWorldPoint | null = destinationPoint && navigation
    ? [destinationPoint.point[0], placeElevation(navigation, destinationPoint), destinationPoint.point[1]]
    : null;

  const aircraftStands = useMemo(() => findAircraftStands(objects), [objects]);

  const toggleRoutePause = useCallback(() => {
    setRoutePaused((value) => !value);
  }, []);

  const recenterActiveRoute = useCallback(() => {
    if (!routeSessionActive) return;
    setViewMode("pov");
    setRouteRecenterToken((value) => value + 1);
  }, [routeSessionActive]);

  const restartActiveRoute = useCallback(() => {
    if (!routeMetrics) return;
    setRoutePaused(false);
    setRouteProgress(createPlaybackSnapshot(routeMetrics, 0));
    setViewMode("pov");
    setRouteRestartToken((value) => value + 1);
  }, [routeMetrics]);

  const handlePlaybackComplete = useCallback(() => {
    setRoutePaused(true);
  }, []);


  const resetRoute = useCallback(() => {
    setStartPoint(null);
    setStartName(null);
    clearRoute();
    setRouteMessage("Pilih posisi awal terlebih dahulu.");
    setSelected(null);
    setQuery("");
    setSelectingStart(false);
    setViewMode("map");
    window.requestAnimationFrame(() => viewerApi.current?.resetView());
  }, [clearRoute]);

  // Kedua lantai ada dalam satu model, jadi berpindah lantai tidak memuat
  // ulang apa pun dan rute yang sedang aktif tetap ada.
  const changeFloor = useCallback((view: FloorView) => setFloorView(view), []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
      if (
        event.key.toLocaleLowerCase("id-ID") === "r" &&
        !(event.target instanceof HTMLInputElement)
      ) {
        showMapView();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showMapView]);

  useEffect(() => {
    if (!routeMetrics) return;
    const routeBounds = new THREE.Box3().setFromPoints(routeMetrics.points);
    const routeReport = {
      pointCount: routeMetrics.points.length,
      totalDistance: routeMetrics.totalDistance,
      first: routeMetrics.points[0]?.toArray(),
      last: routeMetrics.points.at(-1)?.toArray(),
      floors: [...new Set(routePointFloors)],
      bounds: {
        min: routeBounds.min.toArray(),
        max: routeBounds.max.toArray(),
      },
    };
    console.info("[Terminal 1 geometry route audit]", routeReport);
    (
      window as Window & { __TERMINAL_ACTIVE_ROUTE_AUDIT__?: unknown }
    ).__TERMINAL_ACTIVE_ROUTE_AUDIT__ = routeReport;
  }, [routeMetrics, routePointFloors]);

  const routeFloorsText = routeTransitions.length
    ? [routeTransitions[0].from, ...routeTransitions.map((transition) => transition.to)].map((floor) => FLOOR_LABELS[floor]).join(" → ")
    : routePointFloors[0] ? FLOOR_LABELS[routePointFloors[0]] : "";
  const searchPlaceholderExample = multiFloor ? "T1-GF-01, Gate 5" : "T1-GF-...";

  return (
    <main
      className="viewer-shell"
      data-view-mode={viewMode}
      data-floor-view={shownFloorView}
      data-start-location={startName ?? ""}
      data-destination-location={destinationName ?? ""}
      data-route-active={routeSessionActive ? "true" : "false"}
      data-route-paused={routePaused ? "true" : "false"}
    >
      <PassengerRoadmap
        routeReady={Boolean(navigation)}
        gates={gateNumbers}
        onRouteToDeparture={routeToDeparture}
        onRouteToGate={routeToGate}
      />
      <div className="canvas-stage">
        <Canvas
          dpr={[1, 1.75]}
          frameloop="demand"
          camera={{ fov: 70, near: 0.01, far: 100000, position: [0, 10, 10] }}
          gl={{
            antialias: true,
            alpha: true,
            stencil: false,
            preserveDrawingBuffer: false,
            powerPreference: "high-performance",
          }}
          onCreated={({ gl }) => {
            gl.outputColorSpace = THREE.SRGBColorSpace;
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1;
          }}
        >
          <ambientLight intensity={0.72} color="#FFFFFF" />
          <hemisphereLight
            intensity={1.05}
            color="#FFFFFF"
            groundColor="#8B949B"
          />
          <directionalLight
            position={[12, 20, 10]}
            intensity={1.85}
            color="#FFFDF7"
          />
          <directionalLight
            position={[-10, 8, -12]}
            intensity={0.52}
            color="#D9E8FF"
          />
          <Suspense fallback={null}>
            <SceneModel
              modelUrl={TERMINAL_MODEL_URL}
              floorView={shownFloorView}
              selectedUuid={selected?.uuid ?? null}
              onSelect={handleSelect}
              onSelectFloor={selectingStart && navigation ? (point) => commitStartPoint({ floor: floorAtHeight(navigation, point.y), point: [point.x, point.z] }, "Posisi pada peta") : undefined}
              onSelectEntryPoint={chooseEntryPoint}
              onReady={handleReady}
            />
            {/* Lingkungan luar menempel di tanah, jadi tidak ditampilkan saat hanya Lantai 2 yang terlihat. */}
            {bounds && shownFloorView !== "L2" && (
              <ExteriorScene baseY={bounds.box.min.y} visible={showExterior} onAttribution={setExteriorAttribution} />
            )}
            {bounds && showExterior && <ApronAircraft stands={aircraftStands} groundY={bounds.box.min.y} />}
            <GridRouteLayer
              points={routeWorldPoints}
              highlightedPoints={highlightedPoints}
              start={startWorldPoint}
              destination={destinationWorldPoint}
              visitorPosition={visibleRouteProgress?.position ?? null}
            />
          </Suspense>
          <CameraController
            ref={viewerApi}
            bounds={bounds}
            viewMode={viewMode}
          />
          <RoutePlaybackController
            metrics={routeMetrics}
            active={routeSessionActive}
            paused={routePaused}
            viewMode={viewMode}
            restartToken={routeRestartToken}
            recenterToken={routeRecenterToken}
            onProgress={setRouteProgress}
            onComplete={handlePlaybackComplete}
          />
        </Canvas>
      </div>

      <LoadingOverlay modelReady={bounds !== null} />
      <FloorSwitcher view={shownFloorView} floors={modelFloors.length ? modelFloors : ["L1"]} onSelect={changeFloor} />

      <aside className="sea-planner" aria-label="Pencarian rute">
        <div className="sea-planner-heading">
          <span>TERMINAL 1 · {floorViewLabel(shownFloorView, modelFloors.length ? modelFloors : ["L1"]).toLocaleUpperCase("id-ID")}</span>
          <h1>Petunjuk arah</h1>
        </div>
        <div className="sea-trip-fields">
          <button type="button" className={selectingStart ? "is-current" : ""} onClick={beginStartSelection} disabled={!navigation}>
            <span className="sea-pin is-origin" />
            <span><small>Dari</small><strong>{startName ?? "Pilih titik awal"}</strong></span>
          </button>
          <button type="button" className={!selectingStart ? "is-current" : ""} onClick={() => { setSelectingStart(false); setQuery(""); setSearchFocused(true); }} disabled={!startPoint}>
            <span className="sea-pin is-destination" />
            <span><small>Ke</small><strong>{routeSessionActive ? destinationName : "Pilih tujuan"}</strong></span>
          </button>
        </div>
        <div className="sea-search-wrap">
          <label className="sea-search">
            <Search size={18} />
            <input value={query} onChange={(event) => { setQuery(event.target.value); setSearchFocused(true); }} onFocus={() => setSearchFocused(true)} onBlur={() => window.setTimeout(() => setSearchFocused(false), 140)} placeholder={selectingStart || !startPoint ? `Cari titik awal (${searchPlaceholderExample})` : `Cari tujuan (${searchPlaceholderExample})`} aria-label={selectingStart || !startPoint ? "Cari titik awal" : "Cari tujuan"} />
            {query && <button type="button" onClick={() => setQuery("")} aria-label="Hapus pencarian"><X size={16} /></button>}
          </label>
          {searchFocused && query && <div className="sea-search-results">
            {searchResults.length ? searchResults.map((record) => {
              const displayName = mapObjectConfigs[record.name]?.displayName?.trim();
              const floorNote = multiFloor ? ` · ${FLOOR_LABELS[record.floor]}` : "";
              return <button key={record.uuid} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => chooseSearchResult(record)}><MapPin size={16} /><span><strong>{displayName || record.selectableLabel || record.name}</strong><small>{displayName || record.selectableLabel ? `${record.name} · ${record.metadata.category}` : record.metadata.category}{floorNote}</small></span></button>;
            }) : <p>Tidak ditemukan. Coba nama tenant, kode building, atau nomor gate.</p>}
          </div>}
        </div>
        <p className="sea-hint" role="status">{gridError ?? routeMessage}</p>
        {routeMetrics && routeSteps.length > 0 && <div className="sea-route-details">
          <div className="sea-route-summary"><div><strong>{Math.round(routeMetrics.totalDistance)} m</strong><span>Perkiraan {Math.max(1, Math.ceil(routeMetrics.totalDistance / 1.35 / 60))} menit{routeFloorsText ? ` · ${routeFloorsText}` : ""}</span></div><button type="button" onClick={resetRoute} aria-label="Hapus rute"><X size={18} /></button></div>
          <div className="sea-step-header"><h2>Langkah perjalanan</h2><span>{activeStepIndex + 1} / {routeSteps.length}</span></div>
          <ol className="sea-step-list">{routeSteps.map((step, index) => <li key={`${step.kind}-${step.startIndex}`}><button type="button" className={index === activeStepIndex ? "is-active" : ""} onClick={() => selectRouteStep(index)} aria-current={index === activeStepIndex ? "step" : undefined}><span className="sea-step-number">{index + 1}</span><span><strong>{step.label}</strong><small>{step.kind === "arrive" ? destinationName : step.kind === "up" || step.kind === "down" ? "Ikuti papan petunjuk ke lantai tujuan" : `Sekitar ${Math.round(step.distance)} m${multiFloor && routePointFloors[step.startIndex] ? ` · ${FLOOR_LABELS[routePointFloors[step.startIndex]]}` : ""}`}</small></span></button></li>)}</ol>
          <div className="sea-step-controls"><button type="button" onClick={() => selectRouteStep(activeStepIndex - 1)} disabled={activeStepIndex === 0}>Sebelumnya</button><button type="button" onClick={() => selectRouteStep(activeStepIndex + 1)} disabled={activeStepIndex >= routeSteps.length - 1}>Berikutnya <ChevronRight size={16} /></button></div>
          <div className="sea-simulation-controls"><button type="button" onClick={viewMode === "pov" ? showMapView : restartActiveRoute}>{viewMode === "pov" ? "Lihat peta" : "Mulai simulasi 3D"}</button>{viewMode === "pov" && <><button type="button" onClick={toggleRoutePause}>{routePaused ? "Lanjut" : "Jeda"}</button><button type="button" onClick={recenterActiveRoute}>Pusatkan</button></>}</div>
        </div>}
      </aside>

      <div className="sea-map-actions" aria-label="Kontrol peta"><button type="button" onClick={showMapView} disabled={!bounds} aria-label="Tampilkan seluruh peta"><RotateCcw size={18} /></button><button type="button" onClick={() => viewerApi.current?.zoomIn()} disabled={!bounds} aria-label="Perbesar peta"><Plus size={18} /></button><button type="button" onClick={() => viewerApi.current?.zoomOut()} disabled={!bounds} aria-label="Perkecil peta"><Minus size={18} /></button><button type="button" className="map-exterior-toggle" onClick={() => setShowExterior((value) => !value)} disabled={!bounds || shownFloorView === "L2"} aria-pressed={showExterior} aria-label={showExterior ? "Sembunyikan area luar gedung" : "Tampilkan area luar gedung"} title="Area luar gedung"><Trees size={18} /></button></div>
      {exteriorAttribution && <p className="map-attribution">Area luar: {exteriorAttribution}</p>}

      <div className="map-compass" aria-label="Arah mata angin pada model peta">
        <span className="map-compass-label map-compass-north">U</span>
        <span className="map-compass-label map-compass-east">T</span>
        <span className="map-compass-label map-compass-south">S</span>
        <span className="map-compass-label map-compass-west">B</span>
        <span className="map-compass-center">＋</span>
      </div>

      {selected && selectedLocationConfig && <aside className="sea-location-info" aria-label={`Informasi ${selectedLocationConfig.displayName || selected.name}`}>
        {getMapObjectPhotoUrl(selectedLocationConfig.photoUrl) && <img src={getMapObjectPhotoUrl(selectedLocationConfig.photoUrl)} alt={`Tampak depan ${selectedLocationConfig.displayName || selected.name}`} />}
        <div className="sea-location-info-body">
          <span className="sea-location-kicker">{selectedLocationConfig.entityType === "FACILITY" ? "FASILITAS BANDARA" : "TENANT KOMERSIAL"}</span>
          <h2>{selectedLocationConfig.displayName || selected.name}</h2>
          <span className="sea-location-category">{selected.category}{multiFloor ? ` · ${selected.location.replace(/^Terminal 1 - /, "")}` : ""}</span>
          {selectedLocationConfig.description && <p>{selectedLocationConfig.description}</p>}
          <div className="sea-location-hours"><strong>Jam operasional</strong><span>{selectedLocationConfig.entityType === "FACILITY" || (!selectedLocationConfig.openTime && !selectedLocationConfig.closeTime) ? "Buka 24 jam" : `${selectedLocationConfig.openTime} – ${selectedLocationConfig.closeTime}`}</span></div>
          {(selectedLocationConfig.activeFrom || selectedLocationConfig.activeUntil) && <div className="sea-location-hours"><strong>Masa aktif</strong><span>{selectedLocationConfig.activeFrom || "Sekarang"} – {selectedLocationConfig.activeUntil || "Tidak ditentukan"}</span></div>}
          {selectedLocationConfig.contact && <div className="sea-location-contact">{selectedLocationConfig.contact}</div>}
          <div className="sea-location-links">{selectedLocationConfig.websiteUrl && <a href={selectedLocationConfig.websiteUrl} target="_blank" rel="noreferrer">Website</a>}{selectedLocationConfig.instagramUrl && <a href={selectedLocationConfig.instagramUrl} target="_blank" rel="noreferrer">Instagram</a>}</div>
        </div>
      </aside>}

    </main>
  );
}
