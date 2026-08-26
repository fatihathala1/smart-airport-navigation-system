"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  Compass,
  Edit3,
  FileClock,
  KeyRound,
  Layers,
  LogOut,
  Map,
  MapPinned,
  Plus,
  PlusCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  Store,
  Tags,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import type { AdminRole } from "@/types";

// Initial Demo Data for Admin Komersil
const INITIAL_TENANTS = [
  { id: "ten-01", name: "Kopi Juanda", category: "Kuliner & F&B", terminal: "T1", floor: "Lantai 1", spaceCode: "T1-L1-001", status: "ACTIVE", hours: "06:00 - 22:00" },
  { id: "ten-02", name: "Dapur Nusantara", category: "Kuliner & F&B", terminal: "T1", floor: "Lantai 1", spaceCode: "T1-L1-002", status: "ACTIVE", hours: "07:00 - 21:30" },
  { id: "ten-03", name: "Soto Cak Har", category: "Kuliner & F&B", terminal: "T1", floor: "Lantai 1", spaceCode: "T1-L1-003", status: "ACTIVE", hours: "06:30 - 21:00" },
  { id: "ten-04", name: "Batik Angkasa", category: "Toko & Fashion", terminal: "T1", floor: "Lantai 2", spaceCode: "T1-L2-005", status: "ACTIVE", hours: "08:00 - 20:00" },
  { id: "ten-05", name: "Starbucks Juanda", category: "Kuliner & F&B", terminal: "T2", floor: "Lantai 1", spaceCode: "T2-L1-001", status: "ACTIVE", hours: "05:00 - 23:00" },
  { id: "ten-06", name: "Nusantara Fashion", category: "Toko & Fashion", terminal: "T2", floor: "Lantai 1", spaceCode: "T2-L1-004", status: "TEMPORARILY_CLOSED", hours: "08:00 - 20:00" },
  { id: "ten-07", name: "Ayam Rempah Juanda", category: "Kuliner & F&B", terminal: "T2", floor: "Lantai 2", spaceCode: "T2-L2-002", status: "ACTIVE", hours: "07:00 - 21:00" },
  { id: "ten-08", name: "Kantor Layanan Maskapai", category: "Kantor & Layanan", terminal: "T1", floor: "Lantai 1", spaceCode: "T1-L1-010", status: "ACTIVE", hours: "24 Jam Operasional" },
];

const INITIAL_USERS = [
  { id: "usr-01", name: "Super Administrator", email: "admin@juanda-airport.com", role: "SUPER_ADMIN" as AdminRole, status: "ACTIVE", lastLogin: "Hari ini, 08:30" },
  { id: "usr-02", name: "Budi Santoso (Admin Komersil)", email: "budi.komersil@juanda-airport.com", role: "AIRPORT_ADMIN" as AdminRole, status: "ACTIVE", lastLogin: "Kemarin, 14:15" },
  { id: "usr-03", name: "Siti Rahma (Operator T1)", email: "siti.t1@juanda-airport.com", role: "AIRPORT_ADMIN" as AdminRole, status: "ACTIVE", lastLogin: "24 Aug 2026" },
  { id: "usr-04", name: "Dewi Lestari (Operator T2)", email: "dewi.t2@juanda-airport.com", role: "AIRPORT_ADMIN" as AdminRole, status: "INACTIVE", lastLogin: "18 Aug 2026" },
];

const AUDIT_LOGS = [
  { id: "log-101", timestamp: "2026-08-26 00:45:12", actor: "Super Administrator", action: "UPDATE_SPACE_STATUS", entity: "Space T1-L2-005", ip: "192.168.1.10" },
  { id: "log-102", timestamp: "2026-08-25 18:22:04", actor: "Budi Santoso", action: "UPDATE_TENANT_HOURS", entity: "Tenant Kopi Juanda", ip: "192.168.1.24" },
  { id: "log-103", timestamp: "2026-08-25 11:05:30", actor: "Super Administrator", action: "CREATE_ADMIN_USER", entity: "User siti.t1@juanda-airport.com", ip: "192.168.1.10" },
  { id: "log-104", timestamp: "2026-08-24 09:14:55", actor: "Siti Rahma", action: "TOGGLE_FACILITY_STATUS", entity: "Facility Mushola T1-L1", ip: "192.168.1.33" },
];

