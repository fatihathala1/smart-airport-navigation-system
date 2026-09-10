import test from "node:test";
import assert from "node:assert/strict";
import { spaces } from "../src/data/demo-wayfinding";
import { facilityShortcuts, findFacilities, mapSearchHref, readMapSearch } from "../src/lib/facility-search";
import { useMapStore } from "../src/store/mapStore";

test("facility shortcuts round-trip through a refreshable URL for both terminals", () => {
  for (const terminal of ["T1", "T2"] as const) {
    for (const shortcut of facilityShortcuts) {
      const url = new URL(mapSearchHref(terminal, shortcut.id), "https://example.test");
      assert.equal(url.pathname, "/map");
      assert.deepEqual(readMapSearch(url.searchParams, "T1"), { terminal, category: shortcut.id, query: "" });
    }
  }
});

test("directory isolates the selected terminal while including facilities on both floors", () => {
  for (const terminal of ["T1", "T2"] as const) {
    const results = findFacilities(spaces, terminal, "prayer");
    assert.ok(results.length > 0);
    assert.ok(results.every((space) => space.terminal === terminal && space.category === "prayer"));
    assert.deepEqual(new Set(results.map((space) => space.floorId)), new Set([`${terminal}-L1`, `${terminal}-L2`]));
  }
});

test("missing facility data produces no invented or unrelated locations", () => {
  for (const terminal of ["T1", "T2"] as const) {
    for (const category of ["restroom", "atm", "lounge"]) {
      assert.deepEqual(findFacilities(spaces, terminal, category), []);
    }
    const assistance = findFacilities(spaces, terminal, "assistance");
    assert.ok(assistance.length > 0);
    assert.ok(assistance.every((space) => /Informasi|Pelayanan Penumpang|Layanan Maskapai/.test(space.label)));
  }
});

test("Indonesian and English facility searches return the same places", () => {
  for (const terminal of ["T1", "T2"] as const) {
    const expected = findFacilities(spaces, terminal, "prayer");
    assert.deepEqual(findFacilities(spaces, terminal, "all", "  musala  "), expected);
    assert.deepEqual(findFacilities(spaces, terminal, "all", "prayer"), expected);
    assert.deepEqual(findFacilities(spaces, terminal, "food", "restoran"), findFacilities(spaces, terminal, "food"));
  }
});

test("invalid URL values fall back safely and search text stays in the query parameter", () => {
  assert.deepEqual(readMapSearch(new URLSearchParams("terminal=T9&category=unknown"), "T2"), { terminal: "T2", category: "all", query: "" });
  const query = "Kopi & Roti #1 / ?";
  const url = new URL(mapSearchHref("T1", "food", query, true), "https://example.test");
  assert.equal(url.searchParams.get("q"), query);
  assert.equal(url.searchParams.get("directory"), "true");
  assert.equal(url.hash, "");
});

test("inactive locations are hidden while temporarily closed facilities remain identifiable", () => {
  const original = spaces.find((space) => space.category === "prayer")!;
  const items = [{ ...original, id: "inactive", status: "INACTIVE" as const }, { ...original, id: "closed", status: "TEMPORARILY_CLOSED" as const }];
  assert.deepEqual(findFacilities(items, original.terminal, "prayer").map((space) => space.id), ["closed"]);
});

test("confirming the same terminal preserves the QR origin; switching terminals clears it", () => {
  const store = useMapStore;
  store.setState(store.getInitialState(), true);
  assert.equal(store.getState().terminalSelected, false);
  store.getState().setCurrentNodeId("T1-ENTRANCE-NODE");
  store.getState().setFloorId("T1-L2");
  store.getState().setTerminal("T1");
  assert.equal(store.getState().terminalSelected, true);
  assert.equal(store.getState().currentNodeId, "T1-ENTRANCE-NODE");
  assert.equal(store.getState().floorId, "T1-L2");
  store.getState().setTerminal("T2");
  assert.equal(store.getState().currentNodeId, null);
  assert.equal(store.getState().fromNodeId, null);
  assert.equal(store.getState().selectedSpaceId, null);
  assert.equal(store.getState().floorId, "T2-L1");
  store.setState(store.getInitialState(), true);
});
