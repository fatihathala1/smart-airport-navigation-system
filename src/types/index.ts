export type TerminalCode = "T1" | "T2";
export type AdminRole = "SUPER_ADMIN" | "AIRPORT_ADMIN";
export type EdgeType = "WALKWAY" | "STAIRS" | "LIFT" | "ESCALATOR";
export type EdgeDirection = "BIDIRECTIONAL" | "ONE_WAY";

export interface GridPoint { r: number; c: number }
export interface AStarNode extends GridPoint { g: number; f: number; parent: AStarNode | null }
export interface PathResult { path: GridPoint[]; stepCount: number }
export interface MultiPathResult { segments: Array<{ path: GridPoint[]; color: string }>; totalSteps: number; usedStairs: boolean; stairsLabel?: string }
export interface DestinationPoint extends GridPoint { id: string; label: string; color: string; room?: GridRoom }
export interface WallDataJson { rows: number; cols: number; startRow: number; startCol: number; walls: string[] }
export interface GridRoom { r1: number; c1: number; r2: number; c2: number }

export interface WayfindingNode { id: string; floorId: string; floorLabel: string; x: number; y: number; gridRow?: number; gridCol?: number; active?: boolean }
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
  icon?: string;
  mapColor?: string;
  mapPoint?: { x: number; y: number };
  room?: GridRoom;
  tenant?: { name: string; status: "ACTIVE" | "INACTIVE" | "TEMPORARILY_CLOSED"; hours: string };
}
