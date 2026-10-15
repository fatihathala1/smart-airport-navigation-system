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
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useProgress } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  Box,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Navigation,
  MapPin,
  Minus,
  Compass,
  Crosshair,
  LocateFixed,
  LocateOff,
  LoaderCircle,
  MousePointer2,
  Pause,
  Play,
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
  type FloorRoute,
  type FloorTransition,
  type RoutePlace,
} from "@/lib/map3d/multi-floor-route";
import { defaultMapObjectConfig, fetchMapObjectConfigsFromDb, getMapObjectPhotoUrl, readMapObjectConfigs, type MapObjectConfig } from "@/lib/map3d/admin-object-config";
import { geographicToT1Model, isUsableT1Position, T1_GEO_CALIBRATION } from "@/lib/map3d/passenger-geolocation";
import { usePassengerGeolocation } from "@/hooks/usePassengerGeolocation";
import { useMapStore } from "@/store/mapStore";

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

const mapCopy = {
  ID: {
    loading: "MEMUAT MODEL LANTAI", directions: "Petunjuk arah", from: "Dari", to: "Ke", chooseStart: "Pilih titik awal", chooseDestination: "Pilih tujuan", searchStart: "Cari titik awal", searchDestination: "Cari tujuan", clearSearch: "Hapus pencarian", noResults: "Tidak ditemukan. Coba nama tenant, kode building, atau nomor gate.", routeHint: "Rute terdekat menghindari tembok dan pilar, melalui bukaan pintu yang ada pada model.", chooseStartHint: "Titik awal berada di area jalan terdekat. Pilih tujuan.", selectStartHint: "Pilih posisi awal terlebih dahulu.", noSafeRoute: "Tidak ditemukan jalur aman pada lantai ini. Coba titik awal atau tujuan lain.", noFloorRoute: "Tidak ditemukan jalur lewat eskalator atau tangga menuju lantai tujuan.", stepTitle: "Langkah perjalanan", previous: "Sebelumnya", next: "Berikutnya", mapView: "Lihat peta", simulation: "Mulai simulasi 3D", continueSimulation: "Lanjutkan simulasi 3D", pause: "Jeda", resume: "Lanjutkan", center: "Pusatkan", estimate: "Perkiraan", minutes: "menit", arrive: "Tiba di tujuan", straight: "Jalan lurus", left: "Belok kiri", right: "Belok kanan", floorDirection: "Ikuti papan petunjuk ke lantai tujuan", operationalHours: "Jam operasional", open24: "Buka 24 jam", activePeriod: "Masa aktif", now: "Sekarang", unspecified: "Tidak ditentukan", facility: "FASILITAS BANDARA", tenant: "TENANT KOMERSIAL", frontPhoto: "Tampak depan", resetRoute: "Hapus rute", showMap: "Tampilkan seluruh peta", zoomIn: "Perbesar peta", zoomOut: "Perkecil peta", hideExterior: "Sembunyikan area luar gedung", showExterior: "Tampilkan area luar gedung", compass: "Arah mata angin pada model peta", locating: "Mencari posisi Anda", locationActive: "Lokasi real-time aktif", locationDenied: "Izin lokasi diblokir", locationUnavailable: "Lokasi hanya tersedia melalui HTTPS atau localhost", locationTimeout: "GPS belum merespons", locationOutside: "Anda belum terdeteksi di sekitar Terminal 1", locationInaccurate: "Akurasi GPS belum cukup", retryLocation: "Coba lagi", yourLocation: "Lokasi Anda (GPS)", locationFloorNote: "GPS tidak dapat mendeteksi lantai. Koreksi bila perlu." },
  EN: {
    loading: "LOADING FLOOR MODEL", directions: "Directions", from: "From", to: "To", chooseStart: "Choose starting point", chooseDestination: "Choose destination", searchStart: "Search starting point", searchDestination: "Search destination", clearSearch: "Clear search", noResults: "No results. Try a tenant name, building code, or gate number.", routeHint: "The shortest route avoids walls and pillars through the model's available doorways.", chooseStartHint: "Your start is on the nearest walkway. Choose a destination.", selectStartHint: "Choose a starting point first.", noSafeRoute: "No safe route was found on this floor. Try another start or destination.", noFloorRoute: "No route via an escalator or staircase was found to the destination floor.", stepTitle: "Walking steps", previous: "Previous", next: "Next", mapView: "View map", simulation: "Start 3D simulation", continueSimulation: "Continue 3D simulation", pause: "Pause", resume: "Resume", center: "Recenter", estimate: "Estimated", minutes: "min", arrive: "Arrive at destination", straight: "Walk straight", left: "Turn left", right: "Turn right", floorDirection: "Follow signs to the destination floor", operationalHours: "Operating hours", open24: "Open 24 hours", activePeriod: "Active period", now: "Now", unspecified: "Not specified", facility: "AIRPORT FACILITY", tenant: "COMMERCIAL TENANT", frontPhoto: "Front view", resetRoute: "Clear route", showMap: "Show full map", zoomIn: "Zoom in", zoomOut: "Zoom out", hideExterior: "Hide exterior area", showExterior: "Show exterior area", compass: "Map compass", locating: "Finding your position", locationActive: "Live location active", locationDenied: "Location permission is blocked", locationUnavailable: "Location requires HTTPS or localhost", locationTimeout: "GPS has not responded", locationOutside: "You are not detected near Terminal 1", locationInaccurate: "GPS accuracy is not sufficient yet", retryLocation: "Try again", yourLocation: "Your location (GPS)", locationFloorNote: "GPS cannot detect floors. Correct it if needed." },
} as const;
const CameraController = forwardRef<
  ViewerApi,
  { bounds: SceneBounds | null; viewMode: CameraMode; onHeadingChange: (heading: number) => void }
