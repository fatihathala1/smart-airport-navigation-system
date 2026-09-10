import type { MapSpace, TerminalCode } from "@/types";
import { getCategoryLabel, getSpaceLabel } from "./wayfinding-language";

export const facilityShortcuts = [
  { id: "restroom", ID: "Toilet", EN: "Restrooms" },
  { id: "prayer", ID: "Musala", EN: "Prayer rooms" },
  { id: "food", ID: "Restoran", EN: "Restaurants" },
  { id: "atm", ID: "ATM", EN: "ATMs" },
  { id: "lounge", ID: "Lounge", EN: "Lounges" },
  { id: "assistance", ID: "Bantuan", EN: "Assistance" },
] as const;

export function isMapCategory(value: string): boolean {
  return ["all", "entrance", "office", "food", "shop", "prayer", ...facilityShortcuts.map((item) => item.id)].includes(value);
}

export function matchesFacility(space: MapSpace, category: string): boolean {
  if (category === "all" || space.category === category) return true;
  const name = `${space.label} ${space.tenant?.name ?? ""}`.toLowerCase();
  switch (category) {
    case "restroom": return /\b(toilet|restroom|restrooms|wc)\b/.test(name);
    case "atm": return /\batm\b/.test(name);
    case "lounge": return /\blounge\b/.test(name);
    case "assistance": return /\b(informasi|information|bantuan|help|pelayanan penumpang|layanan maskapai)\b/.test(name);
    default: return false;
  }
}

export function findFacilities(items: MapSpace[], terminal: TerminalCode, category: string, query = "") {
  const needle = query.trim().toLowerCase();
  return items.filter((space) => {
    if (space.terminal !== terminal || space.status === "INACTIVE" || !matchesFacility(space, category)) return false;
    const text = [space.label, space.code, space.tenant?.name, getSpaceLabel(space, "ID"), getSpaceLabel(space, "EN"),
      getCategoryLabel(space.category, "ID"), getCategoryLabel(space.category, "EN"),
      ...facilityShortcuts.filter((item) => matchesFacility(space, item.id)).flatMap((item) => [item.ID, item.EN])].join(" ").toLowerCase();
    return text.includes(needle);
  });
}

export function mapSearchHref(terminal: TerminalCode, category: string, query = "", directory = false) {
  const params = new URLSearchParams({ terminal, category: isMapCategory(category) ? category : "all" });
  if (query.trim()) params.set("q", query.trim());
  if (directory) params.set("directory", "true");
  return `/map?${params}`;
}

export function readMapSearch(params: Pick<URLSearchParams, "get">, fallback: TerminalCode) {
  const value = params.get("terminal");
  const terminal = value === "T1" || value === "T2" ? value : fallback;
  const category = params.get("category") ?? "all";
  return { terminal, category: isMapCategory(category) ? category : "all", query: params.get("q")?.trim() ?? "" };
}
