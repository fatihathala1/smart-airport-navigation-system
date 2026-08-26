"use client";

import { Building2, CheckCircle2, PieChart, Store } from "lucide-react";

type TenantAnalyticsRow = {
  category: string;
  terminal: string;
  status: string;
};

export function DashboardAnalytics({ tenants }: { tenants: TenantAnalyticsRow[] }) {
  const activeCount = tenants.filter((tenant) => tenant.status === "ACTIVE").length;
  const inactiveCount = tenants.length - activeCount;
  const activePercent = tenants.length ? Math.round((activeCount / tenants.length) * 100) : 0;

  const categoryRows = Object.entries(
    tenants.reduce<Record<string, number>>((result, tenant) => {
      result[tenant.category] = (result[tenant.category] ?? 0) + 1;
      return result;
    }, {})
  ).sort((a, b) => b[1] - a[1]);
  const maxCategory = Math.max(1, ...categoryRows.map(([, count]) => count));

  const terminalRows = ["T1", "T2"].map((terminal) => {
    const terminalTenants = tenants.filter((tenant) => tenant.terminal === terminal);
    return {
      terminal,
      total: terminalTenants.length,
      active: terminalTenants.filter((tenant) => tenant.status === "ACTIVE").length,
    };
  });

  return (
    <section className="analytics-section" aria-labelledby="analytics-title">
      <div className="analytics-heading">
        <div>
          <span>ANALISIS OPERASIONAL</span>
          <h2 id="analytics-title">Ringkasan Tenant Juanda</h2>
          <p>Diagram diperbarui otomatis mengikuti data tenant pada dashboard.</p>
        </div>
        <span className="analytics-period">Data terkini</span>
      </div>

      <div className="analytics-grid">
        <article className="analytics-card status-chart-card">
          <div className="analytics-card-title">
            <span><CheckCircle2 size={17} /></span>
            <div><strong>Status Operasional</strong><small>Tenant aktif saat ini</small></div>
          </div>
          <div className="donut-chart-wrap">
            <div
              className="donut-chart"
              style={{ "--chart-value": `${activePercent * 3.6}deg` } as React.CSSProperties}
              role="img"
              aria-label={`${activePercent} persen tenant aktif`}
            >
              <div><strong>{activePercent}%</strong><span>Aktif</span></div>
            </div>
            <div className="chart-legend-list">
              <span><i className="chart-dot active" /><b>{activeCount}</b> Beroperasi</span>
              <span><i className="chart-dot inactive" /><b>{inactiveCount}</b> Tutup sementara</span>
            </div>
          </div>
        </article>

        <article className="analytics-card">
          <div className="analytics-card-title">
            <span><PieChart size={17} /></span>
            <div><strong>Komposisi Kategori</strong><small>Sebaran jenis tenant</small></div>
          </div>
          <div className="horizontal-chart">
            {categoryRows.map(([category, count]) => (
              <div className="bar-chart-row" key={category}>
                <div><span>{category}</span><strong>{count}</strong></div>
                <div className="bar-track"><i style={{ width: `${(count / maxCategory) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </article>

        <article className="analytics-card terminal-chart-card">
          <div className="analytics-card-title">
            <span><Building2 size={17} /></span>
            <div><strong>Sebaran Terminal</strong><small>Tenant Terminal 1 dan 2</small></div>
          </div>
          <div className="terminal-column-chart">
            {terminalRows.map((row) => {
              const height = tenants.length ? Math.max(18, (row.total / tenants.length) * 100) : 0;
              return (
                <div className="terminal-column" key={row.terminal}>
                  <div className="terminal-column-value"><strong>{row.total}</strong><small>{row.active} aktif</small></div>
                  <div className="terminal-column-track"><i style={{ height: `${height}%` }} /></div>
                  <span>{row.terminal === "T1" ? "Terminal 1" : "Terminal 2"}</span>
                </div>
              );
            })}
          </div>
        </article>

        <article className="analytics-card insight-card">
          <div className="analytics-card-title">
            <span><Store size={17} /></span>
            <div><strong>Insight Cepat</strong><small>Prioritas operasional</small></div>
          </div>
          <div className="insight-content">
            <strong>{inactiveCount ? `${inactiveCount} tenant perlu ditinjau` : "Seluruh tenant beroperasi"}</strong>
            <p>{inactiveCount ? "Periksa status dan jam layanan tenant yang tutup sementara agar informasi pengunjung tetap akurat." : "Status operasional tenant saat ini sudah optimal."}</p>
            <div className="insight-progress"><i style={{ width: `${activePercent}%` }} /></div>
            <small>{activeCount} dari {tenants.length} tenant berstatus aktif</small>
          </div>
        </article>
      </div>
    </section>
  );
}
