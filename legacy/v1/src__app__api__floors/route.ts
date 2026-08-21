import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { ApiSuccess, ApiError } from "@/types";
import type { Floor } from "@/types";

// GET /api/floors?terminal=T1
export async function GET(
  req: NextRequest
): Promise<NextResponse<ApiSuccess<Floor[]> | ApiError>> {
  try {
    const { searchParams } = new URL(req.url);
    const terminal = searchParams.get("terminal");

    const floors = await prisma.floor.findMany({
      where: terminal ? { terminal } : undefined,
      orderBy: [{ terminal: "asc" }, { floorNumber: "asc" }],
    });

    return NextResponse.json({ success: true, data: floors });
  } catch {
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data lantai" },
      { status: 500 }
    );
  }
}