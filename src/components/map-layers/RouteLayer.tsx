import type { DijkstraResult } from "@/types";

function roundedPath(points: Array<{ x: number; y: number }>) {
  if (points.length < 2) return "";
  const radius = 14;
  let path = `M ${points[0].x} ${points[0].y}`;

  for (let index = 1; index < points.length - 1; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const next = points[index + 1];
    const incoming = Math.hypot(current.x - previous.x, current.y - previous.y);
    const outgoing = Math.hypot(next.x - current.x, next.y - current.y);
    const corner = Math.min(radius, incoming / 2, outgoing / 2);
    const before = {
      x: current.x - ((current.x - previous.x) / incoming) * corner,
      y: current.y - ((current.y - previous.y) / incoming) * corner,
    };
    const after = {
      x: current.x + ((next.x - current.x) / outgoing) * corner,
      y: current.y + ((next.y - current.y) / outgoing) * corner,
    };
    path += ` L ${before.x} ${before.y} Q ${current.x} ${current.y} ${after.x} ${after.y}`;
  }

  const last = points[points.length - 1];
  return `${path} L ${last.x} ${last.y}`;
}

export function RouteLayer({ route, floorId }: { route: DijkstraResult | null; floorId: string }) {
  if (!route) return null;
  const points = route.nodes.filter((node) => node.floorId === floorId);
  const path = roundedPath(points);
  if (!path) return null;
  return (
    <g data-layer="route" pointerEvents="none">
      <path d={path} className="route-line-shadow" />
      <path d={path} className="route-line" />
      <path d={path} className="route-line-direction" />
    </g>
  );
}
