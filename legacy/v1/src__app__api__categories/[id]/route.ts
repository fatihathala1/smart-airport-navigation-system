import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { ApiSuccess, ApiError, UpdateCategoryPayload } from "@/types";
import type { Category } from "@/types";

// =============================================================================
// HELPER — parse dan validasi id dari params
// =============================================================================

function parseId(id: string): number | null {
  const parsed = parseInt(id, 10);
  return isNaN(parsed) ? null : parsed;
}

// =============================================================================
// GET /api/categories/[id] — ambil satu kategori
// =============================================================================

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiSuccess<Category> | ApiError>> {
  const { id } = await params;
  const categoryId = parseId(id);

  if (!categoryId) {
    return NextResponse.json(
      { success: false, error: "ID tidak valid" },
      { status: 400 }
    );
  }

  try {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: "Kategori tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: category });
  } catch {
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data kategori" },
      { status: 500 }
    );
  }
}

// =============================================================================
// PUT /api/categories/[id] — update kategori (admin only)
// =============================================================================

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiSuccess<Category> | ApiError>> {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { id } = await params;
  const categoryId = parseId(id);

  if (!categoryId) {
    return NextResponse.json(
      { success: false, error: "ID tidak valid" },
      { status: 400 }
    );
  }

  try {
    const body: UpdateCategoryPayload = await req.json();
    const { name, icon, color, terminals } = body;

    const existing = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Kategori tidak ditemukan" },
        { status: 404 }
      );
    }

    const updated = await prisma.category.update({
      where: { id: categoryId },
      data: {
        ...(name && { name }),
        ...(icon !== undefined && { icon }),
        ...(color && { color }),
        ...(terminals !== undefined && { terminals }),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: "Gagal mengupdate kategori" },
      { status: 500 }
    );
  }
}

// =============================================================================
// DELETE /api/categories/[id] — hapus kategori (admin only)
// =============================================================================

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiSuccess<null> | ApiError>> {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { id } = await params;
  const categoryId = parseId(id);

  if (!categoryId) {
    return NextResponse.json(
      { success: false, error: "ID tidak valid" },
      { status: 400 }
    );
  }

  try {
    const existing = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Kategori tidak ditemukan" },
        { status: 404 }
      );
    }

    const facilityCount = await prisma.facility.count({
      where: { categoryId },
    });

    if (facilityCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Kategori tidak bisa dihapus karena masih dipakai oleh ${facilityCount} fasilitas`,
        },
        { status: 409 }
      );
    }

    await prisma.category.delete({
      where: { id: categoryId },
    });

    return NextResponse.json({ success: true, data: null, message: "Kategori berhasil dihapus" });
  } catch {
    return NextResponse.json(
      { success: false, error: "Gagal menghapus kategori" },
      { status: 500 }
    );
  }
}