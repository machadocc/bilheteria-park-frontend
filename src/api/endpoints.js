import { http } from "./client";

// Todas as rotas admin usam /admin/* e são protegidas por JWT no backend.
// As rotas públicas (/eventos/, /compras, /auth/login) não exigem token.

// ── Autenticação ──────────────────────────────────────────────────────────────
export const authApi = {
  login: (username, password) =>
    http.post("/auth/login", { username, password }),
};

// ── Eventos (admin) ───────────────────────────────────────────────────────────
export const eventsApi = {
  list:      ()           => http.authGet("/admin/eventos"),
  create:    (data)       => http.authPost("/admin/eventos", data),
  get:       (id)         => http.authGet(`/admin/eventos/${id}`),    // usa rota pública se preferir
  update:    (id, data)   => http.authPut(`/admin/eventos/${id}`, data),
  remove:    (id)         => http.authDel(`/admin/eventos/${id}`),
  cancel:    (id)         => http.authPost(`/admin/eventos/${id}/cancel`),
  duplicate: (id)         => http.authPost(`/admin/eventos/${id}/duplicate`),
  history:   (id)         => http.authGet(`/admin/eventos/${id}/history`),
};

// ── Lotes de ingressos (admin) ────────────────────────────────────────────────
export const batchesApi = {
  list:   ()           => http.authGet("/admin/lotes"),
  create: (data)       => http.authPost("/admin/lotes", data),
  update: (id, data)   => http.authPut(`/admin/lotes/${id}`, data),
  close:  (id)         => http.authPost(`/admin/lotes/${id}/close`),
};

// ── Clientes (admin) ──────────────────────────────────────────────────────────
export const customersApi = {
  list:    ()           => http.authGet("/admin/clientes"),
  create:  (data)       => http.authPost("/admin/clientes", data),
  get:     (id)         => http.authGet(`/admin/clientes/${id}`),
  update:  (id, data)   => http.authPut(`/admin/clientes/${id}`, data),
  history: (id)         => http.authGet(`/admin/clientes/${id}/history`),
};

// ── PDV / Vendas (admin) ──────────────────────────────────────────────────────
// checkout usa SaleCreate: { customer_id, payment_method, items: [{ ticket_batch_id, quantity }] }
// catalog usa a rota pública de eventos com lotes disponíveis
export const salesApi = {
  checkout: (data) => http.authPost("/admin/vendas/checkout", data),
  catalog:  ()     => http.authGet("/admin/lotes"),   // lotes com evento para montar o catálogo do PDV
  report:   ()     => http.authGet("/admin/vendas"),
};

// ── Dashboard (admin) ─────────────────────────────────────────────────────────
export const dashboardApi = {
  summary:   () => http.authGet("/admin/dashboard/summary"),
  topEvents: () => http.authGet("/admin/dashboard/top-events"),
  alerts:    () => http.authGet("/admin/dashboard/alerts"),
  lastSales: () => http.authGet("/admin/dashboard/last-sales"),
};

// ── Sistema ───────────────────────────────────────────────────────────────────
export const systemApi = {
  health:  () => http.get("/health"),
  metrics: () => http.raw("/metrics").then((r) => r.text()),
};

// ── Público (sem autenticação) ────────────────────────────────────────────────
// Usado pela Home/EventoCheckout para compradores sem login
export const publicApi = {
  getEventos: ()     => http.get("/eventos/"),
  getEvento:  (id)   => http.get(`/eventos/${id}`),
  comprar:    (data) => http.post("/compras", data),
};
