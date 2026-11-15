/**
 * API Client for SentinelRisk Backend REST Endpoints
 */

const API_BASE = import.meta.env.VITE_API_BASE || "";

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  };

  try {
    const res = await fetch(url, config);
    const json = await res.json();
    if (!res.ok || json.success === false) {
      throw new Error(json.error || `HTTP ${res.status}: Request failed`);
    }
    return json.data !== undefined ? json.data : json;
  } catch (err) {
    console.error(`[API Error] ${endpoint}:`, err);
    throw err;
  }
}

export const API = {
  getKPIs: () => request("/api/kpis"),
  
  getTransactions: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "" && v !== "all") {
        query.append(k, v);
      }
    });
    return request(`/api/transactions?${query.toString()}`);
  },

  getTransactionDetail: (txnId) => request(`/api/transactions/${txnId}`),

  postTransactionAction: (txnId, action, notes = "", analyst = "A. Sharma (Lead)") =>
    request(`/api/transactions/${txnId}/action`, {
      method: "POST",
      body: JSON.stringify({ action, notes, analyst }),
    }),

  postBulkAction: (txnIds, action, notes = "", analyst = "A. Sharma (Lead)") =>
    request("/api/transactions/bulk-action", {
      method: "POST",
      body: JSON.stringify({ transaction_ids: txnIds, action, notes, analyst }),
    }),

  getAnalytics: () => request("/api/analytics"),

  getModels: () => request("/api/models"),

  postSimulate: (payload) =>
    request("/api/simulate", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getAuditLog: (limit = 100) => request(`/api/audit-log?limit=${limit}`),
};
