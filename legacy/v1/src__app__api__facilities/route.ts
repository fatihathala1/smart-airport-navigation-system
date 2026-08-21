import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type {
  ApiSuccess,
  ApiError,
  FacilityWithRelations,
  UpdateFacilityPayload,
} from "@/types";

// =============================================================================
// HELPER
// =============================================================================

function parseId(id: string): number | null {
  const parsed = parseInt(id, 10);
  return isNaN(parsed) ? null : parsed;
}

const FACILITY_INCLUDE = {
  category: true,
  floor: true,
  operationalHours: { orderBy: { day: "asc" } },
} as const;

// =============================================================================
// GET /api/facilities/[id]
// =============================================================================

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiSuccess<FacilityWithRelations> | ApiError>> {
  const { id } = await params;
  const facilityId = parseId(id);

  if (!facilityId) {
    return NextResponse.json(
      { success: false, error: "ID tidak valid" },
      { status: 400 }
    );
  }

  try {
    const facility = await prisma.facility.findUnique({
      where: { id: facilityId },
      include: FACILITY_INCLUDE,
    });

    if (!facility) {
      return NextResponse.json(
        { success: false, error: "Fasilitas tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: facility });
  } catch {
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data fasilitas" },
      { status: 500 }
    );
  }
}

// =============================================================================
// PUT /api/facilities/[id] (admin only)
// =============================================================================

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiSuccess<FacilityWithRelations> | ApiError>> {
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
    const body: UpdateFacilityPayload = await req.json();

    // Pastikan fasilitas ada
    const existing = await prisma.facility.findUnique({ where: { id: facilityId } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Fasilitas tidak ditemukan" },
        { status: 404 }
      );
    }

    // Kalau code diupdate, cek unik
    if (body.code && body.code !== existing.code) {
      const codeConflict = await prisma.facility.findUnique({
        where: { code: body.code },
      });
      if (codeConflict) {
        return NextResponse.json(
          { success: false, error: `Code "${body.code}" sudah dipakai fasilitas lain` },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.facility.update({
      where: { id: facilityId },
      data: {
        ...(body.name        !== undefined && { name: body.name }),
        ...(body.code        !== undefined && { code: body.code }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.photo       !== undefined && { photo: body.photo }),
        ...(body.categoryId  !== undefined && { categoryId: body.categoryId }),
        ...(body.floorId     !== undefined && { floorId: body.floorId }),
        ...(body.isActive    !== undefined && { isActive: body.isActive }),
        // Patch gridRow/gridCol jika dikirim (untuk memperbaiki data lama yang null)
        ...(body.gridRow     !== undefined && { gridRow: body.gridRow }),
        ...(body.gridCol     !== undefined && { gridCol: body.gridCol }),
      },
      include: FACILITY_INCLUDE,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: "Gagal mengupdate fasilitas" },
      { status: 500 }
    );
  }
}

// =============================================================================
// DELETE /api/facilities/[id] (admin only)
// =============================================================================

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiSuccess<{ message: string }> | ApiError>> {
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
    const existing = await prisma.facility.findUnique({ where: { id: facilityId } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Fasilitas tidak ditemukan" },
        { status: 404 }
      );
    }

    await prisma.facility.delete({ where: { id: facilityId } });
    // operationalHours ikut terhapus otomatis via onDelete: Cascade di schema

    return NextResponse.json({
      success: true,
      data: { message: `Fasilitas "${existing.name}" berhasil dihapus` },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Gagal menghapus fasilitas" },
      { status: 500 }
    );
  }
}