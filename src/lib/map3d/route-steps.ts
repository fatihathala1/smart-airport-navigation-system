import type * as THREE from "three";
import type { RouteMetrics } from "./route-guidance";

export type RouteStep = {
  kind: "straight" | "left" | "right" | "up" | "down" | "arrive";
  label: string;
  distance: number;
  startIndex: number;
  endIndex: number;
};

/**
 * Perpindahan lantai pada rute. Segmen dari titik `index` ke `index + 1`
 * adalah lintasan eskalator atau tangga.
 */
export type RouteStepTransition = {
  index: number;
  direction: "up" | "down";
  label: string;
};

export function createRouteSteps(metrics: RouteMetrics, transitions: readonly RouteStepTransition[] = []): RouteStep[] {
  const rides = new Map(transitions.map((transition) => [transition.index, transition]));
  const isRidePoint = (index: number) => rides.has(index) || rides.has(index - 1);

  const turns: { index: number; kind: "left" | "right" }[] = [];
  for (let index = 1; index < metrics.points.length - 1; index += 1) {
    // Belokan tepat di ujung eskalator sudah tercakup oleh langkah naik/turun.
    if (isRidePoint(index)) continue;
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

  const lastIndex = metrics.points.length - 1;
  const cuts = new Map<number, RouteStep["kind"]>();
  for (const turn of turns) cuts.set(turn.index, turn.kind);
  for (const ride of transitions) {
    if (ride.index >= lastIndex) continue;
    cuts.set(ride.index, ride.direction);
    // Setelah turun dari eskalator, jalan lagi lurus.
    if (ride.index + 1 < lastIndex && !cuts.has(ride.index + 1)) cuts.set(ride.index + 1, "straight");
  }
  const boundaries = [0, ...[...cuts.keys()].filter((index) => index > 0).sort((left, right) => left - right), lastIndex];

  const steps: RouteStep[] = [];
  for (let index = 0; index < boundaries.length - 1; index += 1) {
    const startIndex = boundaries[index];
    const endIndex = boundaries[index + 1];
    if (endIndex <= startIndex) continue;
    const kind = (index === 0 ? cuts.get(0) : cuts.get(startIndex)) ?? "straight";
    const distance = metrics.cumulativeDistances[endIndex] - metrics.cumulativeDistances[startIndex];
    if (distance < 0.01) continue;
    steps.push({
      kind,
      label: rides.get(startIndex)?.label
        ?? (kind === "left" ? "Belok kiri" : kind === "right" ? "Belok kanan" : "Jalan lurus"),
      distance,
      startIndex,
      endIndex,
    });
  }
  steps.push({ kind: "arrive", label: "Tiba di tujuan", distance: 0, startIndex: lastIndex, endIndex: lastIndex });
  return steps;
}

export function getStepPoints(metrics: RouteMetrics, step: RouteStep): THREE.Vector3[] {
  if (step.kind === "arrive") return [metrics.points[step.startIndex]];
  return metrics.points.slice(step.startIndex, step.endIndex + 1);
}
