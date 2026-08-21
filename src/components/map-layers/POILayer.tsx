import type { MapSpace, WayfindingNode } from "@/types";

export function POILayer({ spaces, nodes }: { spaces: MapSpace[]; nodes: WayfindingNode[] }) {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  return (
    <g data-layer="poi" pointerEvents="none">
      {spaces.map((space) => {
        const node = nodeMap.get(space.anchorNodeId);
        if (!node) return null;
        return (
          <g key={space.id} transform={`translate(${node.x} ${node.y})`}>
            <circle r="14" className="poi-marker-halo" />
            <circle r="8" className="poi-marker-core" />
            <text y="-20" textAnchor="middle" className="map-label">{space.label}</text>
          </g>
        );
      })}
    </g>
  );
}
