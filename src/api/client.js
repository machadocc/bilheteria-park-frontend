// Cliente HTTP central. A base_url corresponde ao "Base Environment" do Insomnia.
// Em desenvolvimento, usamos /api para passar pelo proxy do Vite e evitar CORS local.
// Pode ser alterada em tempo de execução pela tela de Configurações.

const DEFAULT_BASE_URL = import.meta.env.DEV ? "/api" : "http://localhost:8000";
let BASE_URL = DEFAULT_BASE_URL;

export function getBaseUrl() {
  return BASE_URL;
}

export function setBaseUrl(url) {
  BASE_URL = url.replace(/\/+$/, "");
}

class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

async function request(path, { method = "GET", body, headers = {}, raw = false } = {}) {
  const url = `${BASE_URL}${path}`;
  const opts = { method, headers: { ...headers } };

  if (body !== undefined) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(url, opts);
  } catch (e) {
    throw new ApiError(
      `Não foi possível conectar em ${url}. Verifique se o backend está rodando e a URL base está correta.`,
      0,
      null
    );
  }

  if (raw) return res;

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const detail =
      (data && (data.detail || data.message)) ||
      (typeof data === "string" ? data : null) ||
      `Erro ${res.status}`;
    throw new ApiError(formatDetail(detail), res.status, data);
  }

  return data;
}

// FastAPI costuma retornar erros de validação como array de objetos {loc, msg, type}
function formatDetail(detail) {
  if (Array.isArray(detail)) {
    return detail
      .map((d) => {
        const field = Array.isArray(d.loc) ? d.loc.slice(1).join(".") : "";
        return field ? `${field}: ${d.msg}` : d.msg;
      })
      .join(" · ");
  }
  return String(detail);
}

export { ApiError };
export const http = {
  get: (p, opts) => request(p, { ...opts, method: "GET" }),
  post: (p, body, opts) => request(p, { ...opts, method: "POST", body }),
  put: (p, body, opts) => request(p, { ...opts, method: "PUT", body }),
  del: (p, opts) => request(p, { ...opts, method: "DELETE" }),
  raw: (p, opts) => request(p, { ...opts, raw: true }),
};
