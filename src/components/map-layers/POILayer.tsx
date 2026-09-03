import type { CSSProperties } from "react";
import { getSpaceLabel } from "@/lib/wayfinding-language";
import type { LanguageCode } from "@/store/mapStore";
import type { MapSpace, WayfindingNode } from "@/types";

export function POILayer({ spaces, nodes, selectedId, onSelect, lang }: { spaces: MapSpace[]; nodes: WayfindingNode[]; selectedId: string | null; onSelect: (space: MapSpace) => void; lang: LanguageCode }) {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  return (
    <g data-layer="poi">
      {spaces.map((space) => {
        const label = getSpaceLabel(space, lang);
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
            aria-label={label}
            onClick={(event) => { event.stopPropagation(); onSelect(space); }}
            onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onSelect(space); }}
          >
            <circle r={selected ? 4.5 : 2.2} className="poi-marker-halo" />
            <circle r={selected ? 2.5 : 1.2} className="poi-marker-core" />
            <text y="-6" textAnchor="middle" className="map-label">{label}</text>
            <title>{label}</title>
          </g>
        );
      })}
    </g>
  );
}
