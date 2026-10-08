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

test("a floor change becomes its own step with the connector label", () => {
  const metrics = createRouteMetrics([
    [0, 0, 0],
    [0, 0, 10],
    [6, 3, 10],
    [6, 3, 20],
  ]);
  assert.ok(metrics);
  const steps = createRouteSteps(metrics, [{ index: 1, direction: "up", label: "Naik eskalator ke Lantai 2" }]);
  assert.deepEqual(steps.map((step) => step.kind), ["straight", "up", "straight", "arrive"]);
  assert.equal(steps[1].label, "Naik eskalator ke Lantai 2");
  assert.deepEqual([steps[1].startIndex, steps[1].endIndex], [1, 2]);
});
