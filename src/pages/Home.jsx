import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { publicApi } from "../api/newEndpoints";
import { useApi } from "../api/useApi";
import { Loading, ErrorBanner, Empty, fmt, pick } from "../components/ui";
import { Icon } from "../components/Icon";

export default function Home() {
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useApi(() => publicApi.getEventos());

  const eventos = useMemo(() => {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.eventos)) return data.eventos;
    if (data && Array.isArray(data.results)) return data.results;
    return [];
  }, [data]);

  return (
    <div className="public-page">
      <div className="public-header">
        <div className="public-header-content">
          <div className="brand">
            <div style={{ fontSize: 28, fontWeight: 700 }}>🎪 Bilheteria Park</div>
            <div style={{ fontSize: 14, color: "#666", marginTop: 4 }}>Compre seus ingressos aqui</div>
          </div>
          <a href="/admin/login" className="btn btn-primary">
            <Icon name="lock" size={16} /> Admin
          </a>
        </div>
      </div>

      <div className="public-main">
        <ErrorBanner message={error} onRetry={refetch} />

        <div className="events-grid">
          {loading ? (
            <div style={{ gridColumn: "1 / -1" }}>
              <Loading label="Carregando eventos…" />
            </div>
          ) : !eventos.length ? (
            <div style={{ gridColumn: "1 / -1" }}>
              <Empty icon="calendar" title="Nenhum evento disponível" hint="Volte mais tarde para conferir os ingressos." />
            </div>
          ) : (
            eventos.map((ev) => {
              const eventId = pick(ev, "id", "event_id");
              const nome = pick(ev, "titulo", "title", "name");
              const data = pick(ev, "data", "date");
              const local = pick(ev, "local", "location");
              const imagem = pick(ev, "imagem", "image", "banner_url");
              const precoMinimo = pick(ev, "preco_minimo", "min_price", "price");
              const estoque = pick(ev, "available_tickets", "estoque", "quantidade_em_estoque", "stock", "quantity");

              return (
                <div key={eventId} className="event-card public" onClick={() => navigate(`/evento/${eventId}`)}>
                  {imagem && <div className="event-image" style={{ backgroundImage: `url(${imagem})` }} />}
                  <div className="event-info">
                    <h3 className="event-title">{nome}</h3>
                    <div className="event-meta">
                      {data && <div className="event-meta-item"><Icon name="calendar" size={14} /> {fmt.date(data)}</div>}
                      {local && <div className="event-meta-item"><Icon name="map" size={14} /> {local}</div>}
                    </div>
                    <div className="event-footer">
                      <div className="event-price">
                        <div className="price-label">A partir de</div>
                        <div className="price-value">{fmt.money(precoMinimo || 0)}</div>
                      </div>
                      <div className="event-stock">
                        <div className="stock-label">Disponível</div>
                        <div className="stock-value">{fmt.int(estoque || 0)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
