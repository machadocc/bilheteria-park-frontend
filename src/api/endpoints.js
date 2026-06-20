import { http } from "./client";

// Mapeamento direto da coleção Insomnia "Bilheteria Park Backend".
// Cada função corresponde a uma request da coleção.

export const eventsApi = {
  list: () => http.get("/events/"), // List Events
  create: (data) => http.post("/events/", data), // Create Event
  get: (id) => http.get(`/events/${id}`), // Get Event
  update: (id, data) => http.put(`/events/${id}`, data), // Update Event
  remove: (id) => http.del(`/events/${id}`), // Delete Event
  cancel: (id) => http.post(`/events/${id}/cancel`), // Cancel Event
  duplicate: (id) => http.post(`/events/${id}/duplicate`), // Duplicate Event
  history: (id) => http.get(`/events/${id}/history`), // Event History
};

export const batchesApi = {
  list: () => http.get("/batches/"), // List Ticket Batches
  create: (data) => http.post("/batches/", data), // Create Ticket Batch
  update: (id, data) => http.put(`/batches/${id}`, data), // Update Ticket Batch
  close: (id) => http.post(`/batches/${id}/close`), // Close Ticket Batch
};

export const customersApi = {
  list: () => http.get("/customers/"), // List Customers
  create: (data) => http.post("/customers/", data), // Create Customer
  get: (id) => http.get(`/customers/${id}`), // Get Customer
  update: (id, data) => http.put(`/customers/${id}`, data), // Update Customer
  history: (id) => http.get(`/customers/${id}/history`), // Customer Purchase History
};

export const salesApi = {
  checkout: (data) => http.post("/sales/checkout", data), // Create Sale
  catalog: () => http.get("/sales/catalog"), // Event Catalog
};

export const dashboardApi = {
  summary: () => http.get("/dashboard/summary"), // Dashboard Summary
  topEvents: () => http.get("/dashboard/top-events"), // Dashboard Top Events
  alerts: () => http.get("/dashboard/alerts"), // Dashboard Alerts
  lastSales: () => http.get("/dashboard/last-sales"), // Dashboard Last Sales
};

export const systemApi = {
  health: () => http.get("/health"), // Health Check
  metrics: () => http.raw("/metrics").then((r) => r.text()), // Prometheus Metrics (texto puro)
};
