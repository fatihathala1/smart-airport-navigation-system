import test from "node:test";
import assert from "node:assert/strict";
import { routeRequestSchema, tenantUpdateSchema } from "../src/lib/validation";

test("route API rejects missing and out-of-range input", () => {
  assert.equal(routeRequestSchema.safeParse({ endNodeId: "B" }).success, false);
  assert.equal(routeRequestSchema.safeParse({ startNodeId: "A", endNodeId: "B", walkingSpeedMetersPerMinute: 200 }).success, false);
  assert.equal(routeRequestSchema.safeParse({ startNodeId: "A", endNodeId: "B" }).success, true);
});

test("tenant CRUD validation rejects unknown fields and unsafe URLs", () => {
  assert.equal(tenantUpdateSchema.safeParse({ name: "Demo Tenant", role: "SUPER_ADMIN" }).success, false);
  assert.equal(tenantUpdateSchema.safeParse({ photoUrl: "javascript:alert(1)" }).success, false);
  assert.equal(tenantUpdateSchema.safeParse({ description: "Informasi tenant yang valid" }).success, true);
});
