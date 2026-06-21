import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { publicApi } from "../api/newEndpoints";
import { useApi } from "../api/useApi";
import { ApiError } from "../api/client";
import { useToast } from "../context/ToastContext";
import { Loading, ErrorBanner, fmt, pick, maskCpfCnpj, onlyDigits } from "../components/ui";
import { Icon } from "../components/Icon";

export default function EventoCheckout() {
  const { eventoId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  // Busca evento individual diretamente por ID
  const { data: evento, loading, error, refetch } = useApi(() => publicApi.getEvento(eventoId));

  const [quantidade, setQuantidade] = useState(1);
  const [form, setForm] = useState({ nome_comprador: "", email_comprador: "", cpf_comprador: "" });
  const [comprando, setComprando] = useState(false);
  const [compraRealizada, setCompraRealizada] = useState(null);

  if (loading) return (
    <div className="public-page">
      <PublicHeader />
      <div className="page"><Loading label="Carregando evento…" /></div>
    </div>
  );

  if (error || !evento) return (
    <div className="public-page">
      <PublicHeader />
      <div className="page">
        <ErrorBanner message={error || "Evento não encontrado"} onRetry={refetch} />
        <button className="btn btn-ghost" onClick={() => navigate("/")}>
          <Icon name="arrow-left" size={16} /> Voltar
        </button>
      </div>
    </div>
  );

  const eventId = pick(evento, "id", "event_id");
  const nome = pick(evento, "name", "titulo", "title");
  const dataEvento = pick(evento, "date", "data");
  const local = pick(evento, "location", "local");
  const imagem = pick(evento, "banner_url", "imagem", "image");
  const descricao = pick(evento, "description", "descricao");

  // Preço: do lote ativo ou min_price
  const lotes = pick(evento, "ticket_batches") || [];
  const lotesAtivos = lotes.filter(l => l.status === "ACTIVE" && l.quantity_available > 0);
  const precoMinimo = lotesAtivos.length > 0
    ? Math.min(...lotesAtivos.map(l => l.unit_price))
    : pick(evento, "min_price", "preco_minimo", "price") || 0;
  const estoque = lotesAtivos.reduce((acc, l) => acc + l.quantity_available, 0)
    || Number(pick(evento, "available_tickets", "estoque", "quantidade_em_estoque") || 0);
  const subtotal = precoMinimo * quantidade;

  // Lote a usar na compra (menor preço ativo)
  const loteParaCompra = lotesAtivos.sort((a, b) => a.unit_price - b.unit_price)[0];

  async function handleComprar() {
    if (!form.nome_comprador || !form.email_comprador || !form.cpf_comprador) {
      toast.error("Preencha todos os campos.");
      return;
    }
    if (quantidade <= 0 || quantidade > estoque) {
      toast.error("Quantidade inválida.");
      return;
    }

    setComprando(true);
    try {
      const res = await publicApi.comprar({
        evento_id: eventId,
        quantidade,
        nome_comprador: form.nome_comprador,
        email_comprador: form.email_comprador,
        cpf_comprador: form.cpf_comprador,
      });

      const codigo = pick(res, "purchase_code", "codigo", "codigo_compra", "order_id", "id");
      setCompraRealizada({ codigo, res });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Erro ao realizar a compra.");
    } finally {
      setComprando(false);
    }
  }

  if (compraRealizada) {
    return (
      <div className="public-page">
        <PublicHeader />
        <div className="public-main">
          <div className="card card-pad checkout-success">
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
              <h2 style={{ margin: "0 0 8px" }}>Compra realizada com sucesso!</h2>
              <p style={{ color: "#666", margin: "0 0 24px" }}>
                Seu ingresso foi confirmado. Guarde o código abaixo.
              </p>
              <div className="purchase-code-box">
                <div className="purchase-code-label">Código da compra</div>
                <div className="purchase-code">{compraRealizada.codigo}</div>
              </div>
              <div style={{ marginTop: 24, color: "#666", fontSize: 14 }}>
                Uma confirmação será enviada para <strong>{form.email_comprador}</strong>
              </div>
              <button
                className="btn btn-primary"
                style={{ marginTop: 32 }}
                onClick={() => navigate("/")}
              >
                <Icon name="arrow-left" size={16} /> Ver outros eventos
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="public-page">
      <PublicHeader />
      <div className="public-main">
        <button className="btn btn-ghost mb" onClick={() => navigate("/")}>
          <Icon name="arrow-left" size={16} /> Voltar
        </button>

        <div className="checkout-grid">
          {/* Detalhes do evento */}
          <div className="checkout-evento">
            {imagem && (
              <div className="evento-image-grande" style={{ backgroundImage: `url(${imagem})` }} />
            )}
            <h1 style={{ margin: "20px 0 8px" }}>{nome}</h1>
            {descricao && <p className="muted" style={{ marginBottom: 20 }}>{descricao}</p>}
            <div className="evento-details">
              {dataEvento && (
                <div className="evento-detail-item">
                  <Icon name="calendar" size={16} />
                  <span>Data: <strong>{fmt.date(dataEvento)}</strong></span>
                </div>
              )}
              {local && (
                <div className="evento-detail-item">
                  <Icon name="map" size={16} />
                  <span>Local: <strong>{local}</strong></span>
                </div>
              )}
              <div className="evento-detail-item">
                <Icon name="ticket" size={16} />
                <span>A partir de: <strong>{fmt.money(precoMinimo)}</strong></span>
              </div>
              <div className="evento-detail-item">
                <Icon name="layers" size={16} />
                <span>Disponível: <strong>{fmt.int(estoque)} ingresso{estoque !== 1 ? "s" : ""}</strong></span>
              </div>
            </div>

            {/* Lotes disponíveis */}
            {lotesAtivos.length > 1 && (
              <div style={{ marginTop: 24 }}>
                <h4 style={{ marginBottom: 12 }}>Lotes disponíveis</h4>
                {lotesAtivos.map(l => (
                  <div key={l.id} className="batch-line">
                    <div>
                      <div style={{ fontWeight: 600 }}>{l.name}</div>
                      <div style={{ fontSize: 13, color: "#666" }}>{l.ticket_type} · {l.quantity_available} disponíveis</div>
                    </div>
                    <div style={{ fontWeight: 700, color: "var(--red)" }}>{fmt.money(l.unit_price)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Formulário de compra */}
          <div className="card checkout-form card-pad">
            <h3 style={{ marginTop: 0 }}>Compre seus ingressos</h3>

            {estoque <= 0 ? (
              <div className="alert alert-error">
                <Icon name="alert-circle" size={16} /> Este evento não tem ingressos disponíveis.
              </div>
            ) : (
              <>
                <div className="field">
                  <label>Quantidade</label>
                  <div className="qty-input">
                    <button
                      onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
                      disabled={quantidade <= 1}
                    >−</button>
                    <input
                      type="number"
                      min="1"
                      max={estoque}
                      value={quantidade}
                      onChange={(e) =>
                        setQuantidade(Math.min(estoque, Math.max(1, parseInt(e.target.value) || 1)))
                      }
                    />
                    <button
                      onClick={() => setQuantidade(Math.min(estoque, quantidade + 1))}
                      disabled={quantidade >= estoque}
                    >+</button>
                  </div>
                </div>

                <div className="field">
                  <label>Nome completo *</label>
                  <input
                    placeholder="João Silva"
                    value={form.nome_comprador}
                    onChange={(e) => setForm(f => ({ ...f, nome_comprador: e.target.value }))}
                    disabled={comprando}
                  />
                </div>

                <div className="field">
                  <label>E-mail *</label>
                  <input
                    type="email"
                    placeholder="joao@email.com"
                    value={form.email_comprador}
                    onChange={(e) => setForm(f => ({ ...f, email_comprador: e.target.value }))}
                    disabled={comprando}
                  />
                </div>

                <div className="field">
                  <label>CPF *</label>
                  <input
                    placeholder="000.000.000-00"
                    inputMode="numeric"
                    maxLength={18}
                    value={maskCpfCnpj(form.cpf_comprador)}
                    onChange={(e) => setForm(f => ({ ...f, cpf_comprador: onlyDigits(e.target.value) }))}
                    disabled={comprando}
                  />
                </div>

                <div className="checkout-summary">
                  <div className="summary-row">
                    <span>{quantidade} ingresso{quantidade !== 1 ? "s" : ""}</span>
                    <span>{fmt.money(precoMinimo)} cada</span>
                  </div>
                  <div className="summary-total">
                    <span>Total</span>
                    <span>{fmt.money(subtotal)}</span>
                  </div>
                </div>

                <button
                  className="btn btn-primary"
                  style={{ width: "100%", marginTop: 16, justifyContent: "center" }}
                  onClick={handleComprar}
                  disabled={comprando}
                >
                  <Icon name="check" size={16} />
                  {comprando ? "Processando…" : "Comprar Ingressos"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PublicHeader() {
  return (
    <div className="public-header">
      <div className="public-header-content">
        <a href="/" className="brand" style={{ textDecoration: "none", color: "inherit" }}>
          <div style={{ fontSize: 24, fontWeight: 700 }}>🎪 Bilheteria Park</div>
          <div style={{ fontSize: 13, color: "#666", marginTop: 2 }}>Compre seus ingressos aqui</div>
        </a>
        <a href="/admin/login" className="btn btn-ghost" style={{ fontSize: 13 }}>
          <Icon name="lock" size={14} /> Área Admin
        </a>
      </div>
    </div>
  );
}
