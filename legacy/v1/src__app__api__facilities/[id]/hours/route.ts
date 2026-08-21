import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type {
  ApiSuccess,
  ApiError,
  OperationalHour,
  CreateOperationalHourPayload,
} from "@/types";

// =============================================================================
// HELPERS
// =============================================================================

function parseId(id: string): number | null {
  const parsed = parseInt(id, 10);
  return isNaN(parsed) ? null : parsed;
}

/** Validasi format "HH:mm" */
function isValidTime(time: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
}

// =============================================================================
// GET /api/facilities/[id]/hours — ambil jam operasional (7 hari)
// =============================================================================

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiSuccess<OperationalHour[]> | ApiError>> {
  const { id } = await params;
  const facilityId = parseId(id);

  if (!facilityId) {
    return NextResponse.json(
      { success: false, error: "ID tidak valid" },
      { status: 400 }
    );
  }

  try {
    // Cek fasilitas ada
    const facility = await prisma.facility.findUnique({ where: { id: facilityId } });
    if (!facility) {
      return NextResponse.json(
        { success: false, error: "Fasilitas tidak ditemukan" },
        { status: 404 }
      );
    }

    const hours = await prisma.operationalHour.findMany({
      where: { facilityId },
      orderBy: { day: "asc" },
    });

    return NextResponse.json({ success: true, data: hours });
  } catch {
    return NextResponse.json(
      { success: false, error: "Gagal mengambil jam operasional" },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST /api/facilities/[id]/hours — upsert jam operasional (admin only)
// Terima array 7 hari sekaligus
// =============================================================================

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiSuccess<OperationalHour[]> | ApiError>> {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { id } = await params;
  const facilityId = parseId(id);

  if (!facilityId) {
    return NextResponse.json(
      { success: false, error: "ID tidak valid" },
      { status: 400 }
    );
  }

  try {
    // Cek fasilitas ada
    const facility = await prisma.facility.findUnique({ where: { id: facilityId } });
    if (!facility) {
      return NextResponse.json(
        { success: false, error: "Fasilitas tidak ditemukan" },
        { status: 404 }
      );
    }

    const body: Omit<CreateOperationalHourPayload, "facilityId">[] = await req.json();

    if (!Array.isArray(body) || body.length === 0) {
      return NextResponse.json(
        { success: false, error: "Body harus berupa array jam operasional" },
        { status: 400 }
      );
    }

    // ── Validasi setiap item ──────────────────────────────────────────────────
    for (const item of body) {
      // Validasi day 1–7
      if (!item.day || item.day < 1 || item.day > 7) {
        return NextResponse.json(
          { success: false, error: `day harus antara 1–7, diterima: ${item.day}` },
          { status: 400 }
        );
      }

      // Kalau tutup → openTime dan closeTime harus null
      if (!item.isOpen) {
        if (item.openTime || item.closeTime) {
          return NextResponse.json(
            {
              success: false,
              error: `Hari ${item.day}: isOpen=false, openTime dan closeTime harus null`,
            },
            { status: 400 }
          );
        }
        continue; // Skip validasi waktu kalau tutup
      }

      // Kalau 24 jam → openTime dan closeTime harus null
      if (item.is24Hours) {
        if (item.openTime || item.closeTime) {
          return NextResponse.json(
            {
              success: false,
              error: `Hari ${item.day}: is24Hours=true, openTime dan closeTime harus null`,
            },
            { status: 400 }
          );
        }
        continue; // Skip validasi waktu kalau 24 jam
      }

      // Kalau buka dan tidak 24 jam → openTime dan closeTime wajib ada dan valid
      if (!item.openTime || !item.closeTime) {
        return NextResponse.json(
          {
            success: false,
            error: `Hari ${item.day}: openTime dan closeTime wajib diisi kalau isOpen=true dan is24Hours=false`,
          },
          { status: 400 }
        );
      }

      if (!isValidTime(item.openTime)) {
        return NextResponse.json(
          {
            success: false,
            error: `Hari ${item.day}: format openTime tidak valid "${item.openTime}", gunakan "HH:mm"`,
          },
          { status: 400 }
        );
      }

      if (!isValidTime(item.closeTime)) {
        return NextResponse.json(
          {
            success: false,
            error: `Hari ${item.day}: format closeTime tidak valid "${item.closeTime}", gunakan "HH:mm"`,
          },
          { status: 400 }
        );
      }
    }

    // ── Upsert semua hari dalam satu transaksi ────────────────────────────────
    const upserted = await prisma.$transaction(
      body.map((item) =>
        prisma.operationalHour.upsert({
          where: {
            facilityId_day: { facilityId, day: item.day },
          },
          update: {
            isOpen:    item.isOpen,
            is24Hours: item.is24Hours,
            openTime:  item.openTime  ?? null,
            closeTime: item.closeTime ?? null,
          },
          create: {
            facilityId,
            day:       item.day,
            isOpen:    item.isOpen,
            is24Hours: item.is24Hours,
            openTime:  item.openTime  ?? null,
            closeTime: item.closeTime ?? null,
          },
        })
      )
    );

    // Sort by day sebelum return
    const sorted = upserted.sort((a, b) => a.day - b.day);

    return NextResponse.json({ success: true, data: sorted });
  } catch {
    return NextResponse.json(
      { success: false, error: "Gagal menyimpan jam operasional" },
      { status: 500 }
    );
  }
}