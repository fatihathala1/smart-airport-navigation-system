import type { MapSpace, TerminalCode, WayfindingEdge, WayfindingNode } from "@/types";

export const DEMO_DATA_NOTICE = "Data demonstrasi. Belum divalidasi sebagai data operasional Juanda.";
export const terminals: Array<{
  code: TerminalCode;
  name: string;
  mapAsset: string;
  imageWidth: number;
  imageHeight: number;
  floorCrops: Record<string, { x: number; y: number; width: number; height: number }>;
}> = [
  {
    code: "T1",
    name: "Terminal 1",
    mapAsset: "/map/juanda-terminal-1.png",
    imageWidth: 2198,
    imageHeight: 1065,
    floorCrops: {
      "T1-L1": { x: 45, y: 55, width: 2090, height: 535 },
      "T1-L2": { x: 35, y: 625, width: 2110, height: 415 },
    },
  },
  {
    code: "T2",
    name: "Terminal 2",
    mapAsset: "/map/juanda-terminal-2.png",
    imageWidth: 1650,
    imageHeight: 1169,
    floorCrops: {
      "T2-L1": { x: 25, y: 35, width: 1600, height: 500 },
      "T2-L2": { x: 20, y: 545, width: 1610, height: 545 },
    },
  },
];
export const floors = [
  { id: "T1-L1", terminal: "T1" as const, label: "Lantai 1", number: 1 }, { id: "T1-L2", terminal: "T1" as const, label: "Lantai 2", number: 2 },
  { id: "T2-L1", terminal: "T2" as const, label: "Lantai 1", number: 1 }, { id: "T2-L2", terminal: "T2" as const, label: "Lantai 2", number: 2 },
];
export const categories = [
  { id: "all", label: "Semua" }, { id: "gate", label: "Gate" }, { id: "toilet", label: "Toilet" }, { id: "food", label: "Makan" },
  { id: "shop", label: "Belanja" }, { id: "atm", label: "ATM" }, { id: "prayer", label: "Mushola" }, { id: "info", label: "Informasi" },
];

const nodePositions: Record<TerminalCode, Record<string, [number, number]>> = {
  T1: {
    "L1-ENTRANCE": [88, 392], "L1-A": [250, 382], "L1-B": [420, 368], "L1-LIFT": [585, 360], "L1-STAIRS": [745, 352], "L1-END": [912, 344],
    "L2-LIFT": [585, 362], "L2-STAIRS": [745, 360], "L2-C": [420, 368], "L2-D": [250, 374], "L2-END": [912, 354],
  },
  T2: {
    "L1-ENTRANCE": [88, 405], "L1-A": [245, 390], "L1-B": [410, 374], "L1-LIFT": [575, 362], "L1-STAIRS": [738, 354], "L1-END": [910, 348],
    "L2-LIFT": [575, 365], "L2-STAIRS": [738, 362], "L2-C": [410, 373], "L2-D": [245, 382], "L2-END": [910, 354],
  },
};

const nodesFor = (terminal: TerminalCode): WayfindingNode[] => Object.entries(nodePositions[terminal]).map(([key, [x, y]]) => {
  const floor = key.startsWith("L1") ? "L1" : "L2";
  return { id: `${terminal}-${key}`, floorId: `${terminal}-${floor}`, floorLabel: floor === "L1" ? "Lantai 1" : "Lantai 2", x, y };
});
const edge = (terminal: TerminalCode, id: string, from: string, to: string, distanceMeters: number, overrides: Partial<WayfindingEdge> = {}): WayfindingEdge => ({
  id: `${terminal}-${id}`, fromNodeId: `${terminal}-${from}`, toNodeId: `${terminal}-${to}`, distanceMeters, type: "WALKWAY", direction: "BIDIRECTIONAL", publicAccess: true, accessible: true, active: true, ...overrides,
});
const edgesFor = (terminal: TerminalCode): WayfindingEdge[] => [
  edge(terminal, "E1", "L1-ENTRANCE", "L1-A", 28), edge(terminal, "E2", "L1-A", "L1-B", 36), edge(terminal, "E3", "L1-B", "L1-LIFT", 22),
  edge(terminal, "E4", "L1-LIFT", "L1-STAIRS", 24), edge(terminal, "E5", "L1-STAIRS", "L1-END", 31), edge(terminal, "E6", "L1-LIFT", "L2-LIFT", 12, { type: "LIFT" }),
  edge(terminal, "E7", "L1-STAIRS", "L2-STAIRS", 18, { type: "STAIRS", accessible: false }), edge(terminal, "E8", "L2-LIFT", "L2-C", 25),
  edge(terminal, "E9", "L2-C", "L2-D", 34), edge(terminal, "E10", "L2-LIFT", "L2-STAIRS", 24), edge(terminal, "E11", "L2-STAIRS", "L2-END", 30),
  edge(terminal, "E12", "L1-B", "L1-END", 43, { publicAccess: false }), edge(terminal, "E13", "L1-A", "L1-END", 120, { direction: "ONE_WAY", type: "ESCALATOR", accessible: false }),
];
export const routeNodes = [...nodesFor("T1"), ...nodesFor("T2")];
export const routeEdges = [...edgesFor("T1"), ...edgesFor("T2")];

