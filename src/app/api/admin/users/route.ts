import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { can } from "@/lib/authorization";
import prisma from "@/lib/prisma";

function serializeUser(user: { id: string; name: string; email: string; role: "SUPER_ADMIN" | "AIRPORT_ADMIN"; active: boolean; updatedAt: Date }) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.active ? "ACTIVE" : "INACTIVE",
    lastLogin: "Belum tercatat",
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });
  if (!can(session.user.role, "MANAGE_USERS")) return NextResponse.json({ error: "Anda tidak memiliki akses" }, { status: 403 });
  try {
    const users = await prisma.user.findMany({ orderBy: [{ role: "asc" }, { name: "asc" }] });
    return NextResponse.json({ users: users.map(serializeUser) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Gagal mengambil akun administrator" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });
  if (!can(session.user.role, "MANAGE_USERS")) return NextResponse.json({ error: "Anda tidak memiliki akses" }, { status: 403 });
  const body = await request.json().catch(() => null) as { id?: string; active?: boolean; name?: string; email?: string; password?: string } | null;
  if (!body?.id) return NextResponse.json({ error: "Data akun tidak valid" }, { status: 400 });
  if (body.id === session.user.id) return NextResponse.json({ error: "Akun yang sedang digunakan tidak dapat diubah" }, { status: 422 });
  try {
    const existing = await prisma.user.findUnique({ where: { id: body.id } });
    if (!existing) return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 });
    if (existing.role === "SUPER_ADMIN") return NextResponse.json({ error: "Akun Super Admin tidak dapat diubah dari menu ini" }, { status: 403 });
    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    if (body.name !== undefined && (!name || name.length < 2)) return NextResponse.json({ error: "Nama minimal 2 karakter" }, { status: 400 });
    if (body.email !== undefined && (!email || !/^\S+@\S+\.\S+$/.test(email))) return NextResponse.json({ error: "Email tidak valid" }, { status: 400 });
    if (body.password && body.password.length < 8) return NextResponse.json({ error: "Password minimal 8 karakter" }, { status: 400 });
    const passwordHash = body.password ? await bcrypt.hash(body.password, 12) : undefined;
    const updated = await prisma.$transaction(async (tx) => {
      const account = await tx.user.update({
        where: { id: body.id },
        data: {
          ...(typeof body.active === "boolean" ? { active: body.active } : {}),
          ...(name ? { name } : {}),
          ...(email ? { email } : {}),
          ...(passwordHash ? { passwordHash } : {}),
        },
      });
      await tx.auditLog.create({ data: { actorId: session.user.id, action: "USER_UPDATE", entityType: "User", entityId: body.id, before: { name: existing.name, email: existing.email, active: existing.active }, after: { name: account.name, email: account.email, active: account.active } } });
      return account;
    });
    return NextResponse.json({ user: serializeUser(updated) });
  } catch {
    return NextResponse.json({ error: "Gagal memperbarui status akun" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });
  if (!can(session.user.role, "MANAGE_USERS")) return NextResponse.json({ error: "Anda tidak memiliki akses" }, { status: 403 });
  const body = await request.json().catch(() => null) as { id?: string } | null;
  if (!body?.id) return NextResponse.json({ error: "ID akun diperlukan" }, { status: 400 });
  if (body.id === session.user.id) return NextResponse.json({ error: "Akun yang sedang digunakan tidak dapat dihapus" }, { status: 422 });
  try {
    const existing = await prisma.user.findUnique({ where: { id: body.id } });
    if (!existing) return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 });
    if (existing.role === "SUPER_ADMIN") return NextResponse.json({ error: "Akun Super Admin tidak dapat dihapus" }, { status: 403 });
    await prisma.$transaction(async (tx) => {
      await tx.auditLog.create({ data: { actorId: session.user.id, action: "USER_DELETE", entityType: "User", entityId: existing.id, before: { name: existing.name, email: existing.email, role: existing.role, active: existing.active } } });
      await tx.user.delete({ where: { id: existing.id } });
    });
    return NextResponse.json({ deletedId: existing.id });
  } catch {
    return NextResponse.json({ error: "Gagal menghapus akun" }, { status: 500 });
  }
}
