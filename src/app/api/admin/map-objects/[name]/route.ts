import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { can } from "@/lib/authorization";

type Params = { params: Promise<{ name: string }> };

/**
 * GET /api/admin/map-objects/[name]
 * Ambil konfigurasi satu objek. Public.
 */
export async function GET(_request: Request, { params }: Params) {
  const { name } = await params;
  const objectName = decodeURIComponent(name);

  const config = await prisma.mapObjectConfig.findUnique({ where: { objectName } });
  if (!config) {
    return NextResponse.json({ error: "Objek tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({
    objectName: config.objectName,
    displayName: config.displayName,
    entityType: config.entityType,
    color: config.color,
    occupancy: config.occupancy,
    description: config.description,
    photoUrl: config.photoUrl,
    websiteUrl: config.websiteUrl,
    instagramUrl: config.instagramUrl,
    contact: config.contact,
    openTime: config.openTime,
    closeTime: config.closeTime,
    activeFrom: config.activeFrom,
    activeUntil: config.activeUntil,
    entryDoors: config.entryDoors,
    updatedAt: config.updatedAt.toISOString(),
  });
}

/**
 * PUT /api/admin/map-objects/[name]
 * Simpan/update konfigurasi satu objek. Hanya admin.
 */
export async function PUT(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });
  }
  if (!can(session.user.role, "MANAGE_MAP_OBJECTS")) {
    return NextResponse.json({ error: "Anda tidak memiliki akses" }, { status: 403 });
  }

  const { name } = await params;
  const objectName = decodeURIComponent(name);

  let config: Record<string, unknown>;
  try {
    config = await request.json();
    if (!config || typeof config !== "object") throw new Error("Invalid");
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const data = {
    displayName: typeof config.displayName === "string" ? config.displayName : "",
    entityType: typeof config.entityType === "string" ? config.entityType : "TENANT",
    color: typeof config.color === "string" ? config.color : "",
    occupancy: typeof config.occupancy === "string" ? config.occupancy : "OCCUPIED",
    description: typeof config.description === "string" ? config.description : "",
    photoUrl: typeof config.photoUrl === "string" ? config.photoUrl : "",
    websiteUrl: typeof config.websiteUrl === "string" ? config.websiteUrl : "",
    instagramUrl: typeof config.instagramUrl === "string" ? config.instagramUrl : "",
    contact: typeof config.contact === "string" ? config.contact : "",
    openTime: typeof config.openTime === "string" ? config.openTime : "",
    closeTime: typeof config.closeTime === "string" ? config.closeTime : "",
    activeFrom: typeof config.activeFrom === "string" ? config.activeFrom : "",
    activeUntil: typeof config.activeUntil === "string" ? config.activeUntil : "",
    entryDoors: Array.isArray(config.entryDoors) ? config.entryDoors : [],
    updatedById: session.user.id,
  };

  try {
    const result = await prisma.mapObjectConfig.upsert({
      where: { objectName },
      update: data,
      create: { objectName, ...data },
    });

    return NextResponse.json({
      objectName: result.objectName,
      updatedAt: result.updatedAt.toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan konfigurasi" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/map-objects/[name]
 * Hapus konfigurasi satu objek (reset ke default). Hanya SUPER_ADMIN.
 */
export async function DELETE(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });
  }
  if (session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Hanya Super Admin yang dapat menghapus konfigurasi" }, { status: 403 });
  }

  const { name } = await params;
  const objectName = decodeURIComponent(name);

  try {
    await prisma.mapObjectConfig.delete({ where: { objectName } });
    return NextResponse.json({ deleted: objectName });
  } catch {
    return NextResponse.json({ error: "Konfigurasi tidak ditemukan atau sudah dihapus" }, { status: 404 });
  }
}
