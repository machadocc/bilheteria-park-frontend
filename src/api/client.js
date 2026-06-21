const DEFAULT_BASE_URL = "/api";  // nginx faz proxy /api -> backend
let BASE_URL = DEFAULT_BASE_URL;
let _authToken = null;

export function getBaseUrl() {
  return BASE_URL;
}

export function setBaseUrl(url) {
  BASE_URL = url.replace(/\/+$/, "");
}

export function setAuthToken(token) {
  _authToken = token;
}

export function getAuthToken() {
  return _authToken || localStorage.getItem("auth_token");
}

export function clearAuthToken() {
  _authToken = null;
}

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

async function request(path, { method = "GET", body, headers = {}, raw = false, auth = false } = {}) {
  const url = `${BASE_URL}${path}`;
  const opts = { method, headers: { ...headers } };

  // Inject JWT token when auth=true or when token is available
  const token = getAuthToken();
  if (auth && token) {
    opts.headers["Authorization"] = `Bearer ${token}`;
  } else if (token && auth !== false) {
    // Auto-inject if token exists and not explicitly disabled
    opts.headers["Authorization"] = `Bearer ${token}`;
  }

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

export const http = {
  get: (p, opts) => request(p, { ...opts, method: "GET" }),
  post: (p, body, opts) => request(p, { ...opts, method: "POST", body }),
  put: (p, body, opts) => request(p, { ...opts, method: "PUT", body }),
  del: (p, opts) => request(p, { ...opts, method: "DELETE" }),
  raw: (p, opts) => request(p, { ...opts, raw: true }),
  // Explicit auth variants
  authGet: (p, opts) => request(p, { ...opts, method: "GET", auth: true }),
  authPost: (p, body, opts) => request(p, { ...opts, method: "POST", body, auth: true }),
  authPut: (p, body, opts) => request(p, { ...opts, method: "PUT", body, auth: true }),
  authDel: (p, opts) => request(p, { ...opts, method: "DELETE", auth: true }),
};
