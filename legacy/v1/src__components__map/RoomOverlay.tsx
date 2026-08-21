"use client";

type Room = {
  r1: number;
  c1: number;
  r2: number;
  c2: number;
};

type DestinationWithRoom = {
  id: string;
  label: string;
  r: number;
  c: number;
  color: string;
  room?: Room;
};

type RoomOverlayProps = {
  destinations: DestinationWithRoom[];
  cols: number;
  rows: number;
  onSelectDestination?: (destination: DestinationWithRoom) => void;
};

export default function RoomOverlay({
  destinations,
  cols,
  rows,
  onSelectDestination,
}: RoomOverlayProps) {
  return (
    <svg
      className="absolute inset-0 z-10 h-full w-full pointer-events-none"
      viewBox={`0 0 ${cols} ${rows}`}
      preserveAspectRatio="none"
    >
      {destinations.map((dest) => {
        if (!dest.room) return null;

        const { r1, c1, r2, c2 } = dest.room;

        const x = c1;
        const y = r1;
        const w = c2 - c1 + 1;
        const h = r2 - r1 + 1;

        const showLabel = w >= 5 || h >= 4;

        return (
          <g
            key={`room-${dest.id}`}
            className="pointer-events-auto cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onSelectDestination?.(dest);
            }}
          >
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              rx={0.8}
              fill={`${dest.color}33`}
              stroke={dest.color}
              strokeWidth={0.35}
            />

            {showLabel && (
              <text
                x={x + w / 2}
                y={y + h / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={Math.min(w, h) * 0.35}
                fontWeight="600"
                fill={dest.color}
                className="select-none"
              >
                {dest.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}