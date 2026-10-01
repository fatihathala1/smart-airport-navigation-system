import assert from "node:assert/strict";
import test from "node:test";
import { createRouteMetrics } from "../src/lib/map3d/route-guidance";
import { createRouteSteps, getStepPoints } from "../src/lib/map3d/route-steps";

test("turns an SVG route into ordered walking instructions", () => {
  const metrics = createRouteMetrics([
    [0, 0, 0],
    [0, 0, 10],
    [10, 0, 10],
    [10, 0, 20],
  ]);
  assert.ok(metrics);
  const steps = createRouteSteps(metrics);
  assert.deepEqual(steps.map((step) => step.kind), ["straight", "right", "left", "arrive"]);
  assert.deepEqual(steps.map((step) => Math.round(step.distance)), [10, 10, 10, 0]);
  assert.deepEqual(getStepPoints(metrics, steps[1]).map((point) => point.toArray()), [
    [0, 0, 10],
    [10, 0, 10],
  ]);
});

test("ignores tiny bends and keeps a final arrival instruction", () => {
  const metrics = createRouteMetrics([
    [0, 0, 0],
    [0.2, 0, 5],
    [0, 0, 10],
    [0, 0, 20],
  ]);
  assert.ok(metrics);
  const steps = createRouteSteps(metrics);
  assert.deepEqual(steps.map((step) => step.kind), ["straight", "arrive"]);
  assert.equal(steps[0].endIndex, metrics.points.length - 1);
});
