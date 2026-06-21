import { Icon } from "./Icon";

export function Modal({ title, children, onClose, wide, footer }) {
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? "modal-wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="x-btn" onClick={onClose} aria-label="Fechar">
            <Icon name="x" size={20} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function Loading({ label = "Carregando…" }) {
  return (
    <div className="state">
      <div className="spinner" />
      <p className="muted">{label}</p>
    </div>
  );
}

export function ErrorBanner({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="error-banner">
      <Icon name="alert" size={18} />
      <span style={{ flex: 1 }}>{message}</span>
      {onRetry && (
        <button className="btn btn-ghost btn-sm" onClick={onRetry}>
          <Icon name="refresh" size={14} /> Tentar de novo
        </button>
      )}
    </div>
  );
}

export function Empty({ icon = "ticket", title, hint, action }) {
  return (
    <div className="state">
      <div style={{ color: "var(--line)" }}>
        <Icon name={icon} size={48} />
      </div>
      <h3>{title}</h3>
      {hint && <p className="muted" style={{ maxWidth: 360 }}>{hint}</p>}
      {action}
    </div>
  );
}

const STATUS_MAP = {
  ACTIVE: { cls: "badge-green", label: "Ativo" },
  CANCELLED: { cls: "badge-red", label: "Cancelado" },
  CANCELED: { cls: "badge-red", label: "Cancelado" },
  CLOSED: { cls: "badge-gray", label: "Encerrado" },
  OPEN: { cls: "badge-green", label: "Aberto" },
  SOLD_OUT: { cls: "badge-amber", label: "Esgotado" },
  DRAFT: { cls: "badge-gray", label: "Rascunho" },
  PAID: { cls: "badge-green", label: "Pago" },
  PENDING: { cls: "badge-amber", label: "Pendente" },
  REFUNDED: { cls: "badge-blue", label: "Estornado" },
};

export function StatusBadge({ status }) {
  if (!status) return <span className="badge badge-gray">—</span>;
  const key = String(status).toUpperCase();
  const m = STATUS_MAP[key] || { cls: "badge-gray", label: status };
  return <span className={`badge ${m.cls}`}>{m.label}</span>;
}

export const fmt = {
  money: (v) =>
    v == null || isNaN(Number(v))
      ? "—"
      : Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
  int: (v) => (v == null || isNaN(Number(v)) ? "—" : Number(v).toLocaleString("pt-BR")),
  date: (v) => {
    if (!v) return "—";
    const d = new Date(v);
    if (isNaN(d)) return String(v);
    return d.toLocaleDateString("pt-BR");
  },
  datetime: (v) => {
    if (!v) return "—";
    const d = new Date(v);
    if (isNaN(d)) return String(v);
    return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  },
};

export function pick(obj, ...keys) {
  if (!obj) return undefined;
  for (const k of keys) if (obj[k] !== undefined && obj[k] !== null) return obj[k];
  return undefined;
}

const PAYMENT_LABELS = {
  credit_card: "Cartão de crédito",
  debit_card: "Cartão de débito",
  pix: "Pix",
  cash: "Dinheiro",
};

export function paymentLabel(method) {
  if (!method) return "—";
  return PAYMENT_LABELS[method] || method;
}

// ── Máscara de CPF/CNPJ ───────────────────────────────────────────────────────
// Remove qualquer caractere que não seja dígito e limita a 14 (tamanho máx. do CNPJ).
export function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 14);
}

// Formata progressivamente enquanto o usuário digita: até 11 dígitos vira CPF
// (000.000.000-00); a partir do 12º dígito vira CNPJ (00.000.000/0000-00).
// Sempre guarde o valor "limpo" (apenas dígitos) no estado do form e use esta
// função só para exibir no input — assim o payload enviado para a API já fica
// com 11 ou 14 dígitos, do jeito que o backend espera.
export function maskCpfCnpj(value) {
  const digits = onlyDigits(value);
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return digits
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}
