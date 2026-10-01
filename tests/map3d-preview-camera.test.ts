import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";

test("home preview frames a close-up rather than shrinking the entire terminal", async () => {
  const cameraModule = await import("../src/lib/map3d/preview-camera").catch(() => null);
  assert.ok(cameraModule?.getPreviewCameraPose, "Close-up preview camera is unavailable");

  const center = new THREE.Vector3(0, 0, 0);
  const size = new THREE.Vector3(560, 4, 80);
  for (const aspect of [1.8, 1.25]) {
    const { position, target } = cameraModule.getPreviewCameraPose(center, size, aspect, 65);
    const camera = new THREE.PerspectiveCamera(65, aspect, 0.1, 2000);
    camera.position.copy(position);
    camera.lookAt(target);
    camera.updateMatrixWorld();

    const midLeft = new THREE.Vector3(-100, 0, 0).project(camera).x;
    const midRight = new THREE.Vector3(100, 0, 0).project(camera).x;
    const farLeft = new THREE.Vector3(-280, 0, 0).project(camera).x;
    const farRight = new THREE.Vector3(280, 0, 0).project(camera).x;

    assert.ok(midLeft < -0.4 && midRight > 0.4, `The central terminal is too small at aspect ${aspect}`);
    assert.ok(farLeft < -1 && farRight > 1, `The entire terminal still fits at aspect ${aspect}`);
    assert.ok(position.y > target.y, "The preview must stay above the floor");
  }
});
