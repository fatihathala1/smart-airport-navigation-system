import test from "node:test";
import assert from "node:assert/strict";
import { can, requireRole } from "../src/lib/authorization";

test("role permission matrix protects sensitive structure", () => {
  assert.equal(can("SUPER_ADMIN", "MANAGE_ROUTE_GRAPH"), true);
  assert.equal(can("AIRPORT_ADMIN", "MANAGE_ROUTE_GRAPH"), false);
  assert.equal(can("AIRPORT_ADMIN", "MANAGE_USERS"), false);
});

test("airport admin can manage tenants without receiving global access", () => {
  assert.equal(can("AIRPORT_ADMIN", "MANAGE_TENANTS"), true);
  assert.equal(can("AIRPORT_ADMIN", "MANAGE_STRUCTURE"), false);
  assert.equal(can("AIRPORT_ADMIN", "VIEW_AUDIT_LOG"), false);
});

test("public user cannot pass admin authorization", () => {
  assert.equal(can(null, "MANAGE_TENANTS"), false);
  assert.throws(() => requireRole(null), /UNAUTHORIZED/);
});
