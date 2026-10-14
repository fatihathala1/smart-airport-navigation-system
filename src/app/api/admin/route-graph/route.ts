import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { can } from "@/lib/authorization";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });
  if (!can(session.user.role, "MANAGE_ROUTE_GRAPH")) return NextResponse.json({ error: "Anda tidak memiliki akses" }, { status: 403 });
  try {
    const [nodes, edges, connectors, accessibleEdges, closures, availableEdges] = await Promise.all([
      prisma.routeNode.count({ where: { active: true } }),
      prisma.routeEdge.count({ where: { active: true } }),
      prisma.routeEdge.count({ where: { active: true, type: { in: ["STAIRS", "LIFT", "ESCALATOR"] } } }),
      prisma.routeEdge.count({ where: { active: true, accessible: true } }),
      prisma.routeEdge.findMany({ where: { active: false }, orderBy: { updatedAt: "desc" }, take: 20, include: { fromNode: true, toNode: true } }),
      prisma.routeEdge.findMany({ where: { active: true }, orderBy: { updatedAt: "desc" }, take: 20, include: { fromNode: true, toNode: true } }),
    ]);
    return NextResponse.json({
      metrics: { nodes, edges, connectors, accessiblePercent: edges ? Math.round((accessibleEdges / edges) * 100) : 0 },
      closures: closures.map((edge) => ({ id: edge.id, label: `${edge.fromNode.label ?? edge.fromNode.code} → ${edge.toNode.label ?? edge.toNode.code}`, from: edge.fromNode.code, to: edge.toNode.code, floorId: edge.fromNode.floorId })),
      availableEdges: availableEdges.map((edge) => ({ id: edge.id, label: `${edge.fromNode.label ?? edge.fromNode.code} → ${edge.toNode.label ?? edge.toNode.code}`, from: edge.fromNode.code, to: edge.toNode.code, floorId: edge.fromNode.floorId })),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Gagal mengambil data navigation graph" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });
  if (!can(session.user.role, "MANAGE_ROUTE_GRAPH")) return NextResponse.json({ error: "Anda tidak memiliki akses" }, { status: 403 });
  const body = await request.json().catch(() => null) as { edgeId?: string; active?: boolean } | null;
  if (!body?.edgeId || typeof body.active !== "boolean") return NextResponse.json({ error: "Data edge tidak valid" }, { status: 400 });
  try {
    const existing = await prisma.routeEdge.findUnique({ where: { id: body.edgeId } });
    if (!existing) return NextResponse.json({ error: "Edge graph tidak ditemukan" }, { status: 404 });
    const edge = await prisma.$transaction(async (tx) => {
      const updated = await tx.routeEdge.update({ where: { id: existing.id }, data: { active: body.active, status: body.active ? "ACTIVE" : "TEMPORARILY_CLOSED" } });
      await tx.auditLog.create({ data: { actorId: session.user.id, action: body.active ? "ROUTE_EDGE_REOPEN" : "ROUTE_EDGE_CLOSE", entityType: "RouteEdge", entityId: existing.id, before: { active: existing.active }, after: { active: updated.active } } });
      return updated;
    });
    return NextResponse.json({ edge: { id: edge.id, active: edge.active } });
  } catch {
    return NextResponse.json({ error: "Gagal memperbarui status edge" }, { status: 500 });
  }
}
