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
  X,
} from "lucide-react";
import * as THREE from "three";
import { PassengerRoadmap } from "./PassengerRoadmap";
import {
  SceneModel,
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
import { createRouteSteps, getStepPoints } from "@/lib/map3d/route-steps";
import {
  createSelectedObject,
  type SelectedObject,
} from "@/lib/map3d/object-metadata";
import { getMapOrbitLimits } from "@/lib/map3d/map-camera";
import { isMapModelLoading } from "@/lib/map3d/loading-state";
import { createGridFromSceneObjects } from "@/lib/map3d/scene-walkability";
import { findWalkableRoute, snapToWalkable, type Point2, type WalkableGrid } from "@/lib/map3d/walkable-grid";

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
        <span>MEMUAT GROUND FLOOR</span>
        <strong>{Math.round(progress)}%</strong>
      </div>
      <div className="loader-track">
        <div style={{ width: progress + "%" }} />
      </div>
    </div>
  );
}

export function AirportWayfinding() {
  const viewerApi = useRef<ViewerApi>(null);
  const [bounds, setBounds] = useState<SceneBounds | null>(null);
  const [objects, setObjects] = useState<SceneObjectRecord[]>([]);
  const [selected, setSelected] = useState<SelectedObject | null>(null);
  const [query, setQuery] = useState(() =>
    typeof window === "undefined"
      ? ""
      : new URLSearchParams(window.location.search).get("q")?.trim() ?? "",
  );
  const [searchFocused, setSearchFocused] = useState(() =>
    typeof window !== "undefined" && Boolean(new URLSearchParams(window.location.search).get("q")?.trim()),
  );
  const [walkGrid, setWalkGrid] = useState<WalkableGrid | null>(null);
  const [gridError, setGridError] = useState<string | null>(null);
  const [startPoint, setStartPoint] = useState<Point2 | null>(null);
  const [destinationPoint, setDestinationPoint] = useState<Point2 | null>(null);
  const [startName, setStartName] = useState<string | null>(null);
  const [destinationName, setDestinationName] = useState<string | null>(null);
  const [routeWorldPoints, setRouteWorldPoints] = useState<RouteWorldPoint[]>([]);
  const [routeMessage, setRouteMessage] = useState("Pilih posisi awal terlebih dahulu.");
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [selectingStart, setSelectingStart] = useState(false);
  const [viewMode, setViewMode] = useState<CameraMode>("map");
  const [routePaused, setRoutePaused] = useState(false);
  const [routeProgress, setRouteProgress] =
    useState<RoutePlaybackSnapshot | null>(null);
  const [routeRestartToken, setRouteRestartToken] = useState(0);
  const [routeRecenterToken, setRouteRecenterToken] = useState(0);
  const handleReady = useCallback(
    (nextBounds: SceneBounds, nextObjects: SceneObjectRecord[]) => {
      setBounds(nextBounds);
      setObjects(nextObjects);
      try {
        setWalkGrid(createGridFromSceneObjects(nextObjects));
        setGridError(null);
      } catch (error) {
        setWalkGrid(null);
        setGridError(error instanceof Error ? error.message : "Area jalan dari model GLB tidak dapat diproses.");
      }
    },
    [],
  );

  const selectableBuildings = useMemo(
    () => objects.filter((record) => record.selectable),
    [objects],
  );

  const routeMetrics = useMemo(
    () => createRouteMetrics(routeWorldPoints),
    [routeWorldPoints],
  );
  const routeSessionActive = Boolean(routeMetrics);
  const routeSteps = useMemo(
    () => routeMetrics ? createRouteSteps(routeMetrics) : [],
    [routeMetrics],
  );
  const activeStep = routeSteps[activeStepIndex] ?? null;
  const highlightedPoints = useMemo(
    () => routeMetrics && activeStep
      ? getStepPoints(routeMetrics, activeStep).map((point) => point.toArray() as [number, number, number])
      : [],
    [activeStep, routeMetrics],
  );
  const visibleRouteProgress = useMemo(
    () =>
      routeProgress ??
      (routeMetrics ? createPlaybackSnapshot(routeMetrics, 0) : null),
    [routeMetrics, routeProgress],
  );
  const commitStartPoint = useCallback(
    (point: Point2, name: string) => {
      if (!walkGrid) return;
      const snapped = snapToWalkable(walkGrid, point);
      if (!snapped) {
        setRouteMessage("Tidak ada area jalan yang valid di dekat titik awal.");
        return;
      }
      setStartPoint(snapped);
      setStartName(name);
      setDestinationPoint(null);
      setDestinationName(null);
      setRouteWorldPoints([]);
      setRouteMessage("Titik awal berada di area jalan terdekat. Pilih tujuan.");
      setActiveStepIndex(0);
      setSelectingStart(false);
      setViewMode("map");
      setRouteProgress(null);
      setRoutePaused(false);
      viewerApi.current?.focusPoint(new THREE.Vector3(snapped[0], (bounds?.box.min.y ?? 0) + 0.2, snapped[1]));
    },
    [bounds, walkGrid],
  );

  const setBuildingAsStart = useCallback(
    (record: SceneObjectRecord) => {
      record.object.updateWorldMatrix(true, false);
      const center = new THREE.Box3()
        .setFromObject(record.object)
        .getCenter(new THREE.Vector3());
      setSelected(createSelectedObject(record.object));
      commitStartPoint([center.x, center.z], record.name);
    },
    [commitStartPoint],
  );

  const calculateRoute = useCallback(
    (record: SceneObjectRecord) => {
      if (!startPoint || !walkGrid) {
        setRouteMessage("Pilih posisi awal terlebih dahulu.");
        return;
      }
      record.object.updateWorldMatrix(true, false);
      const center = new THREE.Box3()
        .setFromObject(record.object)
        .getCenter(new THREE.Vector3());
      const points = findWalkableRoute(walkGrid, startPoint, [center.x, center.z]);
      if (!points) {
        setRouteProgress(null);
        setRoutePaused(false);
        setRouteWorldPoints([]);
        setDestinationPoint(null);
        setDestinationName(record.name);
        setRouteMessage("Tidak ditemukan jalur aman pada lantai yang tersedia. Coba titik awal atau tujuan lain.");
        return;
      }

      const elevation = (bounds?.box.min.y ?? 0) + 0.2;
      setRouteWorldPoints(points.map(([x, z]) => [x, elevation, z]));
      setDestinationPoint(points.at(-1) ?? null);
      setDestinationName(record.name);
      setRouteMessage("Rute terdekat menghindari tembok dan pilar, melalui bukaan pintu yang ada pada model.");
      setRouteProgress(null);
      setRoutePaused(false);
      setSelected(createSelectedObject(record.object));
      setActiveStepIndex(0);
      setViewMode("map");
    },
    [bounds, startPoint, walkGrid],
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
      .filter((item) =>
        item.name.toLocaleLowerCase("id-ID").includes(normalizedQuery),
      )
      .slice(0, 8);
  }, [query, selectableBuildings]);

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
    viewerApi.current?.focusObject(record.object);
  };

  const beginStartSelection = useCallback(() => {
    setQuery("");
    setSelectingStart(true);
    setViewMode("map");
    setRouteProgress(null);
    setRoutePaused(false);
    setRouteWorldPoints([]);
    setDestinationPoint(null);
    setDestinationName(null);
    setRouteMessage("Klik area lantai atau building pada peta untuk memilih titik awal.");
  }, []);

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
    const focusIndex = Math.round((step.startIndex + step.endIndex) / 2);
    window.requestAnimationFrame(() => {
      viewerApi.current?.focusPoint(routeMetrics.points[focusIndex]);
    });
  }, [routeMetrics, routeSteps]);

  useEffect(() => {
    if (!routeMetrics) return;
    const frame = window.requestAnimationFrame(() => viewerApi.current?.focusRoute(routeMetrics.points));
    return () => window.cancelAnimationFrame(frame);
  }, [routeMetrics]);

  const markerElevation = (bounds?.box.min.y ?? 0) + 0.2;
  const startWorldPoint: RouteWorldPoint | null = startPoint
    ? [startPoint[0], markerElevation, startPoint[1]]
    : null;
  const destinationWorldPoint: RouteWorldPoint | null = destinationPoint
    ? [destinationPoint[0], markerElevation, destinationPoint[1]]
    : null;

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
    setDestinationPoint(null);
    setStartName(null);
    setDestinationName(null);
    setRouteWorldPoints([]);
    setRouteMessage("Pilih posisi awal terlebih dahulu.");
    setSelected(null);
    setQuery("");
    setActiveStepIndex(0);
    setSelectingStart(false);
    setViewMode("map");
    setRouteProgress(null);
    setRoutePaused(false);
    window.requestAnimationFrame(() => viewerApi.current?.resetView());
  }, []);

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
      bounds: {
        min: routeBounds.min.toArray(),
        max: routeBounds.max.toArray(),
      },
    };
    console.info("[Terminal 1 geometry route audit]", routeReport);
    (
      window as Window & { __TERMINAL_ACTIVE_ROUTE_AUDIT__?: unknown }
    ).__TERMINAL_ACTIVE_ROUTE_AUDIT__ = routeReport;
  }, [routeMetrics]);

  return (
    <main
      className="viewer-shell"
      data-view-mode={viewMode}
      data-start-location={startName ?? ""}
      data-destination-location={destinationName ?? ""}
      data-route-active={routeSessionActive ? "true" : "false"}
      data-route-paused={routePaused ? "true" : "false"}
    >
      <PassengerRoadmap />
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
              selectedUuid={selected?.uuid ?? null}
              onSelect={handleSelect}
              onSelectFloor={selectingStart ? (point) => commitStartPoint([point.x, point.z], "Posisi pada peta") : undefined}
              onReady={handleReady}
            />
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

      <aside className="sea-planner" aria-label="Pencarian rute">
        <div className="sea-planner-heading">
          <span>TERMINAL 1 · LANTAI DASAR</span>
          <h1>Petunjuk arah</h1>
        </div>
        <div className="sea-trip-fields">
          <button type="button" className={selectingStart ? "is-current" : ""} onClick={beginStartSelection} disabled={!walkGrid}>
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
            <input value={query} onChange={(event) => { setQuery(event.target.value); setSearchFocused(true); }} onFocus={() => setSearchFocused(true)} onBlur={() => window.setTimeout(() => setSearchFocused(false), 140)} placeholder={selectingStart || !startPoint ? "Cari titik awal (T1-GF-...)" : "Cari tujuan (T1-GF-...)"} aria-label={selectingStart || !startPoint ? "Cari titik awal" : "Cari tujuan"} />
            {query && <button type="button" onClick={() => setQuery("")} aria-label="Hapus pencarian"><X size={16} /></button>}
          </label>
          {searchFocused && query && <div className="sea-search-results">
            {searchResults.length ? searchResults.map((record) => <button key={record.uuid} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => chooseSearchResult(record)}><MapPin size={16} /><span><strong>{record.name}</strong><small>{record.metadata.category}</small></span></button>) : <p>Tidak ditemukan. Coba kode building lain.</p>}
          </div>}
        </div>
        <p className="sea-hint" role="status">{gridError ?? routeMessage}</p>
        {routeMetrics && routeSteps.length > 0 && <div className="sea-route-details">
          <div className="sea-route-summary"><div><strong>{Math.round(routeMetrics.totalDistance)} m</strong><span>Perkiraan {Math.max(1, Math.ceil(routeMetrics.totalDistance / 1.35 / 60))} menit · lantai dasar</span></div><button type="button" onClick={resetRoute} aria-label="Hapus rute"><X size={18} /></button></div>
          <div className="sea-step-header"><h2>Langkah perjalanan</h2><span>{activeStepIndex + 1} / {routeSteps.length}</span></div>
          <ol className="sea-step-list">{routeSteps.map((step, index) => <li key={`${step.kind}-${step.startIndex}`}><button type="button" className={index === activeStepIndex ? "is-active" : ""} onClick={() => selectRouteStep(index)} aria-current={index === activeStepIndex ? "step" : undefined}><span className="sea-step-number">{index + 1}</span><span><strong>{step.label}</strong><small>{step.kind === "arrive" ? destinationName : `Sekitar ${Math.round(step.distance)} m`}</small></span></button></li>)}</ol>
          <div className="sea-step-controls"><button type="button" onClick={() => selectRouteStep(activeStepIndex - 1)} disabled={activeStepIndex === 0}>Sebelumnya</button><button type="button" onClick={() => selectRouteStep(activeStepIndex + 1)} disabled={activeStepIndex >= routeSteps.length - 1}>Berikutnya <ChevronRight size={16} /></button></div>
          <div className="sea-simulation-controls"><button type="button" onClick={viewMode === "pov" ? showMapView : restartActiveRoute}>{viewMode === "pov" ? "Lihat peta" : "Mulai simulasi 3D"}</button>{viewMode === "pov" && <><button type="button" onClick={toggleRoutePause}>{routePaused ? "Lanjut" : "Jeda"}</button><button type="button" onClick={recenterActiveRoute}>Pusatkan</button></>}</div>
        </div>}
      </aside>

      <div className="sea-map-actions" aria-label="Kontrol peta"><button type="button" onClick={showMapView} disabled={!bounds} aria-label="Tampilkan seluruh peta"><RotateCcw size={18} /></button><button type="button" onClick={() => viewerApi.current?.zoomIn()} disabled={!bounds} aria-label="Perbesar peta"><Plus size={18} /></button><button type="button" onClick={() => viewerApi.current?.zoomOut()} disabled={!bounds} aria-label="Perkecil peta"><Minus size={18} /></button></div>

    </main>
  );
}
