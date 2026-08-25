import t1Json from "@/data/map/T1_gabungan.json";
import t2Json from "@/data/map/T2_gabungan.json";
import { T1_WALL_DATA } from "@/data/walls/t1";
import { T2_WALL_DATA } from "@/data/walls/t2";
import { buildWallSet } from "@/lib/astar";
import type { DestinationPoint, GridRoom, MapSpace, TerminalCode, WayfindingEdge, WayfindingNode } from "@/types";

export const DEMO_DATA_NOTICE = "Nama unit bersifat demonstrasi. Geometri mengikuti data denah, tetapi wajib divalidasi sebelum penggunaan operasional.";

export const terminals: Array<{
  code: TerminalCode;
  name: string;
  mapAsset: string;
  floorMaps: Record<string, {
    asset: string;
    imageWidth: number;
    imageHeight: number;
    crop: { x: number; y: number; width: number; height: number };
  }>;
}> = [
  {
    code: "T1", name: "Terminal 1", mapAsset: "/map/juanda-terminal-1.svg",
    floorMaps: {
      "T1-L1": { asset: "/map/juanda-terminal-1.svg", imageWidth: 9820, imageHeight: 1875, crop: { x: 0, y: 0, width: 9820, height: 1875 } },
      "T1-L2": { asset: "/map/juanda-terminal-1.png", imageWidth: 2198, imageHeight: 1065, crop: { x: 35, y: 625, width: 2110, height: 415 } },
    },
  },
  {
    code: "T2", name: "Terminal 2", mapAsset: "/map/juanda-terminal-2.png",
    floorMaps: {
      "T2-L1": { asset: "/map/juanda-terminal-2.png", imageWidth: 1650, imageHeight: 1169, crop: { x: 25, y: 35, width: 1600, height: 500 } },
      "T2-L2": { asset: "/map/juanda-terminal-2.png", imageWidth: 1650, imageHeight: 1169, crop: { x: 20, y: 545, width: 1610, height: 545 } },
    },
  },
];

export const floors = [
  { id: "T1-L1", terminal: "T1" as const, label: "Lantai 1", number: 1 },
  { id: "T1-L2", terminal: "T1" as const, label: "Lantai 2", number: 2 },
  { id: "T2-L1", terminal: "T2" as const, label: "Lantai 1", number: 1 },
  { id: "T2-L2", terminal: "T2" as const, label: "Lantai 2", number: 2 },
];

export const categories = [
  { id: "all", label: "Semua" },
  { id: "office", label: "Kantor" },
  { id: "food", label: "Makanan & Minuman" },
  { id: "shop", label: "Toko Pakaian" },
  { id: "prayer", label: "Mushola" },
];

type RawDestination = DestinationPoint & { room?: GridRoom };
type RawMap = { destinations: RawDestination[] };
type PlaceKind = "office" | "food" | "shop" | "prayer";

const palette: Record<PlaceKind, string> = { office: "#8e9091", food: "#d89a0b", shop: "#dd0fc9", prayer: "#0f9a55" };
const foodNames = ["Kopi Juanda", "Dapur Nusantara", "Soto Cak Har", "Roti Pagi", "Ayam Rempah", "Kedai Madura", "Bakso Transit", "Nasi Krawu", "Teh Terminal", "Warung Selasar", "Lontong Surabaya", "Kopi Landas", "Mie Penerbangan", "Pojok Dessert", "Sego Sambel", "Kedai Tropis", "Rasa Jawa", "Brew & Bites"];
const shopNames = ["Nusantara Fashion", "Batik Angkasa", "Laras Apparel", "Runway Wear", "Svara Mode", "Puspa Textile", "Langit Outfit", "Jelita Busana", "Aruna Clothing", "Cakra Style", "Kelana Wear", "Srikandi Fashion"];
const officeNames = ["Kantor Operasional Apron", "Kantor Administrasi Terminal", "Kantor Layanan Maskapai", "Kantor Keamanan Penerbangan", "Kantor Informasi Bandara", "Kantor Pengelola Fasilitas", "Kantor Operasional Bagasi", "Kantor Pelayanan Penumpang", "Kantor Koordinasi Gate", "Kantor Pengendali Terminal", "Kantor Teknik Gedung", "Kantor Kebersihan Terminal"];
const prayerNames = ["Mushola Al-Ikhlas", "Mushola Ar-Rahman", "Mushola An-Nur", "Mushola As-Salam", "Mushola Al-Hidayah", "Mushola At-Taqwa", "Mushola Al-Falah", "Mushola Al-Barokah"];

