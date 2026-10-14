import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { can } from "@/lib/authorization";
import prisma from "@/lib/prisma";
import { tenantCreateSchema } from "@/lib/validation";

function serializeTenant(tenant: {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  status: string;
  assignments: Array<{ space: { code: string; floor: { code: string; label: string; terminal: { code: string } } } }>;
  hours: Array<{ is24Hours: boolean; openTime: string | null; closeTime: string | null }>;
}) {
  const assignment = tenant.assignments[0];
  const hours = tenant.hours[0];
  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    category: tenant.category,
    description: tenant.description ?? "",
    status: tenant.status,
    spaceCode: assignment?.space.code ?? "",
    floor: assignment?.space.floor.label ?? "",
    floorCode: assignment?.space.floor.code ?? "",
    terminal: assignment?.space.floor.terminal.code ?? "",
    hours: hours?.is24Hours ? "24 Jam Operasional" : [hours?.openTime, hours?.closeTime].filter(Boolean).join(" - "),
  };
}

export async function GET() {
  try {
    const tenants = await prisma.tenant.findMany({
      orderBy: { name: "asc" },
      include: {
        assignments: { where: { active: true }, take: 1, include: { space: { include: { floor: { include: { terminal: true } } } } } },
        hours: { orderBy: { dayOfWeek: "asc" }, take: 1 },
      },
    });
    return NextResponse.json({ tenants: tenants.map(serializeTenant) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Gagal mengambil direktori tenant" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });
  if (!can(session.user.role, "MANAGE_TENANTS")) return NextResponse.json({ error: "Anda tidak memiliki akses untuk mengelola tenant" }, { status: 403 });

  const parsed = tenantCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Data tenant tidak valid", details: parsed.error.flatten() }, { status: 400 });
  const { name, category, spaceCode, description, status, hours } = parsed.data;

  const space = await prisma.space.findUnique({ where: { code: spaceCode }, include: { assignments: { where: { active: true } } } });
  if (!space) return NextResponse.json({ error: "Blok peta tidak ditemukan" }, { status: 404 });
  if (space.type !== "TENANT") return NextResponse.json({ error: "Blok peta ini bukan area tenant" }, { status: 422 });
  if (space.assignments.length) return NextResponse.json({ error: "Blok peta sudah ditempati tenant lain" }, { status: 409 });

  const slugBase = name.toLocaleLowerCase("id-ID").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "tenant";
  const slug = `${slugBase}-${Date.now()}`;
  try {
    const tenant = await prisma.$transaction(async (tx) => {
      const created = await tx.tenant.create({ data: { name, slug, category, description: description || null, status } });
      await tx.spaceAssignment.create({ data: { spaceId: space.id, tenantId: created.id, active: true } });
      if (hours) {
        const is24Hours = /24\s*jam/i.test(hours);
        const [openTime, closeTime] = hours.split(/\s*-\s*/);
        await tx.operationalHour.create({ data: { tenantId: created.id, dayOfWeek: 0, isOpen: true, is24Hours, openTime: is24Hours ? null : openTime || null, closeTime: is24Hours ? null : closeTime || null } });
      }
      await tx.auditLog.create({ data: { actorId: session.user.id, action: "TENANT_CREATE", entityType: "Tenant", entityId: created.id, after: created } });
      return created;
    });
    const saved = await prisma.tenant.findUniqueOrThrow({
      where: { id: tenant.id },
      include: {
        assignments: { where: { active: true }, take: 1, include: { space: { include: { floor: { include: { terminal: true } } } } } },
        hours: { orderBy: { dayOfWeek: "asc" }, take: 1 },
      },
    });
    return NextResponse.json({ tenant: serializeTenant(saved) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan tenant" }, { status: 500 });
  }
}
