import { useState } from "react";
import { batchesApi, eventsApi } from "../api/endpoints";
import { useApi } from "../api/useApi";
import { ApiError } from "../api/client";
import { useToast } from "../context/ToastContext";
import { Loading, ErrorBanner, Empty, StatusBadge, Modal, fmt, pick } from "../components/ui";
import { Icon } from "../components/Icon";

const EMPTY = { event_id: "", name: "Lote 1", ticket_type: "Inteira", quantity_available: 100, unit_price: 100, valid_until: "" };

export default function Batches() {
  const { data, loading, error, refetch } = useApi(() => batchesApi.list());
  const events = useApi(() => eventsApi.list());
  const toast = useToast();
  const [editing, setEditing] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const batches = normalize(data);
  const eventList = normalize(events.data);
  const eventName = (id) => {
    const ev = eventList.find((e) => String(pick(e, "id", "event_id")) === String(id));
    return ev ? pick(ev, "name", "title") : `Evento #${id}`;
  };

  async function close(id) {
    setBusyId(id);
    try {
      await batchesApi.close(id);
      toast.success("Lote encerrado.");
      refetch();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Falha ao encerrar.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="page">
      <div className="sec-title">
        <div><h2>Lotes de ingressos</h2><p>Defina tipos, preços e quantidade disponível por evento.</p></div>
        <button className="btn btn-primary" onClick={() => setEditing("new")}><Icon name="plus" size={16} /> Novo lote</button>
      </div>

      <ErrorBanner message={error} onRetry={refetch} />

      <div className="card">
        {loading ? <Loading /> : !batches.length ? (
          <Empty icon="layers" title="Nenhum lote cadastrado" hint="Crie lotes para colocar ingressos à venda."
            action={<button className="btn btn-primary" onClick={() => setEditing("new")}><Icon name="plus" size={16} /> Novo lote</button>} />
        ) : (
          <div className="table-wrap">
            <table className="tbl">
              <thead><tr><th>Lote</th><th>Evento</th><th>Tipo</th><th className="right">Disponível</th><th className="right">Preço</th><th>Válido até</th><th>Status</th><th className="right">Ações</th></tr></thead>
              <tbody>
                {batches.map((b) => {
                  const id = pick(b, "id", "batch_id");
                  const busy = busyId === id;
                  const avail = pick(b, "quantity_available", "available", "quantity");
                  return (
                    <tr key={id}>
                      <td style={{ fontWeight: 600 }}>{pick(b, "name")} <span className="muted" style={{ fontWeight: 400 }}>#{id}</span></td>
                      <td>{eventName(pick(b, "event_id"))}</td>
                      <td><span className="badge badge-gray">{pick(b, "ticket_type", "type") || "—"}</span></td>
                      <td className="right mono">{fmt.int(avail)}</td>
                      <td className="right price">{fmt.money(pick(b, "unit_price", "price"))}</td>
                      <td>{fmt.date(pick(b, "valid_until", "valid_to", "expires_at"))}</td>
                      <td><StatusBadge status={pick(b, "status") || (Number(avail) <= 0 ? "SOLD_OUT" : "OPEN")} /></td>
                      <td>
                        <div className="row" style={{ justifyContent: "flex-end", gap: 4 }}>
                          <button className="btn btn-ghost btn-icon" title="Editar" onClick={() => setEditing(b)}><Icon name="edit" size={16} /></button>
                          <button className="btn btn-ghost btn-icon" title="Encerrar lote" disabled={busy}
                            onClick={() => confirm("Encerrar este lote? Ele deixará de vender.") && close(id)}><Icon name="lock" size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <BatchForm
          initial={editing === "new" ? EMPTY : { ...EMPTY, ...editing }}
          isNew={editing === "new"}
          events={eventList}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refetch(); }}
        />
      )}
    </div>
  );
}

function normalize(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.items)) return data.items;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

function BatchForm({ initial, isNew, events, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save() {
    setSaving(true);
    try {
      if (isNew) {
        await batchesApi.create({
          event_id: Number(form.event_id),
          name: form.name,
          ticket_type: form.ticket_type,
          quantity_available: Number(form.quantity_available),
          unit_price: Number(form.unit_price),
          valid_until: form.valid_until,
        });
        toast.success("Lote criado.");
      } else {
        // Update do Insomnia envia apenas campos editáveis (ex.: unit_price)
        await batchesApi.update(pick(initial, "id", "batch_id"), {
          name: form.name,
          ticket_type: form.ticket_type,
          quantity_available: Number(form.quantity_available),
          unit_price: Number(form.unit_price),
          valid_until: form.valid_until,
        });
        toast.success("Lote atualizado.");
      }
      onSaved();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={isNew ? "Novo lote" : "Editar lote"} onClose={onClose}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={save} disabled={saving || (isNew && !form.event_id)}>
          {saving ? "Salvando…" : isNew ? "Criar lote" : "Salvar"}
        </button>
      </>}>
      <div className="field">
        <label>Evento</label>
        <select value={form.event_id} onChange={set("event_id")} disabled={!isNew}>
          <option value="">Selecione…</option>
          {events.map((e) => {
            const id = pick(e, "id", "event_id");
            return <option key={id} value={id}>{pick(e, "name", "title")} (#{id})</option>;
          })}
        </select>
        {!isNew && <span className="hint">O evento não pode ser alterado após a criação.</span>}
      </div>
      <div className="form-row">
        <div className="field"><label>Nome do lote</label><input value={form.name} onChange={set("name")} /></div>
        <div className="field">
          <label>Tipo</label>
          <select value={form.ticket_type} onChange={set("ticket_type")}>
            {["Inteira", "Meia", "VIP", "Cortesia"].map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="field"><label>Quantidade disponível</label><input type="number" min="0" value={form.quantity_available} onChange={set("quantity_available")} /></div>
        <div className="field"><label>Preço unitário (R$)</label><input type="number" min="0" step="0.01" value={form.unit_price} onChange={set("unit_price")} /></div>
      </div>
      <div className="field"><label>Válido até</label><input type="date" value={form.valid_until} onChange={set("valid_until")} /></div>
    </Modal>
  );
}