function placeKind(id: string): PlaceKind | null {
  if (id.includes("_kan")) return "office";
  if (id.includes("_fnb")) return "food";
  if (id.includes("_ret")) return "shop";
  if (id.includes("_mus")) return "prayer";
  return null;
}

function floorFor(id: string, terminal: TerminalCode) { return `${terminal}-${id.startsWith("l2_") ? "L2" : "L1"}`; }

function uniqueName(kind: PlaceKind, index: number, terminal: TerminalCode, floorId: string) {
  const source = kind === "office" ? officeNames : kind === "food" ? foodNames : kind === "shop" ? shopNames : prayerNames;
  const floor = floorId.endsWith("L1") ? "L1" : "L2";
  return `${source[index % source.length]} ${terminal}-${floor}-${String(index + 1).padStart(2, "0")}`;
}

export function gridToMapPoint(terminal: TerminalCode, floorId: string, r: number, c: number) {
  if (terminal === "T1") {
    const x = 38 + (Math.max(0, Math.min(300, c)) / 300) * 924;
    const y = floorId.endsWith("L1") ? 262 + (Math.max(0, Math.min(100, r)) / 100) * 176 : 265 + (Math.max(0, Math.min(32, r)) / 32) * 170;
    return { x, y };
  }
  const x = 38 + (Math.max(0, Math.min(321, c)) / 321) * 924;
  const y = floorId.endsWith("L1") ? 210 + ((Math.max(55, Math.min(117, r)) - 55) / 62) * 285 : 205 + (Math.max(0, Math.min(54, r)) / 54) * 300;
  return { x, y };
}

function roomPolygon(terminal: TerminalCode, floorId: string, room: GridRoom | undefined, fallback: { r: number; c: number }) {
  if (!room) {
    const center = gridToMapPoint(terminal, floorId, fallback.r, fallback.c);
    return `${center.x - 5},${center.y - 5} ${center.x + 5},${center.y - 5} ${center.x + 5},${center.y + 5} ${center.x - 5},${center.y + 5}`;
  }
  const a = gridToMapPoint(terminal, floorId, room.r1, room.c1);
  const b = gridToMapPoint(terminal, floorId, room.r2, room.c2);
  return `${a.x},${a.y} ${b.x},${a.y} ${b.x},${b.y} ${a.x},${b.y}`;
}

function nearestWalkable(r: number, c: number, walls: Set<string>, rows: number, cols: number) {
  const startR = Math.max(0, Math.min(rows - 1, Math.round(r)));
  const startC = Math.max(0, Math.min(cols - 1, Math.round(c)));
  if (!walls.has(`${startR},${startC}`)) return { r: startR, c: startC };
  for (let radius = 1; radius <= 14; radius += 1) {
    for (let dr = -radius; dr <= radius; dr += 1) {
      for (let dc = -radius; dc <= radius; dc += 1) {
        if (Math.abs(dr) !== radius && Math.abs(dc) !== radius) continue;
        const nr = startR + dr;
        const nc = startC + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !walls.has(`${nr},${nc}`)) return { r: nr, c: nc };
      }
    }
  }
  return { r: startR, c: startC };
}

