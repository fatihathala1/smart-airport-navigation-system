import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("peta 3D Terminal 1 menyediakan model GLB dan graph navigasi", async () => {
  const model = await readFile("public/models/buildings-ground-floor.glb");
  const graph = await readFile("public/navigation/navigation-graph-ground-floor.svg", "utf8");

  assert.equal(model.toString("ascii", 0, 4), "glTF");
  assert.match(graph, /id="POI_ORANGE"/);
  assert.match(graph, /id="PATH_RED"/);
  assert.match(graph, /id="EDGES"/);
});
