import { useState, useMemo } from "react";
import { salesApi, customersApi } from "../api/endpoints";
import { useApi } from "../api/useApi";
import { ApiError } from "../api/client";
import { useToast } from "../context/ToastContext";
import { Loading, ErrorBanner, Empty, Modal, fmt, pick } from "../components/ui";
import { Icon } from "../components/Icon";

export default function PointOfSale() {
  const catalog = useApi(() => salesApi.catalog());
  const customers = useApi(() => customersApi.list());
  const toast = useToast();

  const [cart, setCart] = useState([]); // [{ batchId, name, eventName, price, qty, max }]
  const [customerId, setCustomerId] = useState("");
  const [payment, setPayment] = useState("credit_card");
  const [confirming, setConfirming] = useState(false);
  const [placing, setPlacing] = useState(false);

  const events = normalizeCatalog(catalog.data);
  const customerList = normalize(customers.data);

  const total = useMemo(() => cart.reduce((s, i) => s + i.price * i.qty, 0), [cart]);
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);

  function addToCart(batch, eventName) {
    const id = pick(batch, "id", "batch_id");
    const price = Number(pick(batch, "unit_price", "price") || 0);
    const max = Number(pick(batch, "quantity_available", "available", "quantity") || 0);
    setCart((c) => {
      const found = c.find((x) => x.batchId === id);
      if (found) {
        if (found.qty >= max) { toast.error("Quantidade disponível atingida."); return c; }
        return c.map((x) => (x.batchId === id ? { ...x, qty: x.qty + 1 } : x));
      }
      return [...c, { batchId: id, name: pick(batch, "name"), eventName, price, qty: 1, max }];
    });
  }

  function changeQty(batchId, delta) {
    setCart((c) =>
      c.map((x) => x.batchId === batchId ? { ...x, qty: Math.max(1, Math.min(x.max, x.qty + delta)) } : x)
        .filter((x) => x.qty > 0)
    );
  }
  function removeItem(batchId) { setCart((c) => c.filter((x) => x.batchId !== batchId)); }

  async function checkout() {
    setPlacing(true);
    try {
      const payload = {
        customer_id: Number(customerId),
        payment_method: payment,
        items: cart.map((i) => ({ ticket_batch_id: i.batchId, quantity: i.qty })),
      };
      const res = await salesApi.checkout(payload);
      toast.success(`Venda concluída! ${res?.id ? "Pedido #" + res.id : ""}`);
      setCart([]);
      setConfirming(false);
      catalog.refetch();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Falha ao finalizar a venda.");
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="page">
      <div className="sec-title">
        <div><h2>Ponto de venda</h2><p>Monte o pedido a partir do catálogo e finalize a compra.</p></div>
        <button className="btn btn-ghost" onClick={() => { catalog.refetch(); customers.refetch(); }}><Icon name="refresh" size={15} /> Atualizar</button>
      </div>

      <ErrorBanner message={catalog.error} onRetry={catalog.refetch} />

      <div className="catalog-grid">
        {/* Catálogo */}
        <div>
          {catalog.loading ? <Loading label="Carregando catálogo…" /> :
            !events.length ? <Empty icon="store" title="Catálogo vazio" hint="Cadastre eventos e lotes ativos para vendê-los aqui." /> : (
              <div className="grid" style={{ gap: 18 }}>
                {events.map((ev) => {
                  const evName = pick(ev, "name", "event_name", "title");
                  const batches = (pick(ev, "batches", "ticket_batches", "lots") || []).filter(Boolean);
                  return (
                    <div className="card event-card" key={pick(ev, "id", "event_id")}>
                      <div className="event-banner" style={pick(ev, "banner_url") ? { background: `url(${pick(ev, "banner_url")}) center/cover` } : undefined}>
                        <span className="badge badge-amber cat">{pick(ev, "category") || "Evento"}</span>
                      </div>
                      <div className="card-pad">
                        <div className="row between" style={{ alignItems: "flex-start" }}>
                          <div>
                            <h3 style={{ fontSize: 19 }}>{evName}</h3>
                            <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                              <Icon name="calendar" size={13} /> {fmt.date(pick(ev, "date"))} · {pick(ev, "location") || "—"}
                            </div>
                          </div>
                        </div>
                        <div className="mt">
                          {!batches.length ? <div className="muted" style={{ fontSize: 13 }}>Nenhum lote disponível.</div> :
                            batches.map((b) => {
                              const avail = Number(pick(b, "quantity_available", "available", "quantity") || 0);
                              const soldOut = avail <= 0;
                              return (
                                <div className="batch-line" key={pick(b, "id", "batch_id")}>
                                  <div>
                                    <div style={{ fontWeight: 600 }}>{pick(b, "name")} <span className="badge badge-gray" style={{ marginLeft: 6 }}>{pick(b, "ticket_type", "type")}</span></div>
                                    <div className="muted" style={{ fontSize: 12.5 }}>{soldOut ? "Esgotado" : `${fmt.int(avail)} disponíveis`}</div>
                                  </div>
                                  <div className="row" style={{ gap: 12 }}>
                                    <span className="price">{fmt.money(pick(b, "unit_price", "price"))}</span>
                                    <button className="btn btn-mint btn-sm" disabled={soldOut} onClick={() => addToCart(b, evName)}>
                                      <Icon name="plus" size={14} /> Adicionar
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
        </div>

        {/* Carrinho */}
        <div className="card cart card-pad">
          <div className="row between mb">
            <h3 style={{ fontSize: 18 }}><Icon name="cart" size={17} /> &nbsp;Carrinho</h3>
            {totalItems > 0 && <span className="pill-count">{totalItems}</span>}
          </div>

          {!cart.length ? (
            <div className="muted" style={{ fontSize: 14, padding: "20px 0", textAlign: "center" }}>
              Adicione ingressos do catálogo para iniciar uma venda.
            </div>
          ) : (
            <>
              {cart.map((i) => (
                <div className="cart-item" key={i.batchId}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{i.name}</div>
                    <div className="muted" style={{ fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{i.eventName}</div>
                    <div className="price" style={{ fontSize: 13 }}>{fmt.money(i.price)}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                    <div className="qty">
                      <button onClick={() => changeQty(i.batchId, -1)} aria-label="Diminuir">−</button>
                      <span className="mono" style={{ minWidth: 22, textAlign: "center" }}>{i.qty}</span>
                      <button onClick={() => changeQty(i.batchId, 1)} aria-label="Aumentar">+</button>
                    </div>
                    <button className="x-btn" style={{ fontSize: 12 }} onClick={() => removeItem(i.batchId)}>remover</button>
                  </div>
                </div>
              ))}

              <div className="cart-total mt"><span>Total</span><span>{fmt.money(total)}</span></div>

              <div className="field">
                <label>Cliente</label>
                <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                  <option value="">Selecione o cliente…</option>
                  {customerList.map((c) => {
                    const id = pick(c, "id", "customer_id");
                    return <option key={id} value={id}>{pick(c, "name")} — {pick(c, "cpf") || pick(c, "email")}</option>;
                  })}
                </select>
              </div>
              <div className="field">
                <label>Forma de pagamento</label>
                <select value={payment} onChange={(e) => setPayment(e.target.value)}>
                  <option value="credit_card">Cartão de crédito</option>
                  <option value="debit_card">Cartão de débito</option>
                  <option value="pix">Pix</option>
                  <option value="cash">Dinheiro</option>
                </select>
              </div>

              <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}
                disabled={!customerId} onClick={() => setConfirming(true)}>
                <Icon name="check" size={16} /> Finalizar venda
              </button>
              {!customerId && <span className="hint" style={{ display: "block", marginTop: 8, textAlign: "center" }}>Selecione um cliente para continuar.</span>}
            </>
          )}
        </div>
      </div>

      {confirming && (
        <Modal title="Confirmar venda" onClose={() => !placing && setConfirming(false)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setConfirming(false)} disabled={placing}>Voltar</button>
            <button className="btn btn-mint" onClick={checkout} disabled={placing}>{placing ? "Processando…" : "Confirmar e pagar"}</button>
          </>}>
          <p className="muted" style={{ marginTop: 0 }}>Revise o pedido antes de finalizar.</p>
          <div className="table-wrap">
            <table className="tbl">
              <thead><tr><th>Ingresso</th><th className="right">Qtd</th><th className="right">Subtotal</th></tr></thead>
              <tbody>
                {cart.map((i) => (
                  <tr key={i.batchId}><td>{i.name}<div className="muted" style={{ fontSize: 12 }}>{i.eventName}</div></td>
                    <td className="right mono">{i.qty}</td><td className="right price">{fmt.money(i.price * i.qty)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="cart-total"><span>Total</span><span>{fmt.money(total)}</span></div>
          <div className="muted" style={{ fontSize: 14 }}>
            Cliente: <strong>{customerList.find((c) => String(pick(c, "id", "customer_id")) === String(customerId)) ? pick(customerList.find((c) => String(pick(c, "id", "customer_id")) === String(customerId)), "name") : "—"}</strong>
            {" · "}Pagamento: <strong>{payment}</strong>
          </div>
        </Modal>
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
function normalizeCatalog(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.events)) return data.events;
  if (data && Array.isArray(data.items)) return data.items;
  if (data && Array.isArray(data.catalog)) return data.catalog;
  return [];
}
