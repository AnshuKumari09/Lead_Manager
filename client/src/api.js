const BASE = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'lm_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  constructor(message, { status = 0, details = null } = {}) {
    super(message);
    this.status = status;
    this.details = details; // field-level errors from the server
  }
}

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => (onUnauthorized = fn);

async function request(path, { method = 'GET', body } = {}) {
  const headers = {};
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError('Cannot reach the server. Check your connection and try again.');
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized();
    throw new ApiError(data.error || 'Something went wrong. Please try again.', {
      status: res.status,
      details: data.details,
    });
  }
  return data;
}

export const api = {
  signup: (b) => request('/auth/signup', { method: 'POST', body: b }),
  login: (b) => request('/auth/login', { method: 'POST', body: b }),
  me: () => request('/auth/me'),
  listLeads: (params) => request(`/leads?${new URLSearchParams(params)}`),
  stats: () => request('/leads/stats'),
  createLead: (b) => request('/leads', { method: 'POST', body: b }),
  updateLead: (id, b) => request(`/leads/${id}`, { method: 'PUT', body: b }),
  deleteLead: (id) => request(`/leads/${id}`, { method: 'DELETE' }),
};