export function AdminDashboardClient() {
  const [activeRole, setActiveRole] = useState<AdminRole>("AIRPORT_ADMIN");
  const [activeTab, setActiveTab] = useState<string>("tenants");
  const [tenants, setTenants] = useState(INITIAL_TENANTS);
  const [users, setUsers] = useState(INITIAL_USERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddTenantModal, setShowAddTenantModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  // New Tenant Form state
  const [newTenant, setNewTenant] = useState({
    name: "",
    category: "Kuliner & F&B",
    terminal: "T1",
    floor: "Lantai 1",
    spaceCode: "",
    hours: "07:00 - 21:00",
  });

  // New Admin User Form state
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "AIRPORT_ADMIN" as AdminRole,
    password: "",
  });

  const handleAddTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenant.name || !newTenant.spaceCode) return;
    const created = {
      id: `ten-${Date.now()}`,
      name: newTenant.name,
      category: newTenant.category,
      terminal: newTenant.terminal,
      floor: newTenant.floor,
      spaceCode: newTenant.spaceCode,
      status: "ACTIVE",
      hours: newTenant.hours,
    };
    setTenants([created, ...tenants]);
    setNewTenant({ name: "", category: "Kuliner & F&B", terminal: "T1", floor: "Lantai 1", spaceCode: "", hours: "07:00 - 21:00" });
    setShowAddTenantModal(false);
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) return;
    const created = {
      id: `usr-${Date.now()}`,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      status: "ACTIVE",
      lastLogin: "Baru saja",
    };
    setUsers([created, ...users]);
    setNewUser({ name: "", email: "", role: "AIRPORT_ADMIN", password: "" });
    setShowAddUserModal(false);
  };

  const toggleTenantStatus = (id: string) => {
    setTenants(
      tenants.map((t) =>
        t.id === id ? { ...t, status: t.status === "ACTIVE" ? "TEMPORARILY_CLOSED" : "ACTIVE" } : t
      )
    );
  };

  const toggleUserStatus = (id: string) => {
    setUsers(
      users.map((u) =>
        u.id === id ? { ...u, status: u.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" } : u
      )
    );
  };

  const filteredTenants = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.spaceCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="admin-dashboard-root">
      {/* Admin Top Header Navigation */}
      <header className="admin-header-bar">
        <div className="admin-header-left">
          <Link href="/" className="admin-brand-link">
            <Image src="/injourney-airports.png" width={180} height={52} priority alt="InJourney Airports" />
          </Link>
          <div className="admin-header-divider" />
          <div className="admin-title-block">
            <strong>PORTAL MANAJEMEN OPERASIONAL</strong>
            <small>Bandara Internasional Juanda</small>
          </div>
        </div>

        {/* Role Switcher Pills */}
        <div className="role-switcher-container">
          <span className="role-switch-label">Pratinjau Role:</span>
          <div className="role-switcher-pills">
            <button
              type="button"
              className="role-btn"
              data-active={activeRole === "AIRPORT_ADMIN"}
              onClick={() => {
                setActiveRole("AIRPORT_ADMIN");
                setActiveTab("tenants");
              }}
            >
              <Store size={15} />
              <span>Admin Komersil</span>
            </button>
            <button
              type="button"
              className="role-btn"
              data-active={activeRole === "SUPER_ADMIN"}
              onClick={() => {
                setActiveRole("SUPER_ADMIN");
                setActiveTab("users");
              }}
            >
              <ShieldCheck size={15} />
              <span>Superadmin</span>
            </button>
          </div>
        </div>

        <div className="admin-header-right">
          <Link href="/" className="back-visitor-link">
            <ArrowRight size={15} style={{ transform: "rotate(180deg)" }} />
            <span>Ke Tampilan Pengunjung</span>
          </Link>
        </div>
      </header>

      <div className="admin-body-container">
        {/* Sidebar Controls */}
        <aside className="admin-sidebar-nav">
          <div className="user-profile-badge">
            <div className="avatar-circle">
              {activeRole === "SUPER_ADMIN" ? "SA" : "AK"}
            </div>
            <div className="user-info">
              <strong>{activeRole === "SUPER_ADMIN" ? "Super Administrator" : "Admin Komersil Juanda"}</strong>
              <small>{activeRole === "SUPER_ADMIN" ? "superadmin@juanda-airport.com" : "komersil@juanda-airport.com"}</small>
            </div>
          </div>

          <nav className="nav-menu-list">
            {activeRole === "AIRPORT_ADMIN" && (
              <>
                <button
                  type="button"
                  className="nav-item"
                  data-active={activeTab === "tenants"}
                  onClick={() => setActiveTab("tenants")}
                >
                  <Store size={18} />
                  <span>Manajemen Tenant</span>
                </button>
                <button
                  type="button"
                  className="nav-item"
                  data-active={activeTab === "spaces"}
                  onClick={() => setActiveTab("spaces")}
                >
                  <Building2 size={18} />
                  <span>Alokasi Space & Ruang</span>
                </button>
                <button
                  type="button"
                  className="nav-item"
                  data-active={activeTab === "facilities"}
                  onClick={() => setActiveTab("facilities")}
                >
                  <Map size={18} />
                  <span>Fasilitas & POI Bandara</span>
                </button>
              </>
            )}

            {activeRole === "SUPER_ADMIN" && (
              <>
                <button
                  type="button"
                  className="nav-item"
                  data-active={activeTab === "users"}
                  onClick={() => setActiveTab("users")}
                >
                  <Users size={18} />
                  <span>Akun & Role Administrator</span>
                </button>
                <button
                  type="button"
                  className="nav-item"
                  data-active={activeTab === "graph"}
                  onClick={() => setActiveTab("graph")}
                >
                  <MapPinned size={18} />
                  <span>Navigation Graph Engineering</span>
                </button>
                <button
                  type="button"
                  className="nav-item"
                  data-active={activeTab === "audit"}
                  onClick={() => setActiveTab("audit")}
                >
                  <FileClock size={18} />
                  <span>Audit Logs & Log Keamanan</span>
                </button>
              </>
            )}
          </nav>
        </aside>

        {/* Main Content Area */}
        <section className="admin-main-view">
          {/* Dashboard Header Bar */}
          <div className="view-banner">
            <div>
              <span className="badge-role-pill">
                {activeRole === "SUPER_ADMIN" ? "SUPERADMIN DASHBOARD" : "ADMIN KOMERSIL DASHBOARD"}
              </span>
              <h1>
                {activeRole === "SUPER_ADMIN"
                  ? "Manajemen Sistem & Keamanan Wayfinding"
                  : "Kelola Tenant & Fasilitas Komersil Bandara Juanda"}
              </h1>
              <p>
                {activeRole === "SUPER_ADMIN"
                  ? "Pusat kendali hak akses pengguna, pemantauan graph rute A*, serta audit log log aktivitas sistem."
                  : "Kelola status tenant, alokasi ruang komersil Terminal 1 & 2, serta jam operasional fasilitas."}
              </p>
            </div>
          </div>

          {/* Stats Metrics Cards */}
          <div className="metrics-grid">
            {activeRole === "AIRPORT_ADMIN" ? (
              <>
                <div className="metric-card">
                  <div className="metric-icon fnb">
                    <Store size={22} />
                  </div>
                  <div>
                    <strong>{tenants.length} Tenant</strong>
                    <span>Terdaftar di T1 & T2</span>
                  </div>
                </div>
                <div className="metric-card">
                  <div className="metric-icon space">
                    <Building2 size={22} />
                  </div>
                  <div>
                    <strong>24 Unit Space</strong>
                    <span>88% Okupansi Komersil</span>
                  </div>
                </div>
                <div className="metric-card">
                  <div className="metric-icon poi">
                    <Map size={22} />
                  </div>
                  <div>
                    <strong>32 POI Fasilitas</strong>
                    <span>Toilet, Musala, ATM, Gate</span>
                  </div>
                </div>
                <div className="metric-card">
                  <div className="metric-icon hours">
                    <Clock3 size={22} />
                  </div>
                  <div>
                    <strong>94% Buka Operasional</strong>
                    <span>{tenants.filter((t) => t.status === "ACTIVE").length} Aktif</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="metric-card">
                  <div className="metric-icon sec">
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <strong>Sistem 100% Aman</strong>
                    <span>Prepared Queries & RBAC</span>
                  </div>
                </div>
                <div className="metric-card">
                  <div className="metric-icon users">
                    <Users size={22} />
                  </div>
                  <div>
                    <strong>{users.length} Akun Admin</strong>
                    <span>1 Superadmin, 3 Airport Admin</span>
                  </div>
                </div>
                <div className="metric-card">
                  <div className="metric-icon graph">
                    <MapPinned size={22} />
                  </div>
                  <div>
                    <strong>142 Nodes / 286 Edges</strong>
                    <span>A* Routing Engine</span>
                  </div>
                </div>
                <div className="metric-card">
                  <div className="metric-icon logs">
                    <FileClock size={22} />
                  </div>
                  <div>
                    <strong>{AUDIT_LOGS.length} Log Aktivitas</strong>
                    <span>Audit Log Terverifikasi</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Dynamic Content Views */}
          {/* AIRPORT ADMIN: TENANTS TAB */}
          {activeRole === "AIRPORT_ADMIN" && activeTab === "tenants" && (
            <div className="content-box">
              <div className="box-header">
                <div className="box-title">
                  <h2>Direktori Tenant Komersil</h2>
                  <p>Daftar tenant yang menempati space di Terminal 1 dan Terminal 2 Juanda</p>
                </div>
                <div className="box-actions">
                  <div className="search-input-wrapper">
                    <Search size={16} />
                    <input
                      type="text"
                      placeholder="Cari tenant..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <button type="button" className="btn-primary" onClick={() => setShowAddTenantModal(true)}>
                    <Plus size={16} /> Tambah Tenant
                  </button>
                </div>
              </div>

              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nama Tenant</th>
                      <th>Kategori</th>
                      <th>Lokasi</th>
                      <th>Space Code</th>
                      <th>Jam Operasional</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTenants.map((t) => (
                      <tr key={t.id}>
                        <td>
                          <strong>{t.name}</strong>
                        </td>
                        <td>
                          <span className="badge-cat">{t.category}</span>
                        </td>
                        <td>
                          {t.terminal} • {t.floor}
                        </td>
                        <td>
                          <code>{t.spaceCode}</code>
                        </td>
                        <td>{t.hours}</td>
                        <td>
                          <span className={`status-pill ${t.status === "ACTIVE" ? "active" : "closed"}`}>
                            {t.status === "ACTIVE" ? "BUKA" : "TUTUP SEMENTARA"}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn-sm-action"
                            onClick={() => toggleTenantStatus(t.id)}
                            title="Ubah status operasional"
                          >
                            <RefreshCw size={13} />
                            <span>Toggle Status</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* AIRPORT ADMIN: SPACES TAB */}
          {activeRole === "AIRPORT_ADMIN" && activeTab === "spaces" && (
            <div className="content-box">
              <div className="box-header">
                <div className="box-title">
                  <h2>Alokasi Ruang & Unit Space Terminal</h2>
                  <p>Pemetaan unit polygon ruang visual terhadap tenant dan fungsi publik</p>
                </div>
              </div>

              <div className="space-grid-container">
                {["T1-L1", "T1-L2", "T2-L1", "T2-L2"].map((floor) => (
                  <div key={floor} className="floor-space-card">
                    <h3>
                      <Building2 size={18} /> {floor.replace("-", " • ")}
                    </h3>
                    <div className="space-chips-list">
                      {tenants
                        .filter((t) => `${t.terminal}-${t.floor.endsWith("1") ? "L1" : "L2"}` === floor)
                        .map((t) => (
                          <div key={t.id} className="space-item-pill">
                            <code>{t.spaceCode}</code>
                            <strong>{t.name}</strong>
                            <small>{t.category}</small>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AIRPORT ADMIN: FACILITIES TAB */}
          {activeRole === "AIRPORT_ADMIN" && activeTab === "facilities" && (
            <div className="content-box">
              <div className="box-header">
                <div className="box-title">
                  <h2>Status POI & Fasilitas Bandara</h2>
                  <p>Pengelolaan toilet, musala, ATM center, lift, dan gate bandara</p>
                </div>
              </div>

              <div className="facility-status-list">
                {[
                  { name: "Toilet Publik Utama T1-L1", type: "Toilet", status: "ACTIVE" },
                  { name: "Mushola Al-Ikhlas T1-L1", type: "Musala", status: "ACTIVE" },
                  { name: "ATM Center Mandiri/BCA T1-L1", type: "ATM", status: "ACTIVE" },
                  { name: "Boarding Gate 01 - 08 T1-L2", type: "Gate", status: "ACTIVE" },
                  { name: "Toilet Keberangkatan T2-L2", type: "Toilet", status: "MAINTENANCE" },
                ].map((fac, idx) => (
                  <div key={idx} className="facility-row-card">
                    <div>
                      <strong>{fac.name}</strong>
                      <span className="badge-cat">{fac.type}</span>
                    </div>
                    <span className={`status-pill ${fac.status === "ACTIVE" ? "active" : "closed"}`}>
                      {fac.status === "ACTIVE" ? "SIAP DIGUNAKAN" : "PERBAIKAN / MAINTENANCE"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUPERADMIN: USERS TAB */}
          {activeRole === "SUPER_ADMIN" && activeTab === "users" && (
            <div className="content-box">
              <div className="box-header">
                <div className="box-title">
                  <h2>Akun & Hak Akses Administrator</h2>
                  <p>Manajemen autentikasi RBAC (Role-Based Access Control) untuk pengelola Juanda</p>
                </div>
                <button type="button" className="btn-primary" onClick={() => setShowAddUserModal(true)}>
                  <UserPlus size={16} /> Tambah Admin Baru
                </button>
              </div>

              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nama Pengguna</th>
                      <th>Email</th>
                      <th>Role Hak Akses</th>
                      <th>Login Terakhir</th>
                      <th>Status Akun</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <strong>{u.name}</strong>
                        </td>
                        <td>{u.email}</td>
                        <td>
                          <span className={`role-pill ${u.role === "SUPER_ADMIN" ? "super" : "airport"}`}>
                            {u.role === "SUPER_ADMIN" ? "SUPERADMIN" : "AIRPORT ADMIN"}
                          </span>
                        </td>
                        <td>{u.lastLogin}</td>
                        <td>
                          <span className={`status-pill ${u.status === "ACTIVE" ? "active" : "closed"}`}>
                            {u.status === "ACTIVE" ? "AKTIF" : "NONAKTIF"}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn-sm-action"
                            onClick={() => toggleUserStatus(u.id)}
                          >
                            <RefreshCw size={13} />
                            <span>Toggle Status</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUPERADMIN: ROUTE GRAPH TAB */}
          {activeRole === "SUPER_ADMIN" && activeTab === "graph" && (
            <div className="content-box">
              <div className="box-header">
                <div className="box-title">
                  <h2>Navigation Graph Engineering (A*)</h2>
                  <p>Pemantauan kesehatan node, edge, dan penutupan jalur darurat</p>
                </div>
              </div>

              <div className="graph-engineering-grid">
                <div className="graph-card">
                  <h3>Graph Metrics</h3>
                  <ul>
                    <li>Total Navigation Nodes: <strong>142 Nodes</strong></li>
                    <li>Total Pedestrian Edges: <strong>286 Edges</strong></li>
                    <li>Koneksi Vertikal (Lift/Tangga): <strong>8 Connector Nodes</strong></li>
                    <li>Jalur Ramah Kursi Roda: <strong>96% Accessible</strong></li>
                  </ul>
                </div>

                <div className="graph-card">
                  <h3>Penutupan Jalur Darurat (Emergency Closure)</h3>
                  <p>Gunakan untuk memblokir jalur lorong saat renovasi tanpa menggambar ulang peta visual:</p>
                  <button type="button" className="btn-secondary">
                    <AlertTriangle size={15} /> Tutup Lorong Keberangkatan T1-L1
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SUPERADMIN: AUDIT LOGS TAB */}
          {activeRole === "SUPER_ADMIN" && activeTab === "audit" && (
            <div className="content-box">
              <div className="box-header">
                <div className="box-title">
                  <h2>Audit Logs Keamanan Sistem</h2>
                  <p>Catatan rekam jejak aktivitas pengubahan data oleh administrator</p>
                </div>
              </div>

              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Waktu Audit</th>
                      <th>Aktor Admin</th>
                      <th>Tindakan (Action)</th>
                      <th>Entitas Terpengaruh</th>
                      <th>Alamat IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {AUDIT_LOGS.map((log) => (
                      <tr key={log.id}>
                        <td>
                          <code>{log.timestamp}</code>
                        </td>
                        <td>
                          <strong>{log.actor}</strong>
                        </td>
                        <td>
                          <span className="badge-cat">{log.action}</span>
                        </td>
                        <td>{log.entity}</td>
                        <td>
                          <code>{log.ip}</code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Add Tenant Modal */}
      {showAddTenantModal && (
        <div className="modal-overlay" onClick={() => setShowAddTenantModal(false)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Tambah Tenant Komersil Baru</h3>
              <button type="button" onClick={() => setShowAddTenantModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddTenant} className="admin-form">
              <label>
                <span>Nama Tenant / Toko</span>
                <input
                  type="text"
                  required
                  placeholder="Misal: Kopi Kenangan"
                  value={newTenant.name}
                  onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                />
              </label>
              <label>
                <span>Kategori</span>
                <select
                  value={newTenant.category}
                  onChange={(e) => setNewTenant({ ...newTenant, category: e.target.value })}
                >
                  <option value="Kuliner & F&B">Kuliner & F&B</option>
                  <option value="Toko & Fashion">Toko & Fashion</option>
                  <option value="Kantor & Layanan">Kantor & Layanan</option>
                  <option value="Mushola">Mushola</option>
                </select>
              </label>
              <div className="form-row">
                <label>
                  <span>Terminal</span>
                  <select
                    value={newTenant.terminal}
                    onChange={(e) => setNewTenant({ ...newTenant, terminal: e.target.value })}
                  >
                    <option value="T1">Terminal 1</option>
                    <option value="T2">Terminal 2</option>
                  </select>
                </label>
                <label>
                  <span>Lantai</span>
                  <select
                    value={newTenant.floor}
                    onChange={(e) => setNewTenant({ ...newTenant, floor: e.target.value })}
                  >
                    <option value="Lantai 1">Lantai 1</option>
                    <option value="Lantai 2">Lantai 2</option>
                  </select>
                </label>
              </div>
              <label>
                <span>Space Code (Polygon ID)</span>
                <input
                  type="text"
                  required
                  placeholder="Misal: T1-L1-012"
                  value={newTenant.spaceCode}
                  onChange={(e) => setNewTenant({ ...newTenant, spaceCode: e.target.value })}
                />
              </label>
              <label>
                <span>Jam Operasional</span>
                <input
                  type="text"
                  value={newTenant.hours}
                  onChange={(e) => setNewTenant({ ...newTenant, hours: e.target.value })}
                />
              </label>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddTenantModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn-primary">
                  Simpan Tenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Admin User Modal */}
      {showAddUserModal && (
        <div className="modal-overlay" onClick={() => setShowAddUserModal(false)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Tambah Administrator Baru</h3>
              <button type="button" onClick={() => setShowAddUserModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="admin-form">
              <label>
                <span>Nama Lengkap Staff</span>
                <input
                  type="text"
                  required
                  placeholder="Misal: Ahmad Fauzi"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                />
              </label>
              <label>
                <span>Email Resmi</span>
                <input
                  type="email"
                  required
                  placeholder="ahmad@juanda-airport.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
              </label>
              <label>
                <span>Role Hak Akses</span>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as AdminRole })}
                >
                  <option value="AIRPORT_ADMIN">Admin Komersil (Airport Admin)</option>
                  <option value="SUPER_ADMIN">Superadmin (System Executive)</option>
                </select>
              </label>
              <label>
                <span>Password (Akan di-hash Bcrypt)</span>
                <input
                  type="password"
                  required
                  placeholder="Minimal 8 karakter"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                />
              </label>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddUserModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn-primary">
                  Buat Akun Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
