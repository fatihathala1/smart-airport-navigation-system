import type { WayfindingNode } from "@/types";

function Marker({ node, label, variant }: { node?: WayfindingNode; label: string; variant: "start" | "end" | "current" }) {
  if (!node) return null;
  return (
    <g transform={`translate(${node.x} ${node.y})`} data-marker={variant} pointerEvents="none">
      <circle r="22" className="map-marker-pulse" />
      <path d="M0 19 C-7 9 -15 1 -15 -8 A15 15 0 1 1 15 -8 C15 1 7 9 0 19Z" className={`map-marker map-marker-${variant}`} />
      <circle cy="-8" r="6" className="map-marker-center" />
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
