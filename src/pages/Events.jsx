import { useState } from "react";
import { eventsApi } from "../api/endpoints";
import { useApi } from "../api/useApi";
import { ApiError } from "../api/client";
import { useToast } from "../context/ToastContext";
import { Loading, ErrorBanner, Empty, StatusBadge, Modal, fmt, pick } from "../components/ui";
import { Icon } from "../components/Icon";

const EMPTY = {
  name: "", description: "", category: "Show", date: "", time: "18:00:00",
  location: "", capacity: 1000, banner_url: "", status: "ACTIVE",
};

export default function Events() {
  const { data, loading, error, refetch } = useApi(() => eventsApi.list());
  const toast = useToast();
  const [editing, setEditing] = useState(null); // null | "new" | event
  const [historyFor, setHistoryFor] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const events = normalize(data);

  async function action(label, fn, id) {
    setBusyId(id);
    try {
      await fn();
      toast.success(label);
      refetch();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Falha na operação.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="page">
      <div className="sec-title">
        <div>
          <h2>Eventos</h2>
          <p>Crie, edite, cancele e duplique os eventos do parque.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing("new")}>
          <Icon name="plus" size={16} /> Novo evento
        </button>
      </div>

      <ErrorBanner message={error} onRetry={refetch} />

      <div className="card">
        {loading ? <Loading label="Buscando eventos…" /> : !events.length ? (
          <Empty icon="calendar" title="Nenhum evento ainda" hint="Crie o primeiro evento para começar a vender ingressos."
            action={<button className="btn btn-primary" onClick={() => setEditing("new")}><Icon name="plus" size={16} /> Novo evento</button>} />
        ) : (
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr><th>Evento</th><th>Categoria</th><th>Data</th><th>Local</th><th className="right">Capacidade</th><th>Status</th><th className="right">Ações</th></tr>
              </thead>
              <tbody>
                {events.map((ev) => {
                  const id = pick(ev, "id", "event_id");
                  const busy = busyId === id;
                  return (
                    <tr key={id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{pick(ev, "name", "title")}</div>
                        <div className="muted" style={{ fontSize: 12.5 }}>#{id}</div>
                      </td>
                      <td><span className="badge badge-blue">{pick(ev, "category") || "—"}</span></td>
                      <td>{fmt.date(pick(ev, "date"))} <span className="muted">{(pick(ev, "time") || "").slice(0, 5)}</span></td>
                      <td>{pick(ev, "location") || "—"}</td>
                      <td className="right mono">{fmt.int(pick(ev, "capacity"))}</td>
                      <td><StatusBadge status={pick(ev, "status")} /></td>
                      <td>
                        <div className="row" style={{ justifyContent: "flex-end", gap: 4 }}>
                          <IconBtn name="history" title="Histórico" onClick={() => setHistoryFor(ev)} />
                          <IconBtn name="copy" title="Duplicar" disabled={busy}
                            onClick={() => action("Evento duplicado.", () => eventsApi.duplicate(id), id)} />
                          <IconBtn name="ban" title="Cancelar evento" disabled={busy}
                            onClick={() => confirm("Cancelar este evento?") && action("Evento cancelado.", () => eventsApi.cancel(id), id)} />
                          <IconBtn name="edit" title="Editar" onClick={() => setEditing(ev)} />
                          <IconBtn name="trash" title="Excluir" danger disabled={busy}
                            onClick={() => confirm("Excluir este evento permanentemente?") && action("Evento excluído.", () => eventsApi.remove(id), id)} />
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
        <EventForm
          initial={editing === "new" ? EMPTY : { ...EMPTY, ...editing }}
          isNew={editing === "new"}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refetch(); }}
        />
      )}

      {historyFor && <HistoryModal event={historyFor} onClose={() => setHistoryFor(null)} />}
    </div>
  );
}

function IconBtn({ name, title, onClick, danger, disabled }) {
  return (
    <button className="btn btn-ghost btn-icon" title={title} onClick={onClick} disabled={disabled}
      style={danger ? { color: "var(--red-deep)" } : undefined}>
      <Icon name={name} size={16} />
    </button>
  );
}

function normalize(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.items)) return data.items;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

function EventForm({ initial, isNew, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save() {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        category: form.category,
        date: form.date,
        time: form.time,
        location: form.location,
        capacity: Number(form.capacity),
        banner_url: form.banner_url,
        status: form.status,
      };
      if (isNew) {
        await eventsApi.create(payload);
        toast.success("Evento criado.");
      } else {
        await eventsApi.update(pick(initial, "id", "event_id"), payload);
        toast.success("Evento atualizado.");
      }
      onSaved();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={isNew ? "Novo evento" : "Editar evento"}
      onClose={onClose}
      wide
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={save} disabled={saving || !form.name}>
          {saving ? "Salvando…" : isNew ? "Criar evento" : "Salvar alterações"}
        </button>
      </>}
    >
      <div className="field">
        <label>Nome do evento</label>
        <input value={form.name} onChange={set("name")} placeholder="Ex.: Festa do Parque" />
      </div>
      <div className="field">
        <label>Descrição</label>
        <textarea value={form.description} onChange={set("description")} placeholder="Detalhes do evento…" />
      </div>
      <div className="form-row">
        <div className="field">
          <label>Categoria</label>
          <select value={form.category} onChange={set("category")}>
            {["Show", "Teatro", "Infantil", "Esporte", "Festa", "Outro"].map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Status</label>
          <select value={form.status} onChange={set("status")}>
            {["ACTIVE", "DRAFT", "CANCELLED"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="field"><label>Data</label><input type="date" value={form.date} onChange={set("date")} /></div>
        <div className="field"><label>Horário</label><input type="time" step="1" value={form.time} onChange={set("time")} /></div>
      </div>
      <div className="form-row">
        <div className="field"><label>Local</label><input value={form.location} onChange={set("location")} placeholder="Ex.: Praça Central" /></div>
        <div className="field"><label>Capacidade</label><input type="number" min="0" value={form.capacity} onChange={set("capacity")} /></div>
      </div>
      <div className="field">
        <label>URL do banner</label>
        <input value={form.banner_url} onChange={set("banner_url")} placeholder="https://…" />
      </div>
    </Modal>
  );
}

function HistoryModal({ event, onClose }) {
  const id = pick(event, "id", "event_id");
  const { data, loading, error, refetch } = useApi(() => eventsApi.history(id), [id]);
  const rows = Array.isArray(data) ? data : (data?.items || data?.history || []);

  return (
    <Modal title={`Histórico · ${pick(event, "name", "title")}`} onClose={onClose} wide>
      {loading ? <Loading /> : error ? <ErrorBanner message={error} onRetry={refetch} /> :
        !rows.length ? <Empty icon="history" title="Sem histórico" hint="Nenhuma alteração registrada para este evento." /> : (
          <div className="table-wrap">
            <table className="tbl">
              <thead><tr><th>Quando</th><th>Ação</th><th>Detalhes</th></tr></thead>
              <tbody>
                {rows.map((h, i) => (
                  <tr key={i}>
                    <td className="muted">{fmt.datetime(pick(h, "created_at", "date", "timestamp", "when"))}</td>
                    <td><span className="badge badge-blue">{pick(h, "action", "event", "type", "operation") || "—"}</span></td>
                    <td>{pick(h, "description", "detail", "message", "changes") ?? JSON.stringify(h)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </Modal>
  );
}
