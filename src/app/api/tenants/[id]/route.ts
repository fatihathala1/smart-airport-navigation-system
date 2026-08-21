import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { can } from "@/lib/authorization";
import prisma from "@/lib/prisma";
import { tenantUpdateSchema } from "@/lib/validation";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });
  const { id } = await context.params;
  if (!can(session.user.role, "MANAGE_TENANTS")) return NextResponse.json({ error: "Anda tidak memiliki akses untuk mengelola tenant" }, { status: 403 });
  const parsed = tenantUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Data tenant tidak valid", details: parsed.error.flatten() }, { status: 400 });
  const existing = await prisma.tenant.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Tenant tidak ditemukan" }, { status: 404 });
  const tenant = await prisma.$transaction(async (tx) => {
    const updated = await tx.tenant.update({ where: { id }, data: parsed.data });
    await tx.auditLog.create({ data: { actorId: session.user.id, action: "TENANT_UPDATE", entityType: "Tenant", entityId: id, before: existing, after: updated } });
    return updated;
  });
  return NextResponse.json({ tenant });
}