function buildTerminalData(terminal: TerminalCode, raw: RawMap) {
  const wallData = terminal === "T1" ? T1_WALL_DATA : T2_WALL_DATA;
  const walls = buildWallSet(wallData.walls);
  const counters: Record<PlaceKind, number> = { office: 0, food: 0, shop: 0, prayer: 0 };
  const terminalSpaces: MapSpace[] = [];
  const terminalNodes: WayfindingNode[] = [];
  const entranceFloor = `${terminal}-L1`;
  const entranceGrid = { r: wallData.startRow, c: wallData.startCol };
  const entrancePoint = gridToMapPoint(terminal, entranceFloor, entranceGrid.r, entranceGrid.c);

  terminalSpaces.push({ id: `${terminal}-ENTRANCE`, code: `${terminal}-ENTRANCE`, terminal, floorId: entranceFloor, label: `Pintu Masuk ${terminal}`, type: "SERVICE", status: "ACTIVE", polygon: `${entrancePoint.x - 6},${entrancePoint.y - 6} ${entrancePoint.x + 6},${entrancePoint.y - 6} ${entrancePoint.x + 6},${entrancePoint.y + 6} ${entrancePoint.x - 6},${entrancePoint.y + 6}`, anchorNodeId: `${terminal}-ENTRANCE-NODE`, category: "entrance", description: "Titik awal navigasi terminal.", mapColor: "#008ca2" });
  terminalNodes.push({ id: `${terminal}-ENTRANCE-NODE`, floorId: entranceFloor, floorLabel: "Lantai 1", x: entrancePoint.x, y: entrancePoint.y, gridRow: entranceGrid.r, gridCol: entranceGrid.c });

  for (const destination of raw.destinations) {
    const kind = placeKind(destination.id);
    if (!kind) continue;
    const index = counters[kind]++;
    const floorId = floorFor(destination.id, terminal);
    const room = destination.room;
    const preferredR = room ? (floorId.endsWith("L2") ? room.r1 - 1 : room.r2) : destination.r;
    const preferredC = room ? (room.c1 + room.c2) / 2 : destination.c;
    const anchor = nearestWalkable(preferredR, preferredC, walls, wallData.rows, wallData.cols);
    const point = gridToMapPoint(terminal, floorId, anchor.r, anchor.c);
    const mapPoint = gridToMapPoint(
      terminal,
      floorId,
      room ? (room.r1 + room.r2) / 2 : destination.r,
      room ? (room.c1 + room.c2) / 2 : destination.c,
    );
    const label = uniqueName(kind, index, terminal, floorId);
    const id = `${terminal}-${destination.id.toUpperCase()}`;
    const nodeId = `${id}-NODE`;
    terminalSpaces.push({ id, code: `${terminal}-${floorId.endsWith("L1") ? "L1" : "L2"}-${String(index + 1).padStart(3, "0")}`, terminal, floorId, label, type: kind === "office" ? "SERVICE" : kind === "prayer" ? "FACILITY" : "TENANT", status: "ACTIVE", polygon: roomPolygon(terminal, floorId, room, destination), anchorNodeId: nodeId, category: kind, description: kind === "office" ? "Unit kantor operasional." : kind === "food" ? "Tenant makanan dan minuman." : kind === "shop" ? "Tenant pakaian dan aksesori." : "Fasilitas mushola.", icon: kind === "prayer" ? "/icons/wayfinding/musholla.svg" : undefined, mapColor: palette[kind], mapPoint, room });
    terminalNodes.push({ id: nodeId, floorId, floorLabel: floorId.endsWith("L1") ? "Lantai 1" : "Lantai 2", x: point.x, y: point.y, gridRow: anchor.r, gridCol: anchor.c });
  }
  return { spaces: terminalSpaces, nodes: terminalNodes };
}

const t1 = buildTerminalData("T1", t1Json as RawMap);
const t2 = buildTerminalData("T2", t2Json as RawMap);
export const spaces = [...t1.spaces, ...t2.spaces];
export const routeNodes = [...t1.nodes, ...t2.nodes];
export const routeEdges: WayfindingEdge[] = [];
export const qrLocations = [
  { locationId: "demo-t1-arrival", terminal: "T1" as const, floorId: "T1-L1", nodeId: "T1-ENTRANCE-NODE", label: "Pintu Masuk T1" },
  { locationId: "demo-t2-arrival", terminal: "T2" as const, floorId: "T2-L1", nodeId: "T2-ENTRANCE-NODE", label: "Pintu Masuk T2" },
];
