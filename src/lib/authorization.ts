import type { AdminRole } from "@/types";

export type Permission = "MANAGE_USERS" | "MANAGE_STRUCTURE" | "MANAGE_ROUTE_GRAPH" | "MANAGE_TENANTS" | "MANAGE_POI" | "MANAGE_CATEGORIES" | "MANAGE_HOURS" | "VIEW_AUDIT_LOG";
const permissions: Record<AdminRole, ReadonlySet<Permission>> = {
  SUPER_ADMIN: new Set(["MANAGE_USERS", "MANAGE_STRUCTURE", "MANAGE_ROUTE_GRAPH", "MANAGE_TENANTS", "MANAGE_POI", "MANAGE_CATEGORIES", "MANAGE_HOURS", "VIEW_AUDIT_LOG"]),
  AIRPORT_ADMIN: new Set(["MANAGE_TENANTS", "MANAGE_POI", "MANAGE_CATEGORIES", "MANAGE_HOURS"]),
};
export function can(role: AdminRole | null | undefined, permission: Permission) { return role ? permissions[role].has(permission) : false; }
export function requireRole(role: AdminRole | null | undefined) { if (!role) throw new Error("UNAUTHORIZED"); return role; }
