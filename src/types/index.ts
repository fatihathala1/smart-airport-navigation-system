export type TerminalCode = "T1" | "T2";
export type AdminRole = "SUPER_ADMIN" | "AIRPORT_ADMIN";
export type EdgeType = "WALKWAY" | "STAIRS" | "LIFT" | "ESCALATOR";
export type EdgeDirection = "BIDIRECTIONAL" | "ONE_WAY";

export interface WayfindingNode { id: string; floorId: string; floorLabel: string; x: number; y: number; active?: boolean }
export interface WayfindingEdge { id: string; fromNodeId: string; toNodeId: string; distanceMeters: number; type: EdgeType; direction: EdgeDirection; publicAccess: boolean; accessible: boolean; active: boolean }
export interface RouteSegment { id: string; floorId: string; type: EdgeType; from: WayfindingNode; to: WayfindingNode; distanceMeters: number }
export interface DijkstraResult { nodes: WayfindingNode[]; segments: RouteSegment[]; totalDistanceMeters: number; estimatedMinutes: number; connectorInstructions: string[] }
export interface RouteOptions { walkingSpeedMetersPerMinute?: number; accessibleOnly?: boolean; allowRestricted?: boolean }

export interface MapSpace {
  id: string;
  code: string;
  terminal: TerminalCode;
  floorId: string;
  label: string;
  type: "TENANT" | "GATE" | "FACILITY" | "SERVICE" | "RESTRICTED";
  status: "ACTIVE" | "INACTIVE" | "TEMPORARILY_CLOSED";
  polygon: string;
  anchorNodeId: string;
  category: string;
  description: string;
  tenant?: { name: string; status: "ACTIVE" | "INACTIVE" | "TEMPORARILY_CLOSED"; hours: string };
}
