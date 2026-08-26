import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Portal Admin — Juanda Airport Wayfinding",
  description: "CMS dan Dashboard Operasional Wayfinding Bandara Internasional Juanda",
};

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <AdminDashboardClient
      user={{
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      }}
    />
  );
}
