import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { ApiSuccess, ApiError, CreateCategoryPayload } from "@/types";
import type { Category } from "@/types";

// =============================================================================
// GET /api/categories — ambil semua kategori
// Query: ?terminal=T1 | T2 (opsional)
// =============================================================================

export async function GET(
  req: NextRequest
): Promise<NextResponse<ApiSuccess<Category[]> | ApiError>> {
  try {
    const { searchParams } = new URL(req.url);
    const terminal = searchParams.get("terminal"); // "T1" | "T2" | null

    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
    });

    // terminals: [] = tampil di semua terminal (backward compat data lama)
    const data = terminal
      ? categories.filter(
          (c) => c.terminals.length === 0 || c.terminals.includes(terminal)
        )
      : categories;

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data kategori" },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST /api/categories — tambah kategori baru (admin only)
// =============================================================================

export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiSuccess<Category> | ApiError>> {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body: CreateCategoryPayload = await req.json();
    const { name, icon, color, terminals = [] } = body;

    // icon opsional — hanya name & color yang wajib
    if (!name || !color) {
      return NextResponse.json(
        { success: false, error: "name dan color wajib diisi" },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: { name, icon, color, terminals },
    });

    return NextResponse.json(
      { success: true, data: category },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Gagal membuat kategori baru" },
      { status: 500 }
    );
  }
}

// PATCH /api/categories — update sortOrder banyak kategori sekaligus (admin only)

export async function PATCH(
  req: NextRequest
): Promise<NextResponse<ApiSuccess<{ updated: number }> | ApiError>> {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body: { id: number; sortOrder: number }[] = await req.json();

    if (!Array.isArray(body) || body.length === 0) {
      return NextResponse.json(
        { success: false, error: "Body harus berupa array" },
        { status: 400 }
      );
    }

    await Promise.all(
      body.map(({ id, sortOrder }) =>
        prisma.category.update({ where: { id }, data: { sortOrder } })
      )
    );

    return NextResponse.json({ success: true, data: { updated: body.length } });
  } catch {
    return NextResponse.json(
      { success: false, error: "Gagal menyimpan urutan kategori" },
      { status: 500 }
    );
  }
}