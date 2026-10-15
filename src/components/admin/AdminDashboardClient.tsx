"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CirclePause,
  CirclePlay,
  FileSpreadsheet,
  FileClock,
  FileText,
  LogOut,
  Map,
  MapPinned,
  Pencil,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Store,
  Tags,
  Trash2,
  Users,
  X,
} from "lucide-react";
import type { AdminRole } from "@/types";
// @ts-ignore
type SheetData = any;
import { AdminMapPanel } from "@/components/admin/AdminMapPanel";
import { DashboardAnalytics } from "@/components/admin/DashboardAnalytics";
import { MapStage } from "@/components/wayfinding/MapStage";
import { routeEdges, routeNodes, spaces } from "@/data/demo-wayfinding";
import { fetchMapObjectConfigsFromDb, readMapObjectConfigs, type MapObjectConfig, type MapObjectConfigByName } from "@/lib/map3d/admin-object-config";
import type { TerminalCode } from "@/types";

type TenantRow = {
  id: string; name: string; category: string; terminal: TerminalCode; floor: string; floorCode?: string; spaceCode: string; status: string; hours: string;
};

type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  status: string;
  lastLogin: string;
};

type GraphEdgeRow = { id: string; label: string; from: string; to: string; floorId: string };
type GraphMetrics = { nodes: number; edges: number; connectors: number; accessiblePercent: number };

function mapObjectCategory(config: MapObjectConfig) {
  const value = `${config.objectName} ${config.displayName}`;
  if (/(?:^|[-_ ])(?:TL|TOILET)(?:$|[-_ ])/i.test(value)) return "Toilet";
  if (/(?:^|[-_ ])ATM(?:$|[-_ ])/i.test(value)) return "ATM";
  if (/(?:^|[-_ ])MUS(?:$|[-_ ])|MUSH?OL/i.test(value)) return "Mushola";
  if (/(?:AVSEC|BAGGAGE|GATE|DOOR|INFORMASI|LAYANAN)/i.test(value)) return "Fasilitas & Layanan";
  return config.entityType === "TENANT" ? "Komersial" : "Fasilitas Umum";
}

function mapConfigsToDirectory(configs: MapObjectConfigByName): TenantRow[] {
  return Object.values(configs)
    .filter((config) => config.displayName.trim() || /(?:ATM|TOILET|T1-(?:GF|FF)-)/i.test(config.objectName))
    .map((config) => {
      const floorCode = /-FF-/i.test(config.objectName) ? "FF" : "GF";
      const terminal = /^T2-/i.test(config.objectName) ? "T2" : "T1";
      return {
        id: config.objectName,
        name: config.displayName.trim() || config.objectName,
        category: mapObjectCategory(config),
        terminal,
        floor: floorCode === "FF" ? "Lantai 2" : "Lantai 1",
        floorCode,
        spaceCode: config.objectName,
        status: config.occupancy === "WALKABLE" ? "TEMPORARILY_CLOSED" : "ACTIVE",
        hours: config.openTime || config.closeTime ? `${config.openTime || "--:--"} - ${config.closeTime || "--:--"}` : "Belum diatur",
      } satisfies TenantRow;
    })
    .sort((a, b) => a.spaceCode.localeCompare(b.spaceCode, "id-ID", { numeric: true }));
}

const INITIAL_USERS: AdminUserRow[] = [
  { id: "fallback-super-admin", name: "Super Administrator Juanda", email: "superadmin@juanda-airport.local", role: "SUPER_ADMIN" as AdminRole, status: "ACTIVE", lastLogin: "Data akun aktif" },
  { id: "fallback-commercial-admin", name: "Admin Komersil Juanda", email: "admin.komersil@juanda-airport.local", role: "AIRPORT_ADMIN" as AdminRole, status: "ACTIVE", lastLogin: "Data akun aktif" },
];

const AUDIT_LOGS = [
  { id: "log-101", timestamp: "2026-08-26 00:45:12", actor: "Super Administrator", action: "UPDATE_SPACE_STATUS", entity: "Space T1-L2-005", ip: "192.168.1.10" },
  { id: "log-102", timestamp: "2026-08-25 18:22:04", actor: "Budi Santoso", action: "UPDATE_TENANT_HOURS", entity: "Tenant Kopi Juanda", ip: "192.168.1.24" },
  { id: "log-103", timestamp: "2026-08-25 11:05:30", actor: "Super Administrator", action: "CREATE_ADMIN_USER", entity: "User siti.t1@juanda-airport.com", ip: "192.168.1.10" },
  { id: "log-104", timestamp: "2026-08-24 09:14:55", actor: "Siti Rahma", action: "TOGGLE_FACILITY_STATUS", entity: "Facility Mushola T1-L1", ip: "192.168.1.33" },
];

