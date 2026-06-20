import { useState } from "react";
import { customersApi } from "../api/endpoints";
import { useApi } from "../api/useApi";
import { ApiError } from "../api/client";
import { useToast } from "../context/ToastContext";
import { Loading, ErrorBanner, Empty, Modal, fmt, pick, StatusBadge } from "../components/ui";
import { Icon } from "../components/Icon";

const EMPTY = { name: "", cpf: "", birth_date: "", phone: "", email: "" };

export default function Customers() {
  const { data, loading, error, refetch } = useApi(() => customersApi.list());
  const [editing, setEditing] = useState(null);
  const [historyFor, setHistoryFor] = useState(null);
  const [q, setQ] = useState("");

  const all = normalize(data);
  const customers = all.filter((c) => {
    const s = (pick(c, "name") + " " + pick(c, "email") + " " + pick(c, "cpf")).toLowerCase();
    return s.includes(q.toLowerCase());
  });

  return (
    <div className="page">
      <div className="sec-title">
        <div><h2>Clientes</h2><p>Cadastro e histórico de compras dos clientes.</p></div>
        <button className="btn btn-primary" onClick={() => setEditing("new")}><Icon name="plus" size={16} /> Novo cliente</button>
      </div>

      <ErrorBanner message={error} onRetry={refetch} />

      <div className="field" style={{ maxWidth: 360 }}>
        <div className="row" style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 12, color: "var(--ink-soft)" }}><Icon name="search" size={16} /></span>
          <input style={{ paddingLeft: 36, width: "100%" }} placeholder="Buscar por nome, e-mail ou CPF…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <div className="card">
        {loading ? <Loading /> : !customers.length ? (
          <Empty icon="users" title={q ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
            hint={q ? "Tente outro termo de busca." : "Cadastre clientes para vincular às vendas."}
            action={!q && <button className="btn btn-primary" onClick={() => setEditing("new")}><Icon name="plus" size={16} /> Novo cliente</button>} />
        ) : (
          <div className="table-wrap">
            <table className="tbl">
              <thead><tr><th>Nome</th><th>CPF</th><th>Contato</th><th>Nascimento</th><th className="right">Ações</th></tr></thead>
              <tbody>
                {customers.map((c) => {
                  const id = pick(c, "id", "customer_id");
                  return (
                    <tr key={id}>
                      <td><div style={{ fontWeight: 600 }}>{pick(c, "name")}</div><div className="muted" style={{ fontSize: 12.5 }}>#{id}</div></td>
                      <td className="mono">{pick(c, "cpf") || "—"}</td>
                      <td><div>{pick(c, "email") || "—"}</div><div className="muted" style={{ fontSize: 12.5 }}>{pick(c, "phone") || ""}</div></td>
                      <td>{fmt.date(pick(c, "birth_date"))}</td>
                      <td>
                        <div className="row" style={{ justifyContent: "flex-end", gap: 4 }}>
                          <button className="btn btn-ghost btn-icon" title="Histórico de compras" onClick={() => setHistoryFor(c)}><Icon name="history" size={16} /></button>
                          <button className="btn btn-ghost btn-icon" title="Editar" onClick={() => setEditing(c)}><Icon name="edit" size={16} /></button>
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
        <CustomerForm initial={editing === "new" ? EMPTY : { ...EMPTY, ...editing }} isNew={editing === "new"}
          onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refetch(); }} />
      )}
      {historyFor && <CustomerHistory customer={historyFor} onClose={() => setHistoryFor(null)} />}
    </div>
  );
}

function normalize(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.items)) return data.items;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

function CustomerForm({ initial, isNew, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save() {
    setSaving(true);
    try {
      if (isNew) {
        await customersApi.create({ name: form.name, cpf: form.cpf, birth_date: form.birth_date, phone: form.phone, email: form.email });
        toast.success("Cliente cadastrado.");
      } else {
        await customersApi.update(pick(initial, "id", "customer_id"), { name: form.name, phone: form.phone, email: form.email, birth_date: form.birth_date });
        toast.success("Cliente atualizado.");
      }
      onSaved();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={isNew ? "Novo cliente" : "Editar cliente"} onClose={onClose}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={save} disabled={saving || !form.name}>{saving ? "Salvando…" : "Salvar"}</button>
      </>}>
      <div className="field"><label>Nome completo</label><input value={form.name} onChange={set("name")} placeholder="Ex.: João da Silva" /></div>
      <div className="form-row">
        <div className="field"><label>CPF</label><input value={form.cpf} onChange={set("cpf")} placeholder="000.000.000-00" disabled={!isNew} /></div>
        <div className="field"><label>Nascimento</label><input type="date" value={form.birth_date} onChange={set("birth_date")} /></div>
      </div>
      <div className="form-row">
        <div className="field"><label>Telefone</label><input value={form.phone} onChange={set("phone")} placeholder="+55 11 99999-9999" /></div>
        <div className="field"><label>E-mail</label><input type="email" value={form.email} onChange={set("email")} placeholder="email@exemplo.com" /></div>
      </div>
      {!isNew && <span className="hint">O CPF não pode ser alterado.</span>}
    </Modal>
  );
}

function CustomerHistory({ customer, onClose }) {
  const id = pick(customer, "id", "customer_id");
  const { data, loading, error, refetch } = useApi(() => customersApi.history(id), [id]);
  const rows = Array.isArray(data) ? data : (data?.items || data?.purchases || data?.history || []);

  return (
    <Modal title={`Compras · ${pick(customer, "name")}`} onClose={onClose} wide>
      {loading ? <Loading /> : error ? <ErrorBanner message={error} onRetry={refetch} /> :
        !rows.length ? <Empty icon="cart" title="Sem compras" hint="Este cliente ainda não realizou compras." /> : (
          <div className="table-wrap">
            <table className="tbl">
              <thead><tr><th>Pedido</th><th>Evento</th><th className="right">Qtd</th><th className="right">Total</th><th>Status</th><th>Data</th></tr></thead>
              <tbody>
                {rows.map((s, i) => (
                  <tr key={i}>
                    <td className="mono">#{pick(s, "id", "sale_id") ?? "—"}</td>
                    <td>{pick(s, "event_name", "event", "event_title") ?? "—"}</td>
                    <td className="right mono">{fmt.int(pick(s, "quantity", "tickets"))}</td>
                    <td className="right price">{fmt.money(pick(s, "total", "total_value", "amount", "value"))}</td>
                    <td><StatusBadge status={pick(s, "status", "payment_status")} /></td>
                    <td className="muted">{fmt.datetime(pick(s, "created_at", "date", "sold_at"))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </Modal>
  );
}