>(function CameraController({ bounds, viewMode, onHeadingChange }, ref) {
    const { camera, invalidate, size: viewportSize } = useThree();
    const controlsRef = useRef<OrbitControlsImpl>(null);
    const lastHeadingRef = useRef(Number.NaN);

    const updateHeading = useCallback(() => {
      const direction = camera.getWorldDirection(new THREE.Vector3());
      direction.y = 0;
      if (direction.lengthSq() < 0.0001) return;
      direction.normalize();
      // Three.js looks down -Z. Convert the camera heading to the CSS angle
      // needed to keep the world north marker pointing to true north.
      const heading = THREE.MathUtils.radToDeg(Math.atan2(direction.x, -direction.z));
      if (!Number.isFinite(lastHeadingRef.current) || Math.abs(heading - lastHeadingRef.current) > 0.35) {
        lastHeadingRef.current = heading;
        onHeadingChange(-heading);
      }
    }, [camera, onHeadingChange]);

    // Event ini dipanggil langsung oleh OrbitControls saat gesture/mouse
    // mengubah kamera, sehingga kompas tidak menunggu siklus useFrame.
    useFrame(updateHeading);

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
        onChange={updateHeading}
        mouseButtons={{
          LEFT: THREE.MOUSE.PAN,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.ROTATE,
        }}
        touches={{
          ONE: THREE.TOUCH.PAN,
          // Dua jari: putar peta sekaligus tetap mendukung pinch-to-zoom.
          // Klik kanan mouse tetap menjadi kontrol rotasi desktop.
          TWO: THREE.TOUCH.DOLLY_ROTATE,
        }}
      />
    );
  },
);

