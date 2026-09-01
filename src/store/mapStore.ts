import { create } from "zustand";
import type { DijkstraResult, TerminalCode } from "@/types";

export type LanguageCode = "ID" | "EN";

interface WayfindingState {
  terminal: TerminalCode;
  floorId: string;
  query: string;
  category: string;
  lang: LanguageCode;
  selectedSpaceId: string | null;
  fromNodeId: string | null;
  toNodeId: string | null;
  currentNodeId: string | null;
  route: DijkstraResult | null;
  routeStatus: "idle" | "ready" | "no-route";
  isSearchOpen: boolean;
  setTerminal: (terminal: TerminalCode) => void;
  setFloorId: (floorId: string) => void;
  setQuery: (query: string) => void;
  setCategory: (category: string) => void;
  setLang: (lang: LanguageCode) => void;
  selectSpace: (id: string | null) => void;
  setFromNodeId: (id: string | null) => void;
  setToNodeId: (id: string | null) => void;
  setCurrentNodeId: (id: string | null) => void;
  setRoute: (route: DijkstraResult | null, status?: "idle" | "ready" | "no-route") => void;
  clearRoute: () => void;
  setIsSearchOpen: (open: boolean) => void;
  toggleSearch: () => void;
}

export const useMapStore = create<WayfindingState>((set) => ({
  terminal: "T1",
  floorId: "T1-L1",
  query: "",
  category: "all",
  lang: "ID",
  selectedSpaceId: null,
  fromNodeId: null,
  toNodeId: null,
  currentNodeId: null,
  route: null,
  routeStatus: "idle",
  isSearchOpen: false,

  setTerminal: (terminal) =>
    set({
      terminal,
      floorId: `${terminal}-L1`,
      selectedSpaceId: null,
      fromNodeId: null,
      toNodeId: null,
      currentNodeId: null,
      route: null,
      routeStatus: "idle",
    }),
  setFloorId: (floorId) => set({ floorId }),
  setQuery: (query) => set({ query }),
  setCategory: (category) => set({ category }),
  setLang: (lang) => set({ lang }),
  selectSpace: (selectedSpaceId) => set({ selectedSpaceId }),
  setFromNodeId: (fromNodeId) => set({ fromNodeId, route: null, routeStatus: "idle" }),
  setToNodeId: (toNodeId) => set({ toNodeId, route: null, routeStatus: "idle" }),
  setCurrentNodeId: (currentNodeId) => set({ currentNodeId, fromNodeId: currentNodeId }),
  setRoute: (route, routeStatus = route ? "ready" : "idle") => set({ route, routeStatus }),
  clearRoute: () => set({ toNodeId: null, route: null, routeStatus: "idle" }),
  setIsSearchOpen: (isSearchOpen) => set({ isSearchOpen }),
  toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),
}));
