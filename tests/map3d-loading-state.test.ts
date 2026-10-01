import assert from "node:assert/strict";
import test from "node:test";
import { isMapModelLoading } from "../src/lib/map3d/loading-state";

test("overlay hilang saat model siap meski progress loader tetap 0", () => {
  assert.equal(isMapModelLoading(true), false);
});

test("overlay tetap tampil sampai model siap", () => {
  assert.equal(isMapModelLoading(false), true);
});
