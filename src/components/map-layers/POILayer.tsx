import type { CSSProperties } from "react";
import type { MapSpace, WayfindingNode } from "@/types";

export function POILayer({ spaces, nodes, selectedId, onSelect }: { spaces: MapSpace[]; nodes: WayfindingNode[]; selectedId: string | null; onSelect: (space: MapSpace) => void }) {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  return (
    <g data-layer="poi">
      {spaces.map((space) => {
        const node = nodeMap.get(space.anchorNodeId);
        if (!node) return null;
        const point = space.mapPoint ?? node;
        const selected = selectedId === space.id;
        return (
          <g
            key={space.id}
            transform={`translate(${point.x} ${point.y})`}
            className="map-poi"
            data-selected={selected}
            style={{ "--poi-color": space.mapColor ?? "#00a8bd" } as CSSProperties}
            role="button"
            tabIndex={0}
            aria-label={space.label}
            onClick={(event) => { event.stopPropagation(); onSelect(space); }}
            onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onSelect(space); }}
          >
            <circle r={selected ? 8 : 5} className="poi-marker-halo" />
            <circle r={selected ? 5 : 3.25} className="poi-marker-core" />
            <text y="-12" textAnchor="middle" className="map-label">{space.label}</text>
            <title>{space.label}</title>
          </g>
        );
      })}
    </g>
  );
}