export function AdminDashboardClient({
  user,
}: {
  user: { name: string | null; email: string | null; role: AdminRole };
}) {
  const activeRole = user.role;
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [mapObjectToEdit, setMapObjectToEdit] = useState<string | null>(null);
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [users, setUsers] = useState(INITIAL_USERS);
  const [editingUser, setEditingUser] = useState<AdminUserRow | null>(null);
  const [editingPassword, setEditingPassword] = useState("");
  const [deletingUser, setDeletingUser] = useState<AdminUserRow | null>(null);
  const [userActionError, setUserActionError] = useState<string | null>(null);
  const [savingUser, setSavingUser] = useState(false);
  const [graphMetrics, setGraphMetrics] = useState<GraphMetrics>({ nodes: routeNodes.length, edges: routeEdges.length, connectors: 0, accessiblePercent: 0 });
  const [graphEdges, setGraphEdges] = useState<GraphEdgeRow[]>([]);
  const [graphClosures, setGraphClosures] = useState<GraphEdgeRow[]>([]);
  const [selectedGraphEdge, setSelectedGraphEdge] = useState("");
  const [graphLoading, setGraphLoading] = useState(false);
  const [graphError, setGraphError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddTenantModal, setShowAddTenantModal] = useState(false);
  const [showTenantPlacement, setShowTenantPlacement] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<"excel" | "pdf" | null>(null);
  const [reportFilters, setReportFilters] = useState({ terminal: "ALL", category: "ALL", status: "ALL" });
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    entity: "tenant" | "user";
    id: string;
    name: string;
    currentStatus: string;
  } | null>(null);

  // New Tenant Form state
  const [newTenant, setNewTenant] = useState({
    name: "",
    category: "Kuliner & F&B",
    terminal: "T1",
    floor: "Lantai 1",
    spaceCode: "",
    hours: "07:00 - 21:00",
  });

  useEffect(() => {
    const applyConfigs = (configs: MapObjectConfigByName) => setTenants(mapConfigsToDirectory(configs));
    const cachedConfigs = readMapObjectConfigs();
    fetchMapObjectConfigsFromDb().then((databaseConfigs) => applyConfigs({ ...cachedConfigs, ...databaseConfigs })).catch(() => applyConfigs(cachedConfigs));
    const handleConfigChange = (event: Event) => applyConfigs((event as CustomEvent<MapObjectConfigByName>).detail ?? readMapObjectConfigs());
    window.addEventListener("todjuanda-map-config-change", handleConfigChange);
    return () => window.removeEventListener("todjuanda-map-config-change", handleConfigChange);
  }, []);

  useEffect(() => {
    if (activeRole !== "SUPER_ADMIN") return;
    fetch("/api/admin/users", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("users unavailable");
        const payload = await response.json() as { users?: typeof INITIAL_USERS };
        if (Array.isArray(payload.users)) setUsers(payload.users);
      })
      .catch(() => undefined);
  }, [activeRole]);

  useEffect(() => {
    if (activeRole !== "SUPER_ADMIN" || activeTab !== "graph") return;
    setGraphLoading(true);
    fetch("/api/admin/route-graph", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Data graph belum tersedia dari server");
        return await response.json() as { metrics: GraphMetrics; availableEdges: GraphEdgeRow[]; closures: GraphEdgeRow[] };
      })
      .then((payload) => { setGraphMetrics(payload.metrics); setGraphEdges(payload.availableEdges ?? []); setGraphClosures(payload.closures ?? []); setSelectedGraphEdge(payload.availableEdges?.[0]?.id ?? ""); setGraphError(null); })
      .catch((error) => setGraphError(error instanceof Error ? error.message : "Gagal memuat graph"))
      .finally(() => setGraphLoading(false));
  }, [activeRole, activeTab]);

  const occupiedSpaceCodes = useMemo(() => new Set(tenants.map((tenant) => tenant.spaceCode).filter(Boolean)), [tenants]);
  const placementFloorId = `${newTenant.terminal}-${newTenant.floor.endsWith("2") ? "L2" : "L1"}`;
  const availableTenantBlocks = useMemo(
    () => spaces.filter((space) => space.terminal === newTenant.terminal && space.floorId === placementFloorId && space.type === "TENANT" && !occupiedSpaceCodes.has(space.code)),
    [newTenant.terminal, occupiedSpaceCodes, placementFloorId],
  );

  const handleAddTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenant.name || !newTenant.spaceCode) return;
    const requestBody = { ...newTenant, status: "ACTIVE" };
    let created: TenantRow;
    try {
      const response = await fetch("/api/tenants", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(requestBody) });
      if (!response.ok) throw new Error("Gagal menyimpan tenant");
      const payload = await response.json() as { tenant: TenantRow };
      created = payload.tenant;
    } catch {
      // Tetap membuat pengalaman editor bisa dipakai saat database lokal belum aktif.
      created = { id: `local-${Date.now()}`, name: newTenant.name, category: newTenant.category, terminal: newTenant.terminal as TerminalCode, floor: newTenant.floor, spaceCode: newTenant.spaceCode, status: "ACTIVE", hours: newTenant.hours };
    }
    setTenants((current) => [created, ...current]);
    setNewTenant({ name: "", category: "Kuliner & F&B", terminal: "T1", floor: "Lantai 1", spaceCode: "", hours: "07:00 - 21:00" });
    setShowAddTenantModal(false);
    setShowTenantPlacement(false);
  };

  const confirmStatusChange = async () => {
    if (!pendingStatusChange) return;
    if (pendingStatusChange.entity === "tenant") {
      setTenants(
        tenants.map((tenant) =>
          tenant.id === pendingStatusChange.id
            ? { ...tenant, status: tenant.status === "ACTIVE" ? "TEMPORARILY_CLOSED" : "ACTIVE" }
            : tenant
        )
      );
    } else {
      const nextActive = pendingStatusChange.currentStatus !== "ACTIVE";
      try {
        const response = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: pendingStatusChange.id, active: nextActive }) });
        if (!response.ok) throw new Error("user update failed");
        const payload = await response.json() as { user?: (typeof INITIAL_USERS)[number] };
        if (payload.user) setUsers((current) => current.map((account) => account.id === payload.user?.id ? payload.user : account));
      } catch {
        // Jangan mengubah UI jika status database gagal disimpan.
      }
    }
    setPendingStatusChange(null);
  };

  const saveEditedUser = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingUser || savingUser) return;
    setSavingUser(true);
    setUserActionError(null);
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingUser.id, name: editingUser.name, email: editingUser.email, password: editingPassword || undefined }),
      });
      const payload = await response.json() as { user?: AdminUserRow; error?: string };
      if (!response.ok || !payload.user) throw new Error(payload.error ?? "Gagal memperbarui akun");
      setUsers((current) => current.map((account) => account.id === payload.user?.id ? payload.user : account));
      setEditingUser(null);
      setEditingPassword("");
    } catch (error) {
      setUserActionError(error instanceof Error ? error.message : "Gagal memperbarui akun");
    } finally {
      setSavingUser(false);
    }
  };

  const confirmDeleteUser = async () => {
    if (!deletingUser || savingUser) return;
    setSavingUser(true);
    setUserActionError(null);
    try {
      const response = await fetch("/api/admin/users", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: deletingUser.id }) });
      const payload = await response.json() as { deletedId?: string; error?: string };
      if (!response.ok || !payload.deletedId) throw new Error(payload.error ?? "Gagal menghapus akun");
      setUsers((current) => current.filter((account) => account.id !== payload.deletedId));
      setDeletingUser(null);
    } catch (error) {
      setUserActionError(error instanceof Error ? error.message : "Gagal menghapus akun");
    } finally {
      setSavingUser(false);
    }
  };

  const toggleGraphEdge = async (edgeId: string, active: boolean) => {
    setGraphError(null);
    try {
      const response = await fetch("/api/admin/route-graph", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ edgeId, active }) });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Gagal memperbarui jalur");
      setGraphEdges((current) => active ? current : current.filter((edge) => edge.id !== edgeId));
      if (active) {
        const moved = graphClosures.find((edge) => edge.id === edgeId);
        if (moved) {
          setGraphEdges((current) => [moved, ...current.filter((edge) => edge.id !== edgeId)]);
          setGraphClosures((current) => current.filter((edge) => edge.id !== edgeId));
        }
      } else {
        setGraphClosures((current) => current.filter((edge) => edge.id !== edgeId));
      }
      setGraphMetrics((current) => ({ ...current, edges: active ? current.edges + 1 : Math.max(0, current.edges - 1) }));
      setSelectedGraphEdge("");
    } catch (error) {
      setGraphError(error instanceof Error ? error.message : "Gagal memperbarui jalur");
    }
  };

  const tenantCategories = [...new Set(tenants.map((tenant) => tenant.category))].sort();
  const reportTenants = tenants.filter((tenant) => {
    const matchesTerminal = reportFilters.terminal === "ALL" || tenant.terminal === reportFilters.terminal;
    const matchesCategory = reportFilters.category === "ALL" || tenant.category === reportFilters.category;
    const matchesStatus = reportFilters.status === "ALL" || tenant.status === reportFilters.status;
    return matchesTerminal && matchesCategory && matchesStatus;
  });
  const filteredTenants = reportTenants.filter(
    (tenant) =>
      tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.spaceCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exportFilterSummary = [
    `Terminal: ${reportFilters.terminal === "ALL" ? "Semua" : reportFilters.terminal}`,
    `Kategori: ${reportFilters.category === "ALL" ? "Semua" : reportFilters.category}`,
    `Status: ${reportFilters.status === "ALL" ? "Semua" : reportFilters.status === "ACTIVE" ? "Buka" : "Tutup Sementara"}`,
  ].join(" | ");

  const tenantReportRows = reportTenants.map((tenant, index) => ({
    No: index + 1,
    "Nama Bangunan": tenant.name,
    Kategori: tenant.category,
    Terminal: tenant.terminal,
    Lantai: tenant.floor,
    "Space Code": tenant.spaceCode,
    "Jam Operasional": tenant.hours,
    Status: tenant.status === "ACTIVE" ? "Buka" : "Tutup Sementara",
  }));
  const exportTenantExcel = async () => {
    setExportingFormat("excel");
    try {
      // @ts-ignore
      const { default: writeXlsxFile } = await import("write-excel-file/browser");
      const mergedRow = (value: string, style: Record<string, unknown> = {}) => [
        { value, columnSpan: 8, ...style }, null, null, null, null, null, null, null,
      ];
      const tableHeader = (value: string) => ({
        value,
        fontWeight: "bold" as const,
        backgroundColor: "#00A8BD",
        textColor: "#FFFFFF",
        align: "center" as const,
        alignVertical: "center" as const,
        height: 24,
      });
      const sheetData: SheetData = [
        mergedRow("INJOURNEY AIRPORTS — BANDARA INTERNASIONAL JUANDA", {
          fontWeight: "bold",
          fontSize: 16,
          backgroundColor: "#142328",
          textColor: "#FFFFFF",
          height: 30,
          alignVertical: "center",
        }),
        mergedRow("DIREKTORI BANGUNAN PETA TERMINAL", { fontWeight: "bold", fontSize: 12, height: 24 }),
        mergedRow(`Tanggal ekspor: ${new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date())}`),
        mergedRow(`Filter laporan: ${exportFilterSummary}`),
        mergedRow(`Jumlah data: ${tenantReportRows.length} objek peta`),
        [null, null, null, null, null, null, null, null],
        ["No", "Nama Bangunan", "Kategori", "Terminal", "Lantai", "Kode Objek", "Jam Operasional", "Status"].map(tableHeader),
        ...tenantReportRows.map((row, index) => [
          { value: row.No, type: Number, align: "center" as const, backgroundColor: index % 2 ? "#F3F7F8" : undefined },
          { value: row["Nama Bangunan"], backgroundColor: index % 2 ? "#F3F7F8" : undefined },
          { value: row.Kategori, backgroundColor: index % 2 ? "#F3F7F8" : undefined },
          { value: row.Terminal, align: "center" as const, backgroundColor: index % 2 ? "#F3F7F8" : undefined },
          { value: row.Lantai, backgroundColor: index % 2 ? "#F3F7F8" : undefined },
          { value: row["Space Code"], backgroundColor: index % 2 ? "#F3F7F8" : undefined },
          { value: row["Jam Operasional"], backgroundColor: index % 2 ? "#F3F7F8" : undefined },
          { value: row.Status, backgroundColor: index % 2 ? "#F3F7F8" : undefined },
        ]),
      ];
      const excelFile = writeXlsxFile(sheetData, {
        columns: [
          { width: 6 }, { width: 28 }, { width: 22 }, { width: 10 },
          { width: 14 }, { width: 16 }, { width: 22 }, { width: 20 },
        ],
        sheet: "Direktori Peta",
      });
      await excelFile.toFile(`direktori-peta-terminal-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } finally {
      setExportingFormat(null);
    }
  };

  const exportTenantPdf = async () => {
    setExportingFormat("pdf");
    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        // @ts-ignore
        import("jspdf"),
        // @ts-ignore
        import("jspdf-autotable"),
      ]);
      const document = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      document.setFillColor(20, 35, 40);
      document.rect(0, 0, 297, 31, "F");
      document.setTextColor(255, 255, 255);
      document.setFontSize(10);
      document.setFont("helvetica", "bold");
      document.text("INJOURNEY AIRPORTS", 14, 10);
      document.setFontSize(17);
      document.text("Direktori Bangunan Peta Terminal", 14, 20);
      document.setFontSize(9);
      document.setFont("helvetica", "normal");
      document.text("Bandara Internasional Juanda", 14, 26);
      document.setFontSize(9);
      document.setTextColor(94, 111, 117);
      document.text(`Tanggal ekspor: ${new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date())}`, 14, 38);
      document.text(`Filter: ${exportFilterSummary}`, 14, 43);
      document.text(`Jumlah data: ${reportTenants.length} objek`, 240, 38);
      autoTable(document, {
        startY: 48,
        head: [["No", "Nama Bangunan", "Kategori", "Lokasi", "Kode Objek", "Jam Operasional", "Status"]],
        body: reportTenants.map((tenant, index) => [
          index + 1,
          tenant.name,
          tenant.category,
          `${tenant.terminal} - ${tenant.floor}`,
          tenant.spaceCode,
          tenant.hours,
          tenant.status === "ACTIVE" ? "Buka" : "Tutup Sementara",
        ]),
        styles: { fontSize: 8, cellPadding: 2.5 },
        headStyles: { fillColor: [0, 168, 189], textColor: 255 },
        alternateRowStyles: { fillColor: [243, 247, 248] },
        margin: { left: 14, right: 14 },
        didDrawPage: ({ pageNumber }: { pageNumber: number }) => {
          document.setFontSize(8);
          document.setTextColor(94, 111, 117);
          document.text(`Halaman ${pageNumber}`, 283, 200, { align: "right" });
        },
      });
      document.save(`direktori-peta-terminal-${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      setExportingFormat(null);
    }
  };

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

        <div className="admin-header-right">
          <span className="session-role-badge">
            {activeRole === "SUPER_ADMIN" ? <ShieldCheck size={14} /> : <Store size={14} />}
            {activeRole === "SUPER_ADMIN" ? "Superadmin" : "Admin Komersil"}
          </span>
          <button
            type="button"
            className="admin-signout-button"
            onClick={() => signOut({ redirectTo: "/auth/signin" })}
          >
            <LogOut size={15} />
            <span>Keluar</span>
          </button>
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
              <strong>{user.name ?? (activeRole === "SUPER_ADMIN" ? "Super Administrator" : "Admin Komersil")}</strong>
              <small>{user.email ?? "Akun admin Juanda"}</small>
            </div>
          </div>

          <nav className="nav-menu-list">
            <button
              type="button"
              className="nav-item"
              data-active={activeTab === "overview"}
              onClick={() => setActiveTab("overview")}
            >
              <BarChart3 size={18} />
              <span>Ringkasan Dashboard</span>
            </button>
            <button
              type="button"
              className="nav-item"
              data-active={activeTab === "map"}
              onClick={() => setActiveTab("map")}
            >
              <MapPinned size={18} />
              <span>Peta Terminal</span>
            </button>

            <button
              type="button"
              className="nav-item"
              data-active={activeTab === "tenants"}
              onClick={() => setActiveTab("tenants")}
            >
              <Store size={18} />
              <span>Direktori Peta</span>
            </button>

            {activeRole === "AIRPORT_ADMIN" && (
              <>
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
                  : "Kelola Direktori Bangunan & Fasilitas Peta Bandara Juanda"}
              </h1>
              <p>
                {activeRole === "SUPER_ADMIN"
                  ? "Pusat kendali hak akses pengguna, pemantauan graph rute A*, serta audit log log aktivitas sistem."
                  : "Kelola nama, kategori, kode objek, dan jam operasional langsung dari model terminal."}
              </p>
            </div>
          </div>

          {/* Dynamic Content Views */}
          {activeTab === "overview" && <DashboardAnalytics tenants={tenants} />}

          {activeTab === "map" && <AdminMapPanel initialObjectName={mapObjectToEdit} />}

          {/* AIRPORT ADMIN: TENANTS TAB */}
          {activeTab === "tenants" && (
            <div className="content-box">
              <div className="box-header">
                <div className="box-title">
                  <h2>Direktori Bangunan Peta Terminal</h2>
                  <p>Daftar commercial, toilet, ATM, dan fasilitas yang sudah dikonfigurasi pada model terminal</p>
                </div>
                <div className="box-actions">
                  <div className="search-input-wrapper">
                    <Search size={16} />
                    <input
                      type="text"
                      placeholder="Cari nama atau kode objek..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <button type="button" className="btn-primary" onClick={() => setActiveTab("map")}>
                    <MapPinned size={16} /> Kelola di Peta
                  </button>
                </div>
              </div>

              <div className="report-command-bar" aria-label="Filter direktori bangunan peta">
                <div className="report-command-header">
                  <div className="report-command-title">
                    <span><SlidersHorizontal size={18} /></span>
                    <div>
                      <small>DIREKTORI OBJEK PETA</small>
                      <strong>Atur data sebelum diekspor</strong>
                    </div>
                  </div>
                  <div className="report-command-actions">
                    <div className="report-command-count" aria-live="polite">
                      <strong>{reportTenants.length}</strong>
                      <span>objek siap diekspor</span>
                    </div>
                    <div className="export-action-group" aria-label="Ekspor direktori objek peta">
                      <button
                        type="button"
                        className="btn-export excel"
                        onClick={exportTenantExcel}
                        disabled={exportingFormat !== null || !reportTenants.length}
                      >
                        <FileSpreadsheet size={16} />
                        {exportingFormat === "excel" ? "Menyiapkan..." : "Excel"}
                      </button>
                      <button
                        type="button"
                        className="btn-export pdf"
                        onClick={exportTenantPdf}
                        disabled={exportingFormat !== null || !reportTenants.length}
                      >
                        <FileText size={16} />
                        {exportingFormat === "pdf" ? "Menyiapkan..." : "PDF"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="report-command-controls">
                  <div className="report-filter-control">
                    <span className="report-control-label"><Building2 size={13} /> Terminal</span>
                    <div className="report-segmented" aria-label="Filter terminal">
                      {[
                        { value: "ALL", label: "Semua" },
                        { value: "T1", label: "T1" },
                        { value: "T2", label: "T2" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          data-active={reportFilters.terminal === option.value}
                          aria-pressed={reportFilters.terminal === option.value}
                          onClick={() => setReportFilters({ ...reportFilters, terminal: option.value })}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="report-filter-control">
                    <span className="report-control-label"><CirclePlay size={13} /> Status</span>
                    <div className="report-segmented status" aria-label="Filter status">
                      {[
                        { value: "ALL", label: "Semua" },
                        { value: "ACTIVE", label: "Buka" },
                        { value: "TEMPORARILY_CLOSED", label: "Tutup" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          data-active={reportFilters.status === option.value}
                          aria-pressed={reportFilters.status === option.value}
                          onClick={() => setReportFilters({ ...reportFilters, status: option.value })}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="report-filter-control report-category-control">
                    <span className="report-control-label"><Tags size={13} /> Kategori</span>
                    <select
                      value={reportFilters.category}
                      onChange={(event) => setReportFilters({ ...reportFilters, category: event.target.value })}
                    >
                      <option value="ALL">Semua kategori</option>
                      {tenantCategories.map((category) => <option key={category} value={category}>{category}</option>)}
                    </select>
                  </label>

                  <button
                    type="button"
                    className="report-reset-button"
                    onClick={() => setReportFilters({ terminal: "ALL", category: "ALL", status: "ALL" })}
                    disabled={reportFilters.terminal === "ALL" && reportFilters.category === "ALL" && reportFilters.status === "ALL"}
                  >
                    <RotateCcw size={14} /> Reset
                  </button>
                </div>

                <div className="report-filter-summary">
                  <span>Filter aktif</span>
                  {reportFilters.terminal === "ALL" && reportFilters.category === "ALL" && reportFilters.status === "ALL" ? (
                    <strong>Semua bangunan dan fasilitas peta ditampilkan</strong>
                  ) : (
                    <div>
                      {reportFilters.terminal !== "ALL" && <i>Terminal {reportFilters.terminal.slice(1)}</i>}
                      {reportFilters.category !== "ALL" && <i>{reportFilters.category}</i>}
                      {reportFilters.status !== "ALL" && <i>{reportFilters.status === "ACTIVE" ? "Status Buka" : "Tutup Sementara"}</i>}
                    </div>
                  )}
                </div>
              </div>

              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nama Bangunan / Lokasi</th>
                      <th>Kategori</th>
                      <th>Lokasi</th>
                      <th>Kode Objek Peta</th>
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
                            className={`status-action-button ${t.status === "ACTIVE" ? "deactivate" : "activate"}`}
                            onClick={() => { setMapObjectToEdit(t.spaceCode); setActiveTab("map"); }}
                            aria-label={`Edit ${t.name} pada peta terminal`}
                          >
                            <MapPinned size={15} />
                            <span>Edit di peta</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!filteredTenants.length && (
                      <tr>
                        <td colSpan={7} className="table-empty-result">
                          Belum ada objek peta yang sesuai. Beri nama objek melalui Editor Lokasi 3D terlebih dahulu.
                        </td>
                      </tr>
                    )}
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
                  <p>Terintegrasi dengan akun autentikasi aktif: Super Admin dan Admin Komersial</p>
                </div>
                <div className="report-command-count" aria-label="Jumlah akun administrator">
                  <strong>{users.length}</strong>
                  <span>akun terintegrasi</span>
                </div>
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
                            {u.role === "SUPER_ADMIN" ? "SUPER ADMIN" : "ADMIN KOMERSIAL"}
                          </span>
                        </td>
                        <td>{u.lastLogin}</td>
                        <td>
                          <span className={`status-pill ${u.status === "ACTIVE" ? "active" : "closed"}`}>
                            {u.status === "ACTIVE" ? "AKTIF" : "NONAKTIF"}
                          </span>
                        </td>
                        <td>
                          <div className="admin-user-actions">
                            <button
                              type="button"
                              className={`status-action-button ${u.status === "ACTIVE" ? "deactivate" : "activate"}`}
                              onClick={() => setPendingStatusChange({ entity: "user", id: u.id, name: u.name, currentStatus: u.status })}
                              disabled={u.email === user.email || u.role === "SUPER_ADMIN"}
                              aria-label={`${u.status === "ACTIVE" ? "Nonaktifkan" : "Aktifkan"} akun ${u.name}`}
                            >
                              {u.email === user.email || u.role === "SUPER_ADMIN" ? <ShieldCheck size={15} /> : u.status === "ACTIVE" ? <CirclePause size={15} /> : <CirclePlay size={15} />}
                              <span>{u.email === user.email ? "Akun saat ini" : u.role === "SUPER_ADMIN" ? "Dilindungi" : u.status === "ACTIVE" ? "Nonaktifkan" : "Aktifkan"}</span>
                            </button>
                            {u.role === "AIRPORT_ADMIN" && <>
                              <button type="button" className="admin-user-action edit" onClick={() => { setUserActionError(null); setEditingPassword(""); setEditingUser({ ...u }); }} aria-label={`Edit akun ${u.name}`}><Pencil size={15} /> Edit</button>
                              <button type="button" className="admin-user-action delete" onClick={() => { setUserActionError(null); setDeletingUser(u); }} aria-label={`Hapus akun ${u.name}`}><Trash2 size={15} /> Hapus</button>
                            </>}
                          </div>
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
                    <li>Total Navigation Nodes: <strong>{graphLoading ? "Memuat..." : `${graphMetrics.nodes} Nodes`}</strong></li>
                    <li>Total Pedestrian Edges: <strong>{graphLoading ? "Memuat..." : `${graphMetrics.edges} Edges aktif`}</strong></li>
                    <li>Koneksi Vertikal (Lift/Tangga): <strong>{graphMetrics.connectors} Connector Nodes</strong></li>
                    <li>Jalur Ramah Kursi Roda: <strong>{graphMetrics.accessiblePercent}% Accessible</strong></li>
                  </ul>
                </div>

                <div className="graph-card">
                  <h3>Penutupan Jalur Darurat (Emergency Closure)</h3>
                  <p>Gunakan untuk memblokir jalur lorong saat renovasi tanpa menggambar ulang peta visual:</p>
                  {graphEdges.length ? <div className="graph-closure-control">
                    <select value={selectedGraphEdge} onChange={(event) => setSelectedGraphEdge(event.target.value)} aria-label="Pilih edge untuk ditutup">
                      <option value="">Pilih edge aktif...</option>
                      {graphEdges.map((edge) => <option key={edge.id} value={edge.id}>{edge.label} · {edge.floorId}</option>)}
                    </select>
                    <button type="button" className="btn-secondary" disabled={!selectedGraphEdge} onClick={() => toggleGraphEdge(selectedGraphEdge, false)}><AlertTriangle size={15} /> Tutup jalur terpilih</button>
                  </div> : <p className="graph-empty-state">Belum ada edge aktif yang dapat ditutup pada database graph.</p>}
                  {graphClosures.length > 0 && <div className="graph-closure-list"><strong>Jalur sedang ditutup</strong>{graphClosures.map((edge) => <div key={edge.id}><span>{edge.label}</span><button type="button" onClick={() => toggleGraphEdge(edge.id, true)}>Buka kembali</button></div>)}</div>}
                  {graphError && <p className="graph-error" role="alert">{graphError}</p>}
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

      {/* Enterprise status confirmation */}
      {pendingStatusChange && (
        <div className="modal-overlay" onClick={() => setPendingStatusChange(null)}>
          <div className="admin-modal-card status-confirmation-card" onClick={(event) => event.stopPropagation()}>
            <div className={`status-confirmation-icon ${pendingStatusChange.currentStatus === "ACTIVE" ? "deactivate" : "activate"}`}>
              {pendingStatusChange.currentStatus === "ACTIVE" ? <CirclePause size={24} /> : <CirclePlay size={24} />}
            </div>
            <div className="status-confirmation-copy">
              <span>KONFIRMASI PERUBAHAN STATUS</span>
              <h3>
                {pendingStatusChange.currentStatus === "ACTIVE"
                  ? pendingStatusChange.entity === "tenant" ? "Tutup tenant sementara?" : "Nonaktifkan akun?"
                  : pendingStatusChange.entity === "tenant" ? "Aktifkan tenant kembali?" : "Aktifkan akun kembali?"}
              </h3>
              <p>
                Status <strong>{pendingStatusChange.name}</strong> akan diperbarui. Pastikan perubahan ini sudah sesuai dengan kondisi operasional.
              </p>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setPendingStatusChange(null)}>Batal</button>
              <button
                type="button"
                className={`status-confirm-button ${pendingStatusChange.currentStatus === "ACTIVE" ? "deactivate" : "activate"}`}
                onClick={confirmStatusChange}
              >
                {pendingStatusChange.currentStatus === "ACTIVE"
                  ? pendingStatusChange.entity === "tenant" ? "Ya, tutup sementara" : "Ya, nonaktifkan"
                  : "Ya, aktifkan kembali"}
              </button>
            </div>
          </div>
        </div>
      )}

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
                <span>Blok peta tenant</span>
                <input
                  type="text"
                  readOnly
                  placeholder="Pilih blok kosong di peta"
                  value={newTenant.spaceCode}
                />
                <small>{newTenant.spaceCode ? `Blok terpilih: ${newTenant.spaceCode}` : "Blok harus dipilih dari peta agar tidak bertabrakan dengan tenant lain."}</small>
              </label>
              <button
                type="button"
                className="btn-secondary tenant-map-picker-button"
                onClick={() => { setShowAddTenantModal(false); setShowTenantPlacement(true); }}
                disabled={!availableTenantBlocks.length}
              >
                Pilih blok di peta ({availableTenantBlocks.length} tersedia)
              </button>
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
                <button type="submit" className="btn-primary" disabled={!newTenant.spaceCode}>
                  Simpan Tenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTenantPlacement && (
        <div className="modal-overlay" onClick={() => setShowTenantPlacement(false)}>
          <div className="admin-modal-card admin-tenant-placement-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Pilih blok kosong di peta</h3>
                <p>{newTenant.terminal} · {newTenant.floor} · hanya blok tenant yang belum terisi</p>
              </div>
              <button type="button" onClick={() => setShowTenantPlacement(false)}><X size={18} /></button>
            </div>
            {availableTenantBlocks.length ? (
              <div className="admin-tenant-placement-map">
                <MapStage
                  terminal={newTenant.terminal as TerminalCode}
                  floorId={placementFloorId}
                  spaces={availableTenantBlocks}
                  selectedId={availableTenantBlocks.find((space) => space.code === newTenant.spaceCode)?.id ?? null}
                  route={null}
                  fromId={null}
                  toId={null}
                  currentId={null}
                  onSelect={(space) => {
                    setNewTenant((current) => ({ ...current, spaceCode: space.code }));
                    setShowTenantPlacement(false);
                    setShowAddTenantModal(true);
                  }}
                  overview
                />
              </div>
            ) : <p className="admin-empty-state">Tidak ada blok tenant kosong untuk terminal dan lantai ini.</p>}
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowTenantPlacement(false)}>Batal</button>
            </div>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="modal-overlay" onClick={() => { if (!savingUser) setEditingUser(null); }}>
          <div className="admin-modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div><h3>Edit Admin Komersial</h3><p>Perubahan langsung digunakan untuk login berikutnya.</p></div>
              <button type="button" onClick={() => setEditingUser(null)} disabled={savingUser}><X size={18} /></button>
            </div>
            <form className="admin-form" onSubmit={saveEditedUser}>
              <label><span>Nama administrator</span><input required minLength={2} value={editingUser.name} onChange={(event) => setEditingUser({ ...editingUser, name: event.target.value })} /></label>
              <label><span>Email login</span><input required type="email" value={editingUser.email} onChange={(event) => setEditingUser({ ...editingUser, email: event.target.value })} /></label>
              <label><span>Hak akses</span><input value="Admin Komersial" readOnly /></label>
              <label><span>Password baru (opsional)</span><input type="password" minLength={8} value={editingPassword} onChange={(event) => setEditingPassword(event.target.value)} placeholder="Kosongkan jika tidak diubah" /></label>
              {userActionError && <p className="admin-user-action-error" role="alert">{userActionError}</p>}
              <div className="form-actions"><button type="button" className="btn-secondary" onClick={() => setEditingUser(null)} disabled={savingUser}>Batal</button><button type="submit" className="btn-primary" disabled={savingUser}>{savingUser ? "Menyimpan..." : "Simpan Perubahan"}</button></div>
            </form>
          </div>
        </div>
      )}

      {deletingUser && (
        <div className="modal-overlay" onClick={() => { if (!savingUser) setDeletingUser(null); }}>
          <div className="admin-modal-card status-confirmation-card" onClick={(event) => event.stopPropagation()}>
            <div className="status-confirmation-icon deactivate"><Trash2 size={24} /></div>
            <div className="status-confirmation-copy"><span>KONFIRMASI HAPUS AKUN</span><h3>Hapus Admin Komersial?</h3><p>Akun <strong>{deletingUser.name}</strong> ({deletingUser.email}) akan dihapus permanen dan tidak dapat digunakan untuk login.</p></div>
            {userActionError && <p className="admin-user-action-error" role="alert">{userActionError}</p>}
            <div className="form-actions"><button type="button" className="btn-secondary" onClick={() => setDeletingUser(null)} disabled={savingUser}>Batal</button><button type="button" className="status-confirm-button deactivate" onClick={confirmDeleteUser} disabled={savingUser}>{savingUser ? "Menghapus..." : "Ya, hapus akun"}</button></div>
          </div>
        </div>
      )}

    </main>
  );
}
