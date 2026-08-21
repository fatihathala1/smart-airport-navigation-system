import { Building2, Clock3, FileClock, Map, MapPinned, ShieldCheck, Store, Tags, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { can, type Permission } from "@/lib/authorization";
import type { AdminRole } from "@/types";

const modules: Array<{ title: string; description: string; permission: Permission; icon: typeof Users }> = [
  { title: "Pengguna dan role", description: "Buat akun admin dan atur kewenangan.", permission: "MANAGE_USERS", icon: Users },
  { title: "Terminal, lantai, dan space", description: "Kelola struktur fisik permanen dan linkage geometri.", permission: "MANAGE_STRUCTURE", icon: Building2 },
  { title: "Graph rute", description: "Kelola node, edge, arah, akses publik, dan closure.", permission: "MANAGE_ROUTE_GRAPH", icon: MapPinned },
  { title: "Tenant", description: "Kelola profil tenant dan assignment ke space.", permission: "MANAGE_TENANTS", icon: Store },
  { title: "Fasilitas dan POI", description: "Kelola gate, toilet, lift, dan fasilitas bandara.", permission: "MANAGE_POI", icon: Map },
  { title: "Kategori", description: "Atur kategori pencarian dan urutannya.", permission: "MANAGE_CATEGORIES", icon: Tags },
  { title: "Jam dan status", description: "Perbarui jam operasional dan status penutupan.", permission: "MANAGE_HOURS", icon: Clock3 },
  { title: "Audit log", description: "Tinjau perubahan penting dan pelakunya.", permission: "VIEW_AUDIT_LOG", icon: FileClock },
];

const roleLabels: Record<AdminRole, string> = { SUPER_ADMIN: "Super Admin", AIRPORT_ADMIN: "Airport Admin" };

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.role) redirect("/auth/signin");
  const role = session.user.role;
  const allowed = modules.filter((item) => can(role, item.permission));
  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/" className="admin-brand"><span className="brand-mark">JUA</span><span><strong>Wayfinding</strong><small>Portal admin</small></span></Link>
        <nav aria-label="Navigasi admin">
          <a href="/admin" aria-current="page"><ShieldCheck size={19} /> Ringkasan</a>
          {allowed.map((item) => <a key={item.title} href={`#${item.permission.toLowerCase()}`}><item.icon size={19} /> {item.title}</a>)}
        </nav>
        <form action={async () => { "use server"; await signOut({ redirectTo: "/auth/signin" }); }}><button type="submit">Keluar</button></form>
      </aside>
      <section className="admin-main">
        <header className="admin-topbar">
          <div><span>Portal operasional</span><strong>{roleLabels[role]}</strong></div>
          <div className="admin-identity"><strong>{session.user.name ?? "Admin"}</strong><span>{session.user.email}</span></div>
        </header>
        <div className="admin-content">
          <div className="admin-intro">
            <span className="space-code">Akses berbasis role</span>
            <h1>Kelola data wayfinding</h1>
            <p>Perubahan struktur, rute, dan tenant dibatasi oleh kewenangan server. Tidak tersedia pendaftaran admin publik.</p>
          </div>
          <div className="admin-notice"><ShieldCheck size={20} /><div><strong>Mode data demonstrasi</strong><span>Hubungkan database dan validasi data resmi Juanda sebelum digunakan secara operasional.</span></div></div>
          <div className="module-grid">
            {allowed.map((item) => (
              <section id={item.permission.toLowerCase()} key={item.title} className="admin-module">
                <item.icon size={22} />
                <div><h2>{item.title}</h2><p>{item.description}</p></div>
                <button type="button" disabled title="CRUD UI berikutnya setelah data resmi tersedia">Buka modul</button>
              </section>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
