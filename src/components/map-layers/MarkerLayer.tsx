import type { WayfindingNode } from "@/types";

function Marker({ node, label, variant }: { node?: WayfindingNode; label: string; variant: "start" | "end" | "current" }) {
  if (!node) return null;
  // Tip of pin is at y=0 (exactly at node coordinate).
  // Pin body grows upward: circle center at cy=-7.5, top at y≈-11
  return (
    <g transform={`translate(${node.x} ${node.y})`} data-marker={variant} pointerEvents="none">
      {/* Pulse ring at pin circle center */}
      <circle cy="-7.5" r="5.5" className="map-marker-pulse" />
      {/* Pin: tip at y=0, circle head centered at y=-7.5 */}
      <path
        d="M0 0 C-1.5 -3 -3.5 -5 -3.5 -7.5 A3.5 3.5 0 1 1 3.5 -7.5 C3.5 -5 1.5 -3 0 0Z"
        className={`map-marker map-marker-${variant}`}
      />
      <circle cy="-7.5" r="1.4" className="map-marker-center" />
      <title>{label}</title>
    </g>
  );
}

export function MarkerLayer({ nodes, routeNodes = [], fromId, toId, currentId }: { nodes: WayfindingNode[]; routeNodes?: WayfindingNode[]; fromId: string | null; toId: string | null; currentId: string | null }) {
  const map = new Map([...nodes, ...routeNodes].map((node) => [node.id, node]));
  return (
    <g data-layer="markers">
      <Marker node={map.get(fromId ?? "")} label="Titik asal" variant={currentId === fromId ? "current" : "start"} />
      <Marker node={map.get(toId ?? "")} label="Tujuan" variant="end" />
    </g>
  );
}
