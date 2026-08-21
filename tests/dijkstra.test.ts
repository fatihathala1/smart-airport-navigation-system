import test from "node:test";
import assert from "node:assert/strict";
import { etaMinutes, findShortestRoute } from "../src/lib/dijkstra";
import type { WayfindingEdge, WayfindingNode } from "../src/types";

const nodes: WayfindingNode[] = [
  { id: "A", floorId: "F1", floorLabel: "Lantai 1", x: 0, y: 0 },
  { id: "B", floorId: "F1", floorLabel: "Lantai 1", x: 1, y: 0 },
  { id: "C", floorId: "F1", floorLabel: "Lantai 1", x: 2, y: 0 },
  { id: "D", floorId: "F2", floorLabel: "Lantai 2", x: 2, y: 0 },
];
const makeEdge = (id: string, fromNodeId: string, toNodeId: string, distanceMeters: number, overrides: Partial<WayfindingEdge> = {}): WayfindingEdge => ({ id, fromNodeId, toNodeId, distanceMeters, type: "WALKWAY", direction: "BIDIRECTIONAL", publicAccess: true, accessible: true, active: true, ...overrides });

test("Dijkstra chooses the lowest total distance", () => {
  const result = findShortestRoute(nodes, [makeEdge("AB", "A", "B", 5), makeEdge("BC", "B", "C", 5), makeEdge("AC", "A", "C", 20)], "A", "C");
  assert.deepEqual(result?.nodes.map((node) => node.id), ["A", "B", "C"]);
  assert.equal(result?.totalDistanceMeters, 10);
});

test("one-way edges cannot be traversed backwards", () => {
  const edges = [makeEdge("AB", "A", "B", 5, { direction: "ONE_WAY" })];
  assert.ok(findShortestRoute(nodes, edges, "A", "B"));
  assert.equal(findShortestRoute(nodes, edges, "B", "A"), null);
});

test("inactive and restricted edges are filtered for public routing", () => {
  assert.equal(findShortestRoute(nodes, [makeEdge("AB", "A", "B", 5, { active: false })], "A", "B"), null);
  assert.equal(findShortestRoute(nodes, [makeEdge("AB", "A", "B", 5, { publicAccess: false })], "A", "B"), null);
  assert.ok(findShortestRoute(nodes, [makeEdge("AB", "A", "B", 5, { publicAccess: false })], "A", "B", { allowRestricted: true }));
});

test("returns null when no route exists", () => assert.equal(findShortestRoute(nodes, [], "A", "D"), null));

test("distance, configurable ETA, and connector instruction are returned", () => {
  const result = findShortestRoute(nodes, [makeEdge("AC", "A", "C", 72), makeEdge("CD", "C", "D", 12, { type: "LIFT" })], "A", "D", { walkingSpeedMetersPerMinute: 60 });
  assert.equal(result?.totalDistanceMeters, 84);
  assert.equal(result?.estimatedMinutes, 2);
  assert.deepEqual(result?.connectorInstructions, ["Gunakan lift dari Lantai 1 ke Lantai 2"]);
  assert.equal(etaMinutes(145, 72), 3);
});
