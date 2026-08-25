import { NextResponse } from "next/server";
import { routeNodes } from "@/data/demo-wayfinding";
import { findGridRoute } from "@/lib/grid-route";
import { routeRequestSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const parsed = routeRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Permintaan rute tidak valid", details: parsed.error.flatten() }, { status: 400 });
  const terminal = parsed.data.startNodeId.slice(0, 2);
  if (parsed.data.endNodeId.slice(0, 2) !== terminal) return NextResponse.json({ error: "Rute antar terminal belum tersedia" }, { status: 422 });
  const route = findGridRoute(
    routeNodes.find((node) => node.id === parsed.data.startNodeId),
    routeNodes.find((node) => node.id === parsed.data.endNodeId),
    parsed.data,
  );
  if (!route) return NextResponse.json({ error: "Rute publik tidak ditemukan" }, { status: 404 });
  return NextResponse.json({ route, dataStatus: "DEMO_NOT_OPERATIONAL" });
}