function LoadingOverlay({ modelReady, lang }: { modelReady: boolean; lang: "ID" | "EN" }) {
  const { progress } = useProgress();
  if (!isMapModelLoading(modelReady)) return null;
  return (
    <div className="loading-overlay" aria-live="polite">
      <div className="loader-mark">
        <Box size={22} strokeWidth={1.6} />
      </div>
      <div className="loader-copy">
        <span>{mapCopy[lang].loading}</span>
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

/**
 * A departure area has one designated passenger access door. Keep this
 * mapping explicit so route planning cannot silently pick a different door
 * just because it happens to be closer in the 3D model.
 */
const DEPARTURE_ENTRANCE_BY_AREA: Record<number, RegExp> = {
  1: /^DOOR__Keberangkatan_1A(?:_\d+)?$/i,
  2: /^DOOR__Keberangkatan_1A(?:_\d+)?$/i,
  3: /^DOOR__Keberangkatan_1B(?:_\d+)?$/i,
  4: /^DOOR__Keberangkatan_1C(?:_\d+)?$/i,
};

const GATE_OBJECT = /^T1-FF-GATE-(\d+)$/i;

/** Nama pintu masuk untuk ditampilkan: `DOOR__Keberangkatan_1A_4` → `Pintu Keberangkatan 1A`. */
function entranceLabel(name: string) {
  return `Pintu ${name.replace(DEPARTURE_ENTRANCE, "Keberangkatan ").replace(/_\d+$/, "")}`;
}

function closestEntrance(
  objects: SceneObjectRecord[],
  record: SceneObjectRecord,
  allowedDoor: RegExp = DEPARTURE_ENTRANCE,
) {
  const target = recordCenter(record).point;
  let best: { record: SceneObjectRecord; distance: number } | null = null;
  for (const entrance of objects) {
    if (!allowedDoor.test(entrance.name)) continue;
    const [x, z] = recordCenter(entrance).point;
    const distance = Math.hypot(x - target[0], z - target[1]);
    if (!best || distance < best.distance) best = { record: entrance, distance };
  }
  return best?.record ?? null;
}

function joinRoutes(first: FloorRoute, second: FloorRoute): FloorRoute {
  const pointOffset = Math.max(0, first.points.length - 1);
  return {
    points: [...first.points, ...second.points.slice(1)],
    pointFloors: [...first.pointFloors, ...second.pointFloors.slice(1)],
    transitions: [
      ...first.transitions,
      ...second.transitions.map((transition) => ({ ...transition, index: transition.index + pointOffset })),
    ],
    length: first.length + second.length,
  };
}

function requiredDepartureForRecord(record: SceneObjectRecord) {
  const label = record.selectableLabel ?? "";
  const departureMatch = /^Departure\s+(\d+)$/i.exec(label);
  if (departureMatch) return Number(departureMatch[1]);
  // Pilar pembatas di sisi Departure 1 termasuk akses zona Departure 1.
  if (/tembok[-_ ]?pillar[-_ ]?6/i.test(`${record.name} ${label}`)) return 1;
  return null;
}

function nearestRouteDistance(metrics: { points: THREE.Vector3[]; cumulativeDistances: number[] }, position: RouteWorldPoint) {
  const point = new THREE.Vector3(...position);
  let bestDistance = 0;
  let bestSquared = Number.POSITIVE_INFINITY;
  for (let index = 0; index < metrics.points.length - 1; index += 1) {
    const start = metrics.points[index];
    const end = metrics.points[index + 1];
    const segment = end.clone().sub(start);
    const lengthSquared = segment.lengthSq();
    const ratio = lengthSquared > 0
      ? THREE.MathUtils.clamp(point.clone().sub(start).dot(segment) / lengthSquared, 0, 1)
      : 0;
    const projected = start.clone().addScaledVector(segment, ratio);
    const squared = projected.distanceToSquared(point);
    if (squared < bestSquared) {
      bestSquared = squared;
      bestDistance = metrics.cumulativeDistances[index] + Math.sqrt(lengthSquared) * ratio;
    }
  }
  return bestDistance;
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
  const [routeMessage, setRouteMessage] = useState<string>(mapCopy.ID.selectStartHint);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [selectingStart, setSelectingStart] = useState(false);
  const [viewMode, setViewMode] = useState<CameraMode>("map");
  const [routePaused, setRoutePaused] = useState(false);
  const [liveTracking, setLiveTracking] = useState(false);
  const [livePosition, setLivePosition] = useState<RouteWorldPoint | null>(null);
  const liveReadingTimestamp = useRef<number | null>(null);
  const [routeProgress, setRouteProgress] =
    useState<RoutePlaybackSnapshot | null>(null);
  const [routeRestartToken, setRouteRestartToken] = useState(0);
  const [routeRecenterToken, setRouteRecenterToken] = useState(0);
  const [floorView, setFloorView] = useState<FloorView>("ALL");
  const [showExterior, setShowExterior] = useState(true);
  const [exteriorAttribution, setExteriorAttribution] = useState<string | null>(null);
  const [compassRotation, setCompassRotation] = useState(0);
  const [mobileSheetExpanded, setMobileSheetExpanded] = useState(false);
  const [passengerFloor, setPassengerFloor] = useState<FloorId>("L1");
  const [automaticLocation, setAutomaticLocation] = useState(true);
  const [locationMapped, setLocationMapped] = useState(false);
  const locationFocusDone = useRef(false);
  const passengerLocation = usePassengerGeolocation(automaticLocation);
  const refreshPassengerLocation = useCallback(() => {
    locationFocusDone.current = false;
    setAutomaticLocation(true);
    setLocationMapped(false);
    passengerLocation.refresh();
  }, [passengerLocation.refresh]);
  const togglePassengerLocation = useCallback(() => {
    if (automaticLocation || locationMapped) {
      locationFocusDone.current = false;
      setAutomaticLocation(false);
      setLocationMapped(false);
      setLiveTracking(false);
      setLivePosition(null);
      return;
    }
    refreshPassengerLocation();
  }, [automaticLocation, locationMapped, refreshPassengerLocation]);
  const touchStartY = useRef<number | null>(null);

  const handleSheetTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleSheetTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    touchStartY.current = null;
    if (deltaY < -28) {
      setMobileSheetExpanded(true);
    } else if (deltaY > 28) {
      setMobileSheetExpanded(false);
    }
  }, []);

  const lang = useMapStore((state) => state.lang);
  const copy = mapCopy[lang];
  useEffect(() => {
    // Muat dari DB terlebih dahulu, kemudian listen event localStorage
    // dari tab admin untuk sinkronisasi real-time
    fetchMapObjectConfigsFromDb()
      .then(setMapObjectConfigs)
      .catch(() => setMapObjectConfigs(readMapObjectConfigs()));

    const sync = () => setMapObjectConfigs(readMapObjectConfigs());
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
  useEffect(() => {
    if (!startPoint && !routeSessionActive) setRouteMessage(copy.selectStartHint);
  }, [copy.selectStartHint, routeSessionActive, startPoint]);
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
  useEffect(() => {
    if (!routeProgress || !routeMetrics || routeSteps.length === 0) return;
    if (routeProgress.progress >= 1) {
      setActiveStepIndex(routeSteps.length - 1);
      return;
    }
    const nextStepIndex = routeSteps.findIndex((step) => {
      if (step.kind === "arrive") return false;
      return routeProgress.distance < routeMetrics.cumulativeDistances[step.endIndex];
    });
    if (nextStepIndex >= 0) setActiveStepIndex(nextStepIndex);
  }, [routeMetrics, routeProgress, routeSteps]);
  const visibleRouteProgress = useMemo(
    () =>
      routeProgress ??
      (routeMetrics ? createPlaybackSnapshot(routeMetrics, 0) : null),
    [routeMetrics, routeProgress],
  );

  const usableLocationReading = useMemo(
    () => passengerLocation.reading && isUsableT1Position(
      passengerLocation.reading,
      passengerLocation.reading.accuracy,
    ) ? passengerLocation.reading : null,
    [passengerLocation.reading],
  );

  // Browser GPS memberi posisi horizontal. Titik itu diproyeksikan ke model
  // yang sama dengan area luar, lalu di-snap ke koridor terdekat agar langsung
  // bisa dipakai sebagai origin rute.
  useEffect(() => {
    if (!automaticLocation || !navigation || !usableLocationReading) return;
    // Kunci titik awal setelah satu pembacaan yang lolos kalibrasi. GPS indoor
    // dapat bergeser beberapa puluh meter; pembacaan baru hanya dipakai setelah
    // penumpang menekan tombol pusatkan/perbarui lokasi secara eksplisit.
    if (locationFocusDone.current) return;
    const [x, z] = geographicToT1Model(usableLocationReading);
    const snapped = snapPlace(navigation, { floor: passengerFloor, point: [x, z] });
    if (!snapped) return;

    const frame = window.requestAnimationFrame(() => {
      setStartPoint(snapped);
      setStartName(copy.yourLocation);
      setLocationMapped(true);
      setSelectingStart(false);
      if (!routeSessionActive) setRouteMessage(copy.chooseStartHint);
      if (!locationFocusDone.current) {
        locationFocusDone.current = true;
        setFloorView(multiFloor ? passengerFloor : "L1");
        viewerApi.current?.focusPoint(new THREE.Vector3(
          snapped.point[0],
          placeElevation(navigation, snapped),
          snapped.point[1],
        ));
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [automaticLocation, copy.chooseStartHint, copy.yourLocation, multiFloor, navigation, passengerFloor, routeSessionActive, usableLocationReading]);

  // Mode navigasi aktif: ikuti GPS yang sudah dirata-ratakan dan tempelkan
  // marker ke koridor terdekat. Perubahan kurang dari 3 m diabaikan agar
  // marker tidak bergetar karena noise GPS.
  useEffect(() => {
    if (!liveTracking || !navigation || !usableLocationReading) return;
    if (liveReadingTimestamp.current === usableLocationReading.timestamp) return;
    liveReadingTimestamp.current = usableLocationReading.timestamp;
    const [x, z] = geographicToT1Model(usableLocationReading);
    const snapped = snapPlace(navigation, { floor: passengerFloor, point: [x, z] });
    if (!snapped) return;
    const next: RouteWorldPoint = [snapped.point[0], placeElevation(navigation, snapped), snapped.point[1]];
    if (livePosition) {
      const distance = Math.hypot(next[0] - livePosition[0], next[2] - livePosition[2]);
      if (distance < 1.5) return;
      // Interpolasi sebagian membuat perpindahan marker terasa kontinu,
      // sementara filter GPS tetap menolak perubahan mikro.
      const smoothing = Math.min(0.72, Math.max(0.38, distance / 18));
      setLivePosition([
        livePosition[0] + (next[0] - livePosition[0]) * smoothing,
        next[1],
        livePosition[2] + (next[2] - livePosition[2]) * smoothing,
      ]);
    } else {
      setLivePosition(next);
    }
    setStartPoint(snapped);
    setStartName(copy.yourLocation);
  }, [copy.yourLocation, livePosition, liveTracking, navigation, passengerFloor, usableLocationReading]);

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
        setRouteMessage(copy.selectStartHint);
        return;
      }
      setStartPoint(snapped);
      setStartName(name);
      setAutomaticLocation(false);
      setLocationMapped(false);
      clearRoute();
      setRouteMessage(copy.chooseStartHint);
      setSelectingStart(false);
      setViewMode("map");
      // Setelah titik awal dipilih, tujuan boleh diklik di lantai mana pun.
      // Jangan menyembunyikan L2 ketika titik awal berada di L1 karena itu
      // membuat mesh tujuan L2 tidak menerima raycast sama sekali.
      setFloorView((view) => multiFloor ? "ALL" : (view === "ALL" || view === snapped.floor ? view : snapped.floor));
      viewerApi.current?.focusPoint(new THREE.Vector3(snapped.point[0], placeElevation(navigation, snapped), snapped.point[1]));
    },
    [clearRoute, lang, multiFloor, navigation],
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

  const handleManualStartPoint = useCallback(
    (point: THREE.Vector3, objectName?: string) => {
      if (!navigation) return;
      // Klik pada tenant/fasilitas harus memakai pusat objek dan metadata
      // lantainya. Raycast pada dinding atau atap dapat menghasilkan Y yang
      // bukan ketinggian lantai, sehingga floorAtHeight(point.y) sebelumnya
      // bisa memilih lantai yang salah dan membuat titik tampak melenceng.
      const record = objectName
        ? objects.find((item) => item.name === objectName && item.selectable)
        : undefined;
      if (record) {
        setBuildingAsStart(record);
        return;
      }
      commitStartPoint(
        { floor: floorAtHeight(navigation, point.y), point: [point.x, point.z] },
        "Posisi pada peta",
      );
    },
    [commitStartPoint, navigation, objects, passengerFloor, setBuildingAsStart],
  );

  /**
   * Hitung rute dari `start` ke sebuah objek, di lantai yang sama atau lewat
   * eskalator/tangga. Dipakai oleh pencarian, klik peta, dan panduan penumpang.
   */
  const planRoute = useCallback(
    (start: RoutePlace, record: SceneObjectRecord) => {
      if (!navigation) return false;
      const objectConfig = mapObjectConfigs[record.name] ?? defaultMapObjectConfig(record.name);
      const target = {
        floor: record.floor,
        rect: recordRect(record),
        entryDoors: objectConfig.entryDoors,
      };
      const departure = requiredDepartureForRecord(record);
      const requiredEntrance = departure && DEPARTURE_ENTRANCE_BY_AREA[departure]
        ? closestEntrance(objects, record, DEPARTURE_ENTRANCE_BY_AREA[departure])
        : null;

      // Departure 1/2/3/4 masing-masing memiliki pintu akses wajib. Jika
      // pengguna sudah memilih titik awal sendiri, rute tetap harus melewati
      // pintu yang ditentukan, bukan langsung menuju sisi terdekat bangunan.
      let route = findFloorRoute(navigation, start, target);
      if (requiredEntrance) {
        const entrancePlace = recordCenter(requiredEntrance);
        const toEntrance = findFloorRoute(navigation, start, {
          floor: requiredEntrance.floor,
          rect: recordRect(requiredEntrance),
        });
        const entrancePoint = toEntrance?.points.at(-1);
        const entranceStart = entrancePoint
          ? snapPlace(navigation, { floor: requiredEntrance.floor, point: [entrancePoint[0], entrancePoint[2]] })
          : snapPlace(navigation, entrancePlace);
        const fromEntrance = entranceStart ? findFloorRoute(navigation, entranceStart, target) : null;
        route = toEntrance && fromEntrance ? joinRoutes(toEntrance, fromEntrance) : null;
      }
      const label = record.selectableLabel ?? record.name;
      setRouteProgress(null);
      setRoutePaused(false);
      setActiveStepIndex(0);
      setMobileSheetExpanded(false);
      setViewMode("map");
      if (!route) {
        setRouteWorldPoints([]);
        setRouteTransitions([]);
        setRoutePointFloors([]);
        setDestinationPoint(null);
        setDestinationName(label);
        setRouteMessage(start.floor === record.floor ? copy.noSafeRoute : copy.noFloorRoute);
        return false;
      }

      const end = route.points.at(-1);
      setRouteWorldPoints(route.points);
      setRouteTransitions(route.transitions);
      setRoutePointFloors(route.pointFloors);
      setDestinationPoint(end ? { floor: record.floor, point: [end[0], end[2]] } : null);
      setDestinationName(label);
      setRouteMessage(route.transitions.length
        ? `${lang === "ID" ? "Rute melewati" : "Route via"} ${route.transitions.map((transition) => transition.label.toLocaleLowerCase(lang === "ID" ? "id-ID" : "en-US")).join(", ")}.`
        : copy.routeHint);
      setSelected(createSelectedObject(record.object));
      // Mulai dari lantai titik awal. Lantai lain disembunyikan agar rute tidak
      // tertutup pelat lantai di atasnya.
      if (multiFloor) setFloorView(start.floor);
      return true;
    },
    [copy.noFloorRoute, copy.noSafeRoute, copy.routeHint, lang, mapObjectConfigs, multiFloor, navigation, objects],
  );

  const calculateRoute = useCallback(
    (record: SceneObjectRecord) => {
      if (!startPoint || !navigation) {
        setRouteMessage(copy.selectStartHint);
        return;
      }
      planRoute(startPoint, record);
    },
    [copy.selectStartHint, navigation, planRoute, startPoint],
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

  const entranceForDeparture = useCallback(
    (record: SceneObjectRecord, departure: number) => {
      const allowedDoor = DEPARTURE_ENTRANCE_BY_AREA[departure];
      if (!allowedDoor) return null;

      const target = recordCenter(record).point;
      let best: { record: SceneObjectRecord; distance: number } | null = null;
      for (const entrance of objects) {
        if (!allowedDoor.test(entrance.name)) continue;
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
        setRouteMessage(`${lang === "ID" ? "Tidak ada area jalan di dekat" : "No walkway near"} ${fromName}.`);
        return;
      }
      setSelectingStart(false);
      setQuery("");
      setStartPoint(start);
      setStartName(fromName);
      planRoute(start, to);
    },
    [lang, navigation, planRoute],
  );

  const routeToDeparture = useCallback(
    (departure: number) => {
      const target = objects.find((record) => record.selectableLabel === `Departure ${departure}`);
      if (!target) {
        setRouteMessage(`${lang === "ID" ? "Area Departure" : "Departure area"} ${departure} ${lang === "ID" ? "belum ditandai pada peta." : "is not marked on the map."}`);
        return;
      }
      const entrance = entranceForDeparture(target, departure);
      if (!entrance) {
        const door = departure <= 2 ? "1A" : departure === 3 ? "1B" : "1C";
        setRouteMessage(lang === "ID" ? `Pintu Keberangkatan ${door} belum ditandai pada peta.` : `Departure door ${door} is not marked on the map yet.`);
        return;
      }
      startPassengerRoute(entrance, entranceLabel(entrance.name), target);
    },
    [entranceForDeparture, lang, objects, startPassengerRoute],
  );

  const routeToGate = useCallback(
    (gate: number, departure: number | null) => {
      const target = gateRecords.get(gate);
      if (!target) {
        setRouteMessage(lang === "ID" ? `Gate ${gate} tidak ada pada peta Lantai 2.` : `Gate ${gate} is not available on the second-floor map.`);
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
        setSelected(selection);
        const config = mapObjectConfigs[record.name] ?? defaultMapObjectConfig(record.name);
        const openDoors = config.entryDoors.filter((door) => door.open);
        if (openDoors.length > 0) {
          setRouteMessage(lang === "ID" ? "Pilih pintu masuk bangunan berdasarkan arah mata angin." : "Choose an open building entrance by compass direction.");
        } else {
          setBuildingAsStart(record);
        }
        return;
      }
      if (!record) return;
      if (startPoint) calculateRoute(record);
      else setBuildingAsStart(record);
    },
    [calculateRoute, lang, mapObjectConfigs, objects, selectingStart, setBuildingAsStart, startPoint],
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
    // Klik manual harus menjadi sumber lokasi tunggal agar pembacaan GPS
    // yang datang bersamaan tidak mengganti titik yang dipilih pengguna.
    setAutomaticLocation(false);
    setLocationMapped(false);
    setViewMode("map");
    clearRoute();
    setRouteMessage(multiFloor
      ? (lang === "EN" ? "Click a floor area or building to choose your starting point. Use the floor buttons to switch floors." : "Klik area lantai atau building pada peta untuk memilih titik awal. Pilih lantai lewat tombol lantai.")
      : (lang === "EN" ? "Click a floor area or building to choose your starting point." : "Klik area lantai atau building pada peta untuk memilih titik awal."));
  }, [clearRoute, lang, multiFloor]);

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

  const toggleLiveTracking = useCallback(() => {
    setLiveTracking((active) => {
      if (active) {
        setLivePosition(null);
        liveReadingTimestamp.current = null;
        return false;
      }
      setAutomaticLocation(true);
      setLivePosition(startWorldPoint);
      return true;
    });
  }, [startWorldPoint]);

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

  const startOrResumeRoute = useCallback(() => {
    if (!routeMetrics) return;
    // Hanya rute yang sudah selesai yang boleh diulang dari awal. Selama
    // masih berjalan, kamera dan controller mempertahankan jarak tempuhnya.
    if (!routeProgress || routeProgress.progress >= 1) {
      restartActiveRoute();
      return;
    }
    setRoutePaused(false);
    setViewMode("pov");
    setRouteRecenterToken((value) => value + 1);
  }, [restartActiveRoute, routeMetrics, routeProgress]);

  const handlePlaybackComplete = useCallback(() => {
    setRoutePaused(true);
  }, []);


  const resetRoute = useCallback(() => {
    setLiveTracking(false);
    setLivePosition(null);
    if (!automaticLocation) {
      setStartPoint(null);
      setStartName(null);
    }
    clearRoute();
    setRouteMessage(copy.selectStartHint);
    setSelected(null);
    setQuery("");
    setSelectingStart(false);
    setViewMode("map");
    window.requestAnimationFrame(() => viewerApi.current?.resetView());
  }, [automaticLocation, clearRoute, copy.selectStartHint]);

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
  const traveledRouteDistance = useMemo(() => {
    if (!routeMetrics) return 0;
    const simulatedDistance = routeProgress?.distance ?? 0;
    const gpsDistance = liveTracking && livePosition
      ? nearestRouteDistance(routeMetrics, livePosition)
      : 0;
    return Math.min(routeMetrics.totalDistance, Math.max(simulatedDistance, gpsDistance));
  }, [livePosition, liveTracking, routeMetrics, routeProgress]);
  const remainingRouteDistance = routeMetrics
    ? Math.max(0, routeMetrics.totalDistance - traveledRouteDistance)
    : 0;
  const remainingRouteMinutes = remainingRouteDistance > 0
    ? Math.ceil(remainingRouteDistance / 1.35 / 60)
    : 0;
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
      data-has-selected={Boolean(selected)}
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
              showObjectLabels
              selectedUuid={selected?.uuid ?? null}
              onSelect={handleSelect}
              onSelectPoint={selectingStart && navigation ? handleManualStartPoint : undefined}
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
              visitorPosition={liveTracking ? livePosition : (visibleRouteProgress?.position ?? null)}
            />
          </Suspense>
          <CameraController
            ref={viewerApi}
            bounds={bounds}
            viewMode={viewMode}
            onHeadingChange={setCompassRotation}
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

      <LoadingOverlay modelReady={bounds !== null} lang={lang} />
      <FloorSwitcher view={shownFloorView} floors={modelFloors.length ? modelFloors : ["L1"]} onSelect={changeFloor} />

      <aside
        className="sea-planner"
        data-expanded={mobileSheetExpanded ? "true" : "false"}
        data-route-active={routeSessionActive ? "true" : "false"}
        data-view-mode={viewMode}
        aria-label={lang === "ID" ? "Pencarian rute" : "Route search"}
      >
        <div
          className="sea-sheet-handle"
          onClick={() => setMobileSheetExpanded((prev) => !prev)}
          onTouchStart={handleSheetTouchStart}
          onTouchEnd={handleSheetTouchEnd}
          aria-hidden="true"
        />
        <div
          className="sea-planner-heading"
          onClick={() => setMobileSheetExpanded((prev) => !prev)}
          onTouchStart={handleSheetTouchStart}
          onTouchEnd={handleSheetTouchEnd}
        >
          <div className="sea-planner-heading-titles">
            <h1>{copy.directions}</h1>
            <span>TERMINAL 1 · {floorViewLabel(shownFloorView, modelFloors.length ? modelFloors : ["L1"]).toLocaleUpperCase("id-ID")}</span>
          </div>
          <button
            type="button"
            className="sea-planner-mobile-toggle"
            onClick={(e) => {
              e.stopPropagation();
              setMobileSheetExpanded((prev) => !prev);
            }}
            aria-label={mobileSheetExpanded ? "Kecilkan panel" : "Perbesar panel"}
          >
            {mobileSheetExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>
        </div>
        <div className="sea-planner-body">
        <div className="sea-live-location" data-state={locationMapped ? "active" : passengerLocation.status} role="status" aria-live="polite">
          <div className="sea-live-location-main">
            {locationMapped ? <Crosshair size={16} /> : passengerLocation.status === "checking" ? <LoaderCircle size={16} className="sea-location-spinner" /> : <MapPin size={16} />}
            <span>
              <strong>{!automaticLocation ? (lang === "ID" ? "Pilih posisi Anda di peta" : "Choose your position on the map") : locationMapped ? copy.locationActive : passengerLocation.status === "checking" ? copy.locating : passengerLocation.status === "denied" ? copy.locationDenied : passengerLocation.status === "timeout" ? copy.locationTimeout : passengerLocation.status === "unavailable" ? copy.locationUnavailable : usableLocationReading ? copy.locationActive : (passengerLocation.reading ? (passengerLocation.reading.accuracy > T1_GEO_CALIBRATION.maximumUsableAccuracyMeters ? copy.locationInaccurate : copy.locationOutside) : copy.locating)}</strong>
              <small>{usableLocationReading ? `±${Math.round(usableLocationReading.accuracy)} m${locationMapped ? ` · ${FLOOR_LABELS[passengerFloor]}` : ""}` : copy.locationFloorNote}</small>
            </span>
          </div>
          <div className="sea-live-location-actions">
            {modelFloors.length > 1 && (["L1", "L2"] as FloorId[]).filter((floor) => modelFloors.includes(floor)).map((floor) => (
              <button key={floor} type="button" className={passengerFloor === floor ? "is-selected" : ""} onClick={() => { setPassengerFloor(floor); setAutomaticLocation(true); setLocationMapped(false); }} aria-pressed={passengerFloor === floor}>{FLOOR_LABELS[floor]}</button>
            ))}
          </div>
        </div>
        <div className="sea-trip-fields">
          <button type="button" className={selectingStart ? "is-current" : ""} onClick={() => { beginStartSelection(); setMobileSheetExpanded(true); }} disabled={!navigation}>
            <span className="sea-pin is-origin" />
            <span><small>{copy.from}</small><strong>{startName ?? copy.chooseStart}</strong></span>
          </button>
          <button type="button" className={!selectingStart ? "is-current" : ""} onClick={() => { setSelectingStart(false); setQuery(""); setSearchFocused(true); setMobileSheetExpanded(true); }} disabled={!startPoint}>
            <span className="sea-pin is-destination" />
            <span><small>{copy.to}</small><strong>{routeSessionActive ? destinationName : copy.chooseDestination}</strong></span>
          </button>
        </div>
        <div className="sea-search-wrap">
          <label className="sea-search">
            <Search size={18} />
            <input value={query} onChange={(event) => { setQuery(event.target.value); setSearchFocused(true); }} onFocus={() => { setSearchFocused(true); setMobileSheetExpanded(true); }} onBlur={() => window.setTimeout(() => setSearchFocused(false), 140)} placeholder={`${selectingStart || !startPoint ? copy.searchStart : copy.searchDestination} (${searchPlaceholderExample})`} aria-label={selectingStart || !startPoint ? copy.searchStart : copy.searchDestination} />
            {query && <button type="button" onClick={() => setQuery("")} aria-label={copy.clearSearch}><X size={16} /></button>}
          </label>
          {searchFocused && query && <div className="sea-search-results">
            {searchResults.length ? searchResults.map((record) => {
              const displayName = mapObjectConfigs[record.name]?.displayName?.trim();
              const floorNote = multiFloor ? ` · ${FLOOR_LABELS[record.floor]}` : "";
              return <button key={record.uuid} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => chooseSearchResult(record)}><MapPin size={16} /><span><strong>{displayName || record.selectableLabel || record.name}</strong><small>{displayName || record.selectableLabel ? `${record.name} · ${record.metadata.category}` : record.metadata.category}{floorNote}</small></span></button>;
            }) : <p>{copy.noResults}</p>}
          </div>}
        </div>
        <p className="sea-hint" role="status">{gridError ?? routeMessage}</p>
        {routeMetrics && routeSteps.length > 0 && <div className="sea-route-details">
          <div className="sea-route-summary"><div><strong>{Math.round(remainingRouteDistance)} m</strong><span>Perkiraan {remainingRouteMinutes} menit{routeFloorsText ? ` · ${routeFloorsText}` : ""}</span></div><button type="button" onClick={resetRoute} aria-label="Hapus rute"><X size={18} /></button></div>
          <div className="sea-step-header"><h2>{copy.stepTitle}</h2><span>{activeStepIndex + 1} / {routeSteps.length}</span></div>
          <ol className="sea-step-list">{routeSteps.map((step, index) => <li key={`${step.kind}-${step.startIndex}`}><button type="button" className={index === activeStepIndex ? "is-active" : ""} onClick={() => selectRouteStep(index)} aria-current={index === activeStepIndex ? "step" : undefined}><span className="sea-step-number">{index + 1}</span><span><strong>{step.label}</strong><small>{step.kind === "arrive" ? destinationName : step.kind === "up" || step.kind === "down" ? "Ikuti papan petunjuk ke lantai tujuan" : `Sekitar ${Math.round(step.distance)} m${multiFloor && routePointFloors[step.startIndex] ? ` · ${FLOOR_LABELS[routePointFloors[step.startIndex]]}` : ""}`}</small></span></button></li>)}</ol>
        </div>}
        </div>
        {routeMetrics && routeSteps.length > 0 && (
          <div className="sea-route-actions">
            <div className="sea-step-controls">
              <button
                type="button"
                className="sea-btn-card sea-btn-step-prev"
                onClick={() => selectRouteStep(activeStepIndex - 1)}
                disabled={activeStepIndex === 0}
              >
                <ChevronLeft size={13} />
                <span>{copy.previous}</span>
              </button>
              <button
                type="button"
                className="sea-btn-card sea-btn-step-next"
                onClick={() => selectRouteStep(activeStepIndex + 1)}
                disabled={activeStepIndex >= routeSteps.length - 1}
              >
                <span>{copy.next}</span>
                <ChevronRight size={13} />
              </button>
            </div>
            <div className={`sea-simulation-controls${viewMode === "pov" ? " is-pov" : ""}`}>
              <button
                type="button"
                className={`sea-btn-card sea-btn-live-navigation${liveTracking ? " is-active" : ""}`}
                onClick={toggleLiveTracking}
                aria-pressed={liveTracking}
                title={liveTracking ? "Hentikan navigasi GPS" : "Mulai navigasi GPS"}
              >
                <MousePointer2 size={13} />
                <span>{liveTracking ? "Hentikan GPS" : "Mulai navigasi GPS"}</span>
              </button>
              {viewMode === "pov" ? (
                <>
                  <button
                    type="button"
                    className="sea-btn-card sea-btn-pov-map"
                    onClick={showMapView}
                  >
                    <RotateCcw size={12} />
                    <span>{copy.mapView}</span>
                  </button>
                  <button
                    type="button"
                    className="sea-btn-card sea-btn-pov-pause"
                    onClick={toggleRoutePause}
                  >
                    {routePaused ? <Play size={12} fill="currentColor" /> : <Pause size={12} />}
                    <span>{routePaused ? copy.resume : copy.pause}</span>
                  </button>
                  <button
                    type="button"
                    className="sea-btn-card sea-btn-pov-center"
                    onClick={recenterActiveRoute}
                  >
                    <Compass size={12} />
                    <span>{copy.center}</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="sea-btn-card sea-btn-simulation-primary"
                  onClick={startOrResumeRoute}
                >
                  <Play size={13} fill="currentColor" />
                  <span>{routeProgress && routeProgress.progress < 1 ? copy.continueSimulation : copy.simulation}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </aside>

      <div className="sea-map-actions" aria-label={lang === "ID" ? "Kontrol peta" : "Map controls"}><button type="button" onClick={showMapView} disabled={!bounds} aria-label={copy.showMap}><RotateCcw size={18} /></button><button type="button" onClick={() => viewerApi.current?.zoomIn()} disabled={!bounds} aria-label={copy.zoomIn}><Plus size={18} /></button><button type="button" onClick={() => viewerApi.current?.zoomOut()} disabled={!bounds} aria-label={copy.zoomOut}><Minus size={18} /></button><button type="button" onClick={togglePassengerLocation} disabled={!bounds} aria-pressed={automaticLocation} aria-label={automaticLocation ? (lang === "ID" ? "Nonaktifkan lokasi GPS" : "Turn GPS location off") : (lang === "ID" ? "Aktifkan lokasi GPS" : "Turn GPS location on")} title={automaticLocation ? (lang === "ID" ? "Nonaktifkan lokasi GPS" : "Turn GPS location off") : (lang === "ID" ? "Aktifkan lokasi GPS" : "Turn GPS location on")}>{automaticLocation ? <LocateFixed size={18} /> : <LocateOff size={18} />}</button><button type="button" className="map-exterior-toggle" onClick={() => setShowExterior((value) => !value)} disabled={!bounds || shownFloorView === "L2"} aria-pressed={showExterior} aria-label={showExterior ? copy.hideExterior : copy.showExterior} title={lang === "ID" ? "Area luar gedung" : "Exterior area"}><Trees size={18} /></button></div>
      {exteriorAttribution && <p className="map-attribution">Area luar: {exteriorAttribution}</p>}

      <div className="map-compass" aria-label={copy.compass} style={{ transform: `rotate(${compassRotation}deg)` }}>
        <span className="map-compass-label map-compass-north">{lang === "ID" ? "U" : "N"}</span>
        <span className="map-compass-label map-compass-east">{lang === "ID" ? "T" : "E"}</span>
        <span className="map-compass-label map-compass-south">S</span>
        <span className="map-compass-label map-compass-west">{lang === "ID" ? "B" : "W"}</span>
        <span className="map-compass-center">＋</span>
      </div>

      {selected && selectedLocationConfig && <aside className="sea-location-info" aria-label={`Informasi ${selectedLocationConfig.displayName || selected.name}`}>
        <div className="sea-sheet-handle" aria-hidden="true" />
        <button
          type="button"
          className="sea-location-close-btn"
          onClick={() => setSelected(null)}
          aria-label={lang === "ID" ? "Tutup informasi tempat" : "Close place information"}
        >
          <X size={18} />
        </button>
        {getMapObjectPhotoUrl(selectedLocationConfig.photoUrl) && <img src={getMapObjectPhotoUrl(selectedLocationConfig.photoUrl)} alt={`Tampak depan ${selectedLocationConfig.displayName || selected.name}`} />}
        <div className="sea-location-info-body">
          <span className="sea-location-kicker">{selectedLocationConfig.entityType === "FACILITY" ? copy.facility : copy.tenant}</span>
          <h2>{selectedLocationConfig.displayName || selected.name}</h2>
          <span className="sea-location-category">{selected.category}{multiFloor ? ` · ${selected.location.replace(/^Terminal 1 - /, "")}` : ""}</span>
          {selectedLocationConfig.description && <p>{selectedLocationConfig.description}</p>}
          <div className="sea-location-hours"><strong>Jam operasional</strong><span>{selectedLocationConfig.entityType === "FACILITY" || (!selectedLocationConfig.openTime && !selectedLocationConfig.closeTime) ? "Buka 24 jam" : `${selectedLocationConfig.openTime} – ${selectedLocationConfig.closeTime}`}</span></div>
          {(selectedLocationConfig.activeFrom || selectedLocationConfig.activeUntil) && <div className="sea-location-hours"><strong>Masa aktif</strong><span>{selectedLocationConfig.activeFrom || "Sekarang"} – {selectedLocationConfig.activeUntil || "Tidak ditentukan"}</span></div>}
          {selectedLocationConfig.contact && <div className="sea-location-contact">{selectedLocationConfig.contact}</div>}
          <div className="sea-location-links">{selectedLocationConfig.websiteUrl && <a href={selectedLocationConfig.websiteUrl} target="_blank" rel="noreferrer">Website</a>}{selectedLocationConfig.instagramUrl && <a href={selectedLocationConfig.instagramUrl} target="_blank" rel="noreferrer">Instagram</a>}</div>
          <div className="sea-location-actions">
            <button
              type="button"
              className="sea-loc-action-route"
              onClick={() => {
                const record = objects.find((item) => item.uuid === selected.uuid);
                if (record) {
                  if (startPoint) {
                    calculateRoute(record);
                  } else {
                    const departure = requiredDepartureForRecord(record);
                    const entrance = departure !== null
                      ? entranceForDeparture(record, departure)
                      : nearestEntrance(record);
                    if (entrance) {
                      startPassengerRoute(entrance, entranceLabel(entrance.name), record);
                    } else {
                      setBuildingAsStart(record);
                    }
                  }
                  setSelected(null);
                }
              }}
            >
              <Navigation size={15} />
              <span>{copy.directions}</span>
            </button>
            <button
              type="button"
              className="sea-loc-action-start"
              onClick={() => {
                const record = objects.find((item) => item.uuid === selected.uuid);
                if (record) {
                  setBuildingAsStart(record);
                  setSelected(null);
                }
              }}
            >
              <MapPin size={15} />
              <span>{copy.chooseStart}</span>
            </button>
          </div>
        </div>
      </aside>}

    </main>
  );
}
