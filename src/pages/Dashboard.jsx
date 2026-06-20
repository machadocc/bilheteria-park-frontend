import { dashboardApi } from "../api/endpoints";
import { useApi } from "../api/useApi";
import { Loading, ErrorBanner, Empty, StatusBadge, fmt, pick } from "../components/ui";
import { Icon } from "../components/Icon";

export default function Dashboard() {
  const summary = useApi(() => dashboardApi.summary());
  const top = useApi(() => dashboardApi.topEvents());
  const alerts = useApi(() => dashboardApi.alerts());
  const lastSales = useApi(() => dashboardApi.lastSales());

  return (
    <div className="page">
      <ErrorBanner message={summary.error} onRetry={summary.refetch} />

      {/* Resumo */}
      {summary.loading ? (
        <div className="grid grid-4">
          {[0, 1, 2, 3].map((i) => (
            <div className="stat" key={i}>
              <div className="skeleton" style={{ height: 14, width: "60%" }} />
              <div className="skeleton" style={{ height: 34, width: "40%", marginTop: 12 }} />
            </div>
          ))}
        </div>
      ) : (
        <SummaryTiles data={summary.data} />
      )}

      <div className="grid grid-2 mt" style={{ alignItems: "start" }}>
        {/* Top eventos */}
        <div className="card">
          <div className="card-head">
            <h3><Icon name="trophy" size={16} /> &nbsp;Eventos com mais vendas</h3>
            <button className="btn btn-ghost btn-sm" onClick={top.refetch}><Icon name="refresh" size={14} /></button>
          </div>
          {top.loading ? <Loading /> : top.error ? <ErrorBanner message={top.error} onRetry={top.refetch} /> : (
            <TopEvents rows={asArray(top.data)} />
          )}
        </div>

        {/* Alertas */}
        <div className="card">
          <div className="card-head">
            <h3><Icon name="alert" size={16} /> &nbsp;Alertas</h3>
            <button className="btn btn-ghost btn-sm" onClick={alerts.refetch}><Icon name="refresh" size={14} /></button>
          </div>
          <div className="card-pad">
            {alerts.loading ? <Loading /> : alerts.error ? <ErrorBanner message={alerts.error} onRetry={alerts.refetch} /> : (
              <AlertsList items={asArray(alerts.data)} />
            )}
          </div>
        </div>
      </div>

      {/* Últimas vendas */}
      <div className="card mt">
        <div className="card-head">
          <h3><Icon name="cart" size={16} /> &nbsp;Últimas vendas</h3>
          <button className="btn btn-ghost btn-sm" onClick={lastSales.refetch}><Icon name="refresh" size={14} /></button>
        </div>
        {lastSales.loading ? <Loading /> : lastSales.error ? <ErrorBanner message={lastSales.error} onRetry={lastSales.refetch} /> : (
          <LastSales rows={asArray(lastSales.data)} />
        )}
      </div>
    </div>
  );
}

function asArray(d) {
  if (Array.isArray(d)) return d;
  if (d && Array.isArray(d.items)) return d.items;
  if (d && Array.isArray(d.results)) return d.results;
  if (d && Array.isArray(d.data)) return d.data;
  return [];
}

function SummaryTiles({ data }) {
  const d = data || {};
  const tiles = [
    {
      label: "Receita total",
      value: fmt.money(pick(d, "total_revenue", "revenue", "faturamento", "total_sales_value")),
      meta: "Soma de vendas confirmadas",
      accent: "var(--mint)",
      icon: "money",
    },
    {
      label: "Ingressos vendidos",
      value: fmt.int(pick(d, "tickets_sold", "total_tickets", "ingressos_vendidos", "tickets")),
      meta: "Total emitido",
      accent: "var(--red)",
      icon: "ticket",
    },
    {
      label: "Vendas",
      value: fmt.int(pick(d, "total_sales", "sales_count", "vendas", "sales")),
      meta: "Pedidos realizados",
      accent: "var(--amber)",
      icon: "cart",
    },
    {
      label: "Eventos ativos",
      value: fmt.int(pick(d, "active_events", "events_active", "eventos_ativos", "events")),
      meta: "Disponíveis no catálogo",
      accent: "var(--berry)",
      icon: "calendar",
    },
  ];
  return (
    <div className="grid grid-4">
      {tiles.map((t) => (
        <div className="stat" key={t.label} style={{ "--accent": t.accent }}>
          <div className="row between">
            <span className="label">{t.label}</span>
            <span style={{ color: t.accent }}><Icon name={t.icon} size={18} /></span>
          </div>
          <div className="value">{t.value}</div>
          <div className="meta">{t.meta}</div>
        </div>
      ))}
    </div>
  );
}

function TopEvents({ rows }) {
  if (!rows.length) return <Empty icon="trophy" title="Sem dados de ranking" hint="As vendas aparecerão aqui assim que forem registradas." />;
  return (
    <div className="table-wrap">
      <table className="tbl">
        <thead><tr><th>#</th><th>Evento</th><th className="right">Ingressos</th><th className="right">Receita</th></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={pick(r, "id", "event_id") ?? i}>
              <td><span className="pill-count">{i + 1}</span></td>
              <td style={{ fontWeight: 600 }}>{pick(r, "name", "event_name", "title") ?? "—"}</td>
              <td className="right mono">{fmt.int(pick(r, "tickets_sold", "tickets", "quantity", "total"))}</td>
              <td className="right price">{fmt.money(pick(r, "revenue", "total_revenue", "value"))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AlertsList({ items }) {
  if (!items.length) return <Empty icon="check" title="Tudo sob controle" hint="Nenhum alerta no momento." />;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((a, i) => {
        const level = String(pick(a, "level", "severity", "type") || "warning").toLowerCase();
        const cls = level.includes("crit") || level.includes("error") || level.includes("danger") ? "badge-red"
          : level.includes("info") ? "badge-blue" : "badge-amber";
        return (
          <div key={i} className="row" style={{ gap: 12, padding: "10px 0", borderBottom: i < items.length - 1 ? "1px solid var(--line)" : "none" }}>
            <span className={`badge ${cls}`}>{level}</span>
            <span style={{ flex: 1 }}>{pick(a, "message", "text", "description", "title") ?? JSON.stringify(a)}</span>
          </div>
        );
      })}
    </div>
  );
}

function LastSales({ rows }) {
  if (!rows.length) return <Empty icon="cart" title="Nenhuma venda registrada" hint="As vendas mais recentes aparecerão aqui." />;
  return (
    <div className="table-wrap">
      <table className="tbl">
        <thead><tr><th>Pedido</th><th>Cliente</th><th>Evento</th><th className="right">Qtd</th><th className="right">Total</th><th>Status</th><th>Data</th></tr></thead>
        <tbody>
          {rows.map((s, i) => (
            <tr key={pick(s, "id", "sale_id") ?? i}>
              <td className="mono">#{pick(s, "id", "sale_id") ?? "—"}</td>
              <td>{pick(s, "customer_name", "customer", "client_name") ?? pick(s, "customer_id") ?? "—"}</td>
              <td>{pick(s, "event_name", "event", "event_title") ?? "—"}</td>
              <td className="right mono">{fmt.int(pick(s, "quantity", "tickets", "items_count"))}</td>
              <td className="right price">{fmt.money(pick(s, "total", "total_value", "amount", "value"))}</td>
              <td><StatusBadge status={pick(s, "status", "payment_status")} /></td>
              <td className="muted">{fmt.datetime(pick(s, "created_at", "date", "sold_at"))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
