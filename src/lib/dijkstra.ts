import type { DijkstraResult, RouteOptions, RouteSegment, WayfindingEdge, WayfindingNode } from "@/types";

const DEFAULT_WALKING_SPEED_MPM = 72;

class MinHeap {
  private values: Array<{ id: string; distance: number }> = [];
  push(value: { id: string; distance: number }) {
    this.values.push(value);
    let index = this.values.length - 1;
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.values[parent].distance <= value.distance) break;
      this.values[index] = this.values[parent];
      index = parent;
    }
    this.values[index] = value;
  }
  pop() {
    const first = this.values[0];
    const last = this.values.pop();
    if (!first || !last || this.values.length === 0) return first;
    let index = 0;
    while (true) {
      const left = index * 2 + 1;
      const right = left + 1;
      if (left >= this.values.length) break;
      const smallest = right < this.values.length && this.values[right].distance < this.values[left].distance ? right : left;
      if (this.values[smallest].distance >= last.distance) break;
      this.values[index] = this.values[smallest];
      index = smallest;
    }
    this.values[index] = last;
    return first;
  }
  get size() { return this.values.length; }
}

export function etaMinutes(distanceMeters: number, speed = DEFAULT_WALKING_SPEED_MPM) {
  if (!Number.isFinite(speed) || speed <= 0) throw new Error("Walking speed must be greater than zero");
  return Math.max(1, Math.ceil(distanceMeters / speed));
}

export function findShortestRoute(nodes: WayfindingNode[], edges: WayfindingEdge[], startId: string, endId: string, options: RouteOptions = {}): DijkstraResult | null {
  const activeNodes = new Map(nodes.filter((node) => node.active !== false).map((node) => [node.id, node]));
  if (!activeNodes.has(startId) || !activeNodes.has(endId)) return null;
  const adjacency = new Map<string, Array<{ edge: WayfindingEdge; nextId: string }>>();
  const add = (id: string, edge: WayfindingEdge, nextId: string) => adjacency.set(id, [...(adjacency.get(id) ?? []), { edge, nextId }]);
  for (const edge of edges) {
    if (!edge.active || edge.distanceMeters <= 0) continue;
    if (!options.allowRestricted && !edge.publicAccess) continue;
    if (options.accessibleOnly && !edge.accessible) continue;
    if (!activeNodes.has(edge.fromNodeId) || !activeNodes.has(edge.toNodeId)) continue;
    add(edge.fromNodeId, edge, edge.toNodeId);
    if (edge.direction === "BIDIRECTIONAL") add(edge.toNodeId, edge, edge.fromNodeId);
  }
  const distance = new Map<string, number>([[startId, 0]]);
  const previous = new Map<string, { nodeId: string; edge: WayfindingEdge }>();
  const queue = new MinHeap();
  queue.push({ id: startId, distance: 0 });
  while (queue.size) {
    const current = queue.pop();
    if (!current || current.distance !== distance.get(current.id)) continue;
    if (current.id === endId) break;
    for (const candidate of adjacency.get(current.id) ?? []) {
      const nextDistance = current.distance + candidate.edge.distanceMeters;
      if (nextDistance < (distance.get(candidate.nextId) ?? Number.POSITIVE_INFINITY)) {
        distance.set(candidate.nextId, nextDistance);
        previous.set(candidate.nextId, { nodeId: current.id, edge: candidate.edge });
        queue.push({ id: candidate.nextId, distance: nextDistance });
      }
    }
  }
  if (!distance.has(endId)) return null;
  const reversed: Array<{ nodeId: string; edge?: WayfindingEdge }> = [{ nodeId: endId }];
  let cursor = endId;
  while (cursor !== startId) {
    const item = previous.get(cursor);
    if (!item) return null;
    reversed[reversed.length - 1].edge = item.edge;
    reversed.push({ nodeId: item.nodeId });
    cursor = item.nodeId;
  }
  reversed.reverse();
  const routeNodes = reversed.map((item) => activeNodes.get(item.nodeId)!);
  const segments: RouteSegment[] = [];
  const connectorInstructions: string[] = [];
  for (let index = 0; index < routeNodes.length - 1; index += 1) {
    const edge = reversed[index + 1].edge!;
    const from = routeNodes[index];
    const to = routeNodes[index + 1];
    segments.push({ id: edge.id, floorId: from.floorId, type: edge.type, from, to, distanceMeters: edge.distanceMeters });
    if (edge.type !== "WALKWAY") {
      const action = edge.type === "LIFT" ? "Gunakan lift" : edge.type === "STAIRS" ? "Gunakan tangga" : "Gunakan escalator";
      connectorInstructions.push(`${action} dari ${from.floorLabel} ke ${to.floorLabel}`);
    }
  }
  const totalDistanceMeters = Math.round(distance.get(endId)!);
  return { nodes: routeNodes, segments, totalDistanceMeters, estimatedMinutes: etaMinutes(totalDistanceMeters, options.walkingSpeedMetersPerMinute), connectorInstructions };
}

export { DEFAULT_WALKING_SPEED_MPM };
