import type { CSSProperties } from "react";
import type { MapSpace } from "@/types";

export function SpaceLayer({ spaces, selectedId, onSelect }: { spaces: MapSpace[]; selectedId: string | null; onSelect: (space: MapSpace) => void }) {
  return (
    <g data-layer="spaces">
      {spaces.map((space) => (
        <polygon
          key={space.id}
          points={space.polygon}
          className="map-space"
          data-selected={space.id === selectedId}
          data-closed={space.status !== "ACTIVE"}
          style={{ "--space-color": space.mapColor ?? "#00a8bd" } as CSSProperties}
          role="button"
          tabIndex={0}
          aria-label={`${space.label}, ${space.code}`}
          onClick={(event) => { event.stopPropagation(); onSelect(space); }}
          onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onSelect(space); }}
        />
      ))}
    </g>
  );
}
