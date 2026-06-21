import { useMemo } from "react";
import { dashboardApi, customersApi, batchesApi, eventsApi } from "../api/endpoints";
import { useApi } from "../api/useApi";
import { Loading, ErrorBanner, Empty, fmt, pick, paymentLabel } from "../components/ui";
import { Icon } from "../components/Icon";

export default function Dashboard() {
  const summary = useApi(() => dashboardApi.summary());
  const top = useApi(() => dashboardApi.topEvents());
  const alerts = useApi(() => dashboardApi.alerts());
  const lastSales = useApi(() => dashboardApi.lastSales());

  // O endpoint /admin/dashboard/last-sales devolve apenas IDs (customer_id,
  // ticket_batch_id). Para mostrar nome do cliente e do evento sem precisar
  // alterar o backend agora, buscamos clientes/lotes/eventos já cadastrados
  // e cruzamos os dados no front.
  const customers = useApi(() => customersApi.list());
  const batches = useApi(() => batchesApi.list());
  const events = useApi(() => eventsApi.list());

  const customerMap = useMemo(() => buildMap(asArray(customers.data)), [customers.data]);
  const eventMap = useMemo(() => buildMap(asArray(events.data)), [events.data]);
  const batchEventMap = useMemo(() => {
    const map = {};
    for (const b of asArray(batches.data)) {
      const id = pick(b, "id", "batch_id");
      if (id != null) map[id] = pick(b, "event_id");
    }
    return map;
  }, [batches.data]);

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
        {lastSales.loading || customers.loading || batches.loading || events.loading ? <Loading /> :
          lastSales.error ? <ErrorBanner message={lastSales.error} onRetry={lastSales.refetch} /> : (
            <LastSales rows={asArray(lastSales.data)} customerMap={customerMap} eventMap={eventMap} batchEventMap={batchEventMap} />
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

// Indexa uma lista pelo id (aceita id ou *_id) para lookups O(1).
function buildMap(list) {
  const map = {};
  for (const item of list) {
    const id = pick(item, "id", "event_id", "customer_id");
    if (id != null) map[id] = item;
  }
  return map;
}

function SummaryTiles({ data }) {
  const d = data || {};
  // Campos conforme schemas.DashboardSummary no backend:
  // total_tickets_sold_today, daily_revenue, monthly_revenue, active_events,
  // finished_events, tickets_available.
  const tiles = [
    {
      label: "Receita do dia",
      value: fmt.money(pick(d, "daily_revenue")),
      meta: "Vendas confirmadas hoje",
      accent: "var(--mint)",
      icon: "money",
    },
    {
      label: "Receita do mês",
      value: fmt.money(pick(d, "monthly_revenue")),
      meta: "Acumulado no mês atual",
      accent: "var(--berry)",
      icon: "money",
    },
    {
      label: "Ingressos vendidos hoje",
      value: fmt.int(pick(d, "total_tickets_sold_today")),
      meta: "Emitidos nas últimas 24h",
      accent: "var(--red)",
      icon: "ticket",
    },
    {
      label: "Ingressos disponíveis",
      value: fmt.int(pick(d, "tickets_available")),
      meta: "Em lotes ativos",
      accent: "var(--amber)",
      icon: "layers",
    },
    {
      label: "Eventos ativos",
      value: fmt.int(pick(d, "active_events")),
      meta: "Disponíveis no catálogo",
      accent: "var(--mint)",
      icon: "calendar",
    },
    {
      label: "Eventos finalizados",
      value: fmt.int(pick(d, "finished_events")),
      meta: "Já realizados",
      accent: "var(--ink-soft)",
      icon: "check",
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
            <tr key={pick(r, "event_id", "id") ?? i}>
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
        // Backend (schemas.AlertOut) manda: event_id, name, remaining_tickets, capacity.
        // Não existe "message" pronto — montamos o texto e o nível aqui.
        const name = pick(a, "name", "event_name") ?? `Evento #${pick(a, "event_id")}`;
        const remaining = Number(pick(a, "remaining_tickets") ?? 0);
        const capacity = Number(pick(a, "capacity") ?? 0);
        const pct = capacity > 0 ? remaining / capacity : 0;
        const cls = remaining <= 0 ? "badge-red" : pct <= 0.05 ? "badge-red" : "badge-amber";
        const label = remaining <= 0 ? "esgotado" : "lotando";
        const message = remaining <= 0
          ? `${name}: ingressos esgotados (capacidade ${fmt.int(capacity)}).`
          : `${name}: restam ${fmt.int(remaining)} de ${fmt.int(capacity)} ingressos.`;
        return (
          <div key={pick(a, "event_id") ?? i} className="row" style={{ gap: 12, padding: "10px 0", borderBottom: i < items.length - 1 ? "1px solid var(--line)" : "none" }}>
            <span className={`badge ${cls}`}>{label}</span>
            <span style={{ flex: 1 }}>{message}</span>
          </div>
        );
      })}
    </div>
  );
}

function LastSales({ rows, customerMap, eventMap, batchEventMap }) {
  if (!rows.length) return <Empty icon="cart" title="Nenhuma venda registrada" hint="As vendas mais recentes aparecerão aqui." />;
  return (
    <div className="table-wrap">
      <table className="tbl">
        <thead><tr><th>Pedido</th><th>Cliente</th><th>Evento</th><th className="right">Qtd</th><th className="right">Total</th><th>Pagamento</th><th>Data</th></tr></thead>
        <tbody>
          {rows.map((s, i) => {
            // Backend (schemas.SaleOut) manda: id, customer_id, total_amount,
            // purchase_code, payment_method, created_at, items[{ticket_batch_id, quantity, unit_price}].
            // Não vem customer_name nem event_name prontos — resolvemos via os
            // mapas de clientes/lotes/eventos montados no componente pai.
            const id = pick(s, "id", "sale_id");
            const code = pick(s, "purchase_code");
            const customerId = pick(s, "customer_id");
            const customer = customerId != null ? customerMap[customerId] : null;
            const customerLabel = customer ? pick(customer, "name") : customerId != null ? `Cliente #${customerId}` : "—";

            const items = pick(s, "items") || [];
            const quantity = items.reduce((acc, it) => acc + Number(pick(it, "quantity") || 0), 0);

            const eventIds = [...new Set(items.map((it) => batchEventMap[pick(it, "ticket_batch_id")]).filter((v) => v != null))];
            const eventNames = eventIds.map((eid) => pick(eventMap[eid], "name") || `Evento #${eid}`);
            const eventLabel = eventNames.length ? eventNames.join(", ") : "—";

            const payment = pick(s, "payment_method");
            const paymentText = paymentLabel(payment);

            return (
              <tr key={id ?? i}>
                <td className="mono">{code ? code : id != null ? `#${id}` : "—"}</td>
                <td>{customerLabel}</td>
                <td>{eventLabel}</td>
                <td className="right mono">{fmt.int(quantity)}</td>
                <td className="right price">{fmt.money(pick(s, "total_amount"))}</td>
                <td><span className="badge badge-gray">{paymentText}</span></td>
                <td className="muted">{fmt.datetime(pick(s, "created_at"))}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
