import { http } from "./client";

export const publicApi = {
  getEventos: ()     => http.get("/eventos/"),
  getEvento:  (id)   => http.get(`/eventos/${id}`),
  comprar:    (data) => http.post("/compras", data),
  checkPurchaseStatus: (cpf, eventoId) =>
    http.get(`/compras/status?cpf=${cpf}&evento_id=${eventoId}`),  // ← client → http
};

export const authApi = {
  login: (username, password) =>
    http.post("/auth/login", { username, password }),
};

export const adminApi = {
  createEvento: (data)     => http.authPost("/admin/eventos", data),
  updateEvento: (id, data) => http.authPut(`/admin/eventos/${id}`, data),
  deleteEvento: (id)       => http.authDel(`/admin/eventos/${id}`),
  getVendas:    ()         => http.authGet("/admin/vendas"),
};