"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { SceneModel, type SceneBounds } from "./SceneModel";
import { getPreviewCameraPose } from "@/lib/map3d/preview-camera";
import styles from "./Map3DPreview.module.css";

function PreviewCamera({ bounds }: { bounds: SceneBounds | null }) {
  const { camera, invalidate, size } = useThree();

  useEffect(() => {
    if (!bounds || !(camera instanceof THREE.PerspectiveCamera)) return;
    const pose = getPreviewCameraPose(bounds.center, bounds.size, size.width / Math.max(size.height, 1), camera.fov);
    camera.position.copy(pose.position);
    camera.lookAt(pose.target);
    invalidate();
  }, [bounds, camera, invalidate, size.height, size.width]);

  return null;
}

export function Map3DPreviewCanvas() {
  const [bounds, setBounds] = useState<SceneBounds | null>(null);
  const handleReady = useCallback((nextBounds: SceneBounds) => setBounds(nextBounds), []);

  return (
    <>
      <Canvas
        className={styles.canvas}
        dpr={[1, 1.5]}
        frameloop="demand"
        camera={{ fov: 65, near: 0.01, far: 100000, position: [0, 10, 10] }}
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      >
        <ambientLight intensity={0.9} />
        <hemisphereLight intensity={1.1} color="#ffffff" groundColor="#8b949b" />
        <directionalLight position={[12, 20, 10]} intensity={1.7} />
        <Suspense fallback={null}>
          <SceneModel selectedUuid={null} onSelect={() => undefined} onReady={handleReady} />
        </Suspense>
        <PreviewCamera bounds={bounds} />
      </Canvas>
      {!bounds && <span className={styles.placeholder}>Memuat model 3D...</span>}
    </>
  );
}
