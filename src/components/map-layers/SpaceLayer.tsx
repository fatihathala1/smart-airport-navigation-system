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
