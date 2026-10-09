import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { can } from "@/lib/authorization";

/**
 * GET /api/admin/map-objects
 * Ambil semua konfigurasi objek peta dari database.
 * Public read: peta publik bisa mengambil data ini tanpa login.
 */
export async function GET() {
  try {
    const configs = await prisma.mapObjectConfig.findMany({
      orderBy: { objectName: "asc" },
    });

    // Ubah ke format Record<objectName, config> yang dipakai frontend
    const byName: Record<string, unknown> = {};
    for (const config of configs) {
      byName[config.objectName] = {
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
      };
    }

    return NextResponse.json(byName, {
      headers: {
        // Cache 30 detik di browser, 60 detik di CDN
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
      },
    });
  } catch {
    return NextResponse.json({ error: "Gagal mengambil konfigurasi objek peta" }, { status: 500 });
  }
}

/**
 * POST /api/admin/map-objects
 * Simpan batch konfigurasi objek peta ke database.
 * Hanya admin yang bisa mengubah.
 * Body: Record<objectName, MapObjectConfig>
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });
  }
  if (!can(session.user.role, "MANAGE_MAP_OBJECTS")) {
    return NextResponse.json({ error: "Anda tidak memiliki akses" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
    if (!body || typeof body !== "object") throw new Error("Invalid body");
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  try {
    const results: string[] = [];
    for (const [objectName, rawConfig] of Object.entries(body)) {
      if (!objectName || typeof rawConfig !== "object" || !rawConfig) continue;
      const config = rawConfig as Record<string, unknown>;

      await prisma.mapObjectConfig.upsert({
        where: { objectName },
        update: {
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
        },
        create: {
          objectName,
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
        },
      });
      results.push(objectName);
    }
    return NextResponse.json({ saved: results.length, objectNames: results });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan konfigurasi" }, { status: 500 });
  }
}
