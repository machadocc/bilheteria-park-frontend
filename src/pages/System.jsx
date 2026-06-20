import { useState } from "react";
import { systemApi } from "../api/endpoints";
import { getBaseUrl, setBaseUrl } from "../api/client";
import { useToast } from "../context/ToastContext";
import { Icon } from "../components/Icon";
import { ErrorBanner } from "../components/ui";

export default function System() {
  const toast = useToast();
  const [url, setUrl] = useState(getBaseUrl());
  const [health, setHealth] = useState(null);
  const [metrics, setMetrics] = useState("");
  const [err, setErr] = useState(null);
  const [loadingH, setLoadingH] = useState(false);
  const [loadingM, setLoadingM] = useState(false);

  function saveUrl() {
    setBaseUrl(url.trim());
    toast.success("URL base atualizada.");
  }

  async function checkHealth() {
    setLoadingH(true); setErr(null);
    try { setHealth(await systemApi.health()); toast.success("Backend respondeu."); }
    catch (e) { setHealth(null); setErr(e.message); }
    finally { setLoadingH(false); }
  }

  async function loadMetrics() {
    setLoadingM(true); setErr(null);
    try { setMetrics(await systemApi.metrics()); }
    catch (e) { setErr(e.message); }
    finally { setLoadingM(false); }
  }

  return (
    <div className="page">
      <div className="sec-title">
        <div><h2>Sistema</h2><p>Conexão com o backend, status e métricas Prometheus.</p></div>
      </div>

      <ErrorBanner message={err} />

      <div className="grid grid-2" style={{ alignItems: "start" }}>
        <div className="card card-pad">
          <h3 style={{ fontSize: 17, marginBottom: 14 }}><Icon name="settings" size={16} /> &nbsp;Conexão</h3>
          <div className="field">
            <label>URL base da API</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="http://localhost:8000" />
            <span className="hint">Equivale ao <code>base_url</code> do ambiente do Insomnia. No dev, use <code>/api</code> para passar pelo proxy e evitar CORS.</span>
          </div>
          <button className="btn btn-dark" onClick={saveUrl}><Icon name="check" size={15} /> Salvar URL</button>
        </div>

        <div className="card card-pad">
          <div className="row between mb">
            <h3 style={{ fontSize: 17 }}><Icon name="pulse" size={16} /> &nbsp;Health check</h3>
            <button className="btn btn-ghost btn-sm" onClick={checkHealth} disabled={loadingH}>
              <Icon name="refresh" size={14} /> {loadingH ? "Verificando…" : "Verificar"}
            </button>
          </div>
          {health == null ? (
            <p className="muted" style={{ fontSize: 14 }}>Clique em “Verificar” para testar o endpoint <code>/health</code>.</p>
          ) : (
            <div className="row" style={{ gap: 10 }}>
              <span className="status-dot dot-ok" />
              <span style={{ fontWeight: 600 }}>Online</span>
              <code className="mono" style={{ fontSize: 12, color: "var(--ink-soft)" }}>{JSON.stringify(health)}</code>
            </div>
          )}
        </div>
      </div>

      <div className="card mt">
        <div className="card-head">
          <h3><Icon name="activity" size={16} /> &nbsp;Métricas (Prometheus)</h3>
          <button className="btn btn-ghost btn-sm" onClick={loadMetrics} disabled={loadingM}>
            <Icon name="refresh" size={14} /> {loadingM ? "Carregando…" : "Carregar /metrics"}
          </button>
        </div>
        <div className="card-pad">
          {!metrics ? <p className="muted" style={{ fontSize: 14, margin: 0 }}>Nenhuma métrica carregada.</p> :
            <pre className="metrics-pre">{metrics}</pre>}
        </div>
      </div>
    </div>
  );
}
