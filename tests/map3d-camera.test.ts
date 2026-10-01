import assert from "node:assert/strict";
import test from "node:test";
import { MOUSE, PerspectiveCamera } from "three";
import { OrbitControls } from "three-stdlib";
import { getMapOrbitLimits } from "../src/lib/map3d/map-camera";

test("map orbit never moves the camera below its target", () => {
  const camera = new PerspectiveCamera();
  camera.position.set(0, -10, 10);
  const controls = new OrbitControls(camera);
  Object.assign(controls, getMapOrbitLimits());
  controls.update();

  assert.ok(camera.position.y > controls.target.y);
  assert.ok(controls.getPolarAngle() < Math.PI / 2);
});

test("dragging the map pans along the floor instead of under it", () => {
  const camera = new PerspectiveCamera(70, 1, 0.1, 1000);
  camera.position.set(0, 10, 10);
  const documentEvents = new EventTarget();
  const surface = Object.assign(new EventTarget(), {
    ownerDocument: documentEvents,
    style: {},
    clientWidth: 1000,
    clientHeight: 1000,
    setPointerCapture: () => undefined,
    releasePointerCapture: () => undefined,
  });
  const controls = new OrbitControls(camera, surface as unknown as HTMLElement);
  Object.assign(controls, getMapOrbitLimits());
  controls.mouseButtons.LEFT = MOUSE.PAN;

  const pointer = (type: string, pageY: number) =>
    Object.assign(new Event(type), {
      pointerId: 1,
      pointerType: "mouse",
      button: 0,
      pageX: 500,
      pageY,
      clientX: 500,
      clientY: pageY,
    });
  surface.dispatchEvent(pointer("pointerdown", 500));
  documentEvents.dispatchEvent(pointer("pointermove", 800));
  documentEvents.dispatchEvent(pointer("pointerup", 800));

  assert.ok(Math.abs(controls.target.y) < 0.000001, `target y: ${controls.target.y}`);
  assert.ok(camera.position.y > controls.target.y);
});
