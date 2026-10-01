import type * as THREE from "three";
import type { RouteMetrics } from "./route-guidance";

export type RouteStep = {
  kind: "straight" | "left" | "right" | "arrive";
  label: string;
  distance: number;
  startIndex: number;
  endIndex: number;
};

export function createRouteSteps(metrics: RouteMetrics): RouteStep[] {
  const turns: { index: number; kind: "left" | "right" }[] = [];
  for (let index = 1; index < metrics.points.length - 1; index += 1) {
    const before = metrics.points[index].clone().sub(metrics.points[index - 1]);
    const after = metrics.points[index + 1].clone().sub(metrics.points[index]);
    before.y = 0;
    after.y = 0;
    if (before.lengthSq() < 0.04 || after.lengthSq() < 0.04) continue;
    before.normalize();
    after.normalize();
    if (before.angleTo(after) < Math.PI / 4) continue;
    const lastTurn = turns.at(-1);
    if (lastTurn && metrics.cumulativeDistances[index] - metrics.cumulativeDistances[lastTurn.index] < 4) continue;
    turns.push({
      index,
      kind: before.z * after.x - before.x * after.z >= 0 ? "right" : "left",
    });
  }

  const steps: RouteStep[] = [];
  const boundaries = [0, ...turns.map((turn) => turn.index), metrics.points.length - 1];
  for (let index = 0; index < boundaries.length - 1; index += 1) {
    const startIndex = boundaries[index];
    const endIndex = boundaries[index + 1];
    const kind = index === 0 ? "straight" : turns[index - 1].kind;
    const distance = metrics.cumulativeDistances[endIndex] - metrics.cumulativeDistances[startIndex];
    if (distance < 0.01) continue;
    steps.push({
      kind,
      label: kind === "straight" ? "Jalan lurus" : kind === "left" ? "Belok kiri" : "Belok kanan",
      distance,
      startIndex,
      endIndex,
    });
  }
  const lastIndex = metrics.points.length - 1;
  steps.push({ kind: "arrive", label: "Tiba di tujuan", distance: 0, startIndex: lastIndex, endIndex: lastIndex });
  return steps;
}

export function getStepPoints(metrics: RouteMetrics, step: RouteStep): THREE.Vector3[] {
  if (step.kind === "arrive") return [metrics.points[step.startIndex]];
  return metrics.points.slice(step.startIndex, step.endIndex + 1);
}