const spacesFor = (terminal: TerminalCode): MapSpace[] => [
  { id: `${terminal}-S001`, code: `${terminal}-L1-S001`, terminal, floorId: `${terminal}-L1`, label: "Pintu Masuk", type: "SERVICE", status: "ACTIVE", polygon: "48,360 130,360 130,430 48,430", anchorNodeId: `${terminal}-L1-ENTRANCE`, category: "info", description: "Titik masuk contoh untuk memulai simulasi rute." },
  { id: `${terminal}-S002`, code: `${terminal}-L1-S002`, terminal, floorId: `${terminal}-L1`, label: "Toilet", type: "FACILITY", status: "ACTIVE", polygon: "205,350 285,350 285,420 205,420", anchorNodeId: `${terminal}-L1-A`, category: "toilet", description: "Fasilitas contoh. Posisi dan status perlu validasi lapangan." },
  { id: `${terminal}-S003`, code: `${terminal}-L1-S003`, terminal, floorId: `${terminal}-L1`, label: "Food Court", type: "TENANT", status: "ACTIVE", polygon: "360,335 470,335 470,405 360,405", anchorNodeId: `${terminal}-L1-B`, category: "food", description: "Area kuliner contoh dengan assignment tenant dinamis.", tenant: { name: "Area Kuliner", status: "ACTIVE", hours: "Contoh 06.00-21.00" } },
  { id: `${terminal}-S004`, code: `${terminal}-L1-S004`, terminal, floorId: `${terminal}-L1`, label: "Lift", type: "FACILITY", status: "ACTIVE", polygon: "545,325 620,325 620,397 545,397", anchorNodeId: `${terminal}-L1-LIFT`, category: "info", description: "Konektor lintas lantai yang mendukung rute aksesibel." },
  { id: `${terminal}-S005`, code: `${terminal}-L1-S005`, terminal, floorId: `${terminal}-L1`, label: "Area Gate", type: "GATE", status: "ACTIVE", polygon: "858,312 960,312 960,385 858,385", anchorNodeId: `${terminal}-L1-END`, category: "gate", description: "Area gate demonstrasi. Penomoran perlu disesuaikan dengan data resmi." },
  { id: `${terminal}-S006`, code: `${terminal}-L2-S001`, terminal, floorId: `${terminal}-L2`, label: "Mushola", type: "FACILITY", status: "ACTIVE", polygon: "195,340 295,340 295,415 195,415", anchorNodeId: `${terminal}-L2-D`, category: "prayer", description: "Lokasi contoh untuk pengujian rute lintas lantai." },
  { id: `${terminal}-S007`, code: `${terminal}-L2-S002`, terminal, floorId: `${terminal}-L2`, label: "ATM", type: "FACILITY", status: "TEMPORARILY_CLOSED", polygon: "365,335 455,335 455,408 365,408", anchorNodeId: `${terminal}-L2-C`, category: "atm", description: "Contoh status tutup sementara untuk desain state." },
  { id: `${terminal}-S008`, code: `${terminal}-L2-S003`, terminal, floorId: `${terminal}-L2`, label: "Retail", type: "TENANT", status: "ACTIVE", polygon: "855,318 960,318 960,390 855,390", anchorNodeId: `${terminal}-L2-END`, category: "shop", description: "Space contoh dengan tenant yang dapat diganti tanpa mengubah geometri.", tenant: { name: "Area Retail", status: "ACTIVE", hours: "Contoh 07.00-20.00" } },
];
export const spaces = [...spacesFor("T1"), ...spacesFor("T2")];
export const qrLocations = [
  { locationId: "demo-t1-arrival", terminal: "T1" as const, floorId: "T1-L1", nodeId: "T1-L1-ENTRANCE", label: "Titik QR demo T1" },
  { locationId: "demo-t2-arrival", terminal: "T2" as const, floorId: "T2-L1", nodeId: "T2-L1-ENTRANCE", label: "Titik QR demo T2" },
];
