import type { DijkstraResult } from "@/types";

export function RouteLayer({ route, floorId }: { route: DijkstraResult | null; floorId: string }) {
  if (!route) return null;
  const segments = route.segments.filter((segment) => segment.from.floorId === floorId && segment.to.floorId === floorId);
  return (
    <g data-layer="route" pointerEvents="none">
      {segments.map((segment) => (
        <g key={segment.id}>
          <line x1={segment.from.x} y1={segment.from.y} x2={segment.to.x} y2={segment.to.y} className="route-line-shadow" />
          <line x1={segment.from.x} y1={segment.from.y} x2={segment.to.x} y2={segment.to.y} className="route-line" />
        </g>
      ))}
    </g>
  );
}
