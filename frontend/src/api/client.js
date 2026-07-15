// Every request is a same-origin relative path under /api. In production
// this is served by the CloudFront distribution's "/api/*" behavior, which
// forwards to whichever API Gateway belongs to that environment - so no
// backend URL/domain is ever hardcoded here. In local dev, Vite's dev
// server proxies /api instead (see vite.config.js).
const API_BASE = '/api';
export const TOKEN_KEY = 'authToken';
export const REFRESH_KEY = 'refreshToken';

class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

function performRefresh(refreshToken) {
  return fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  }).then(async (res) => {
    if (!res.ok) throw new Error('Refresh token rejected');
    const json = await res.json();
    localStorage.setItem(TOKEN_KEY, json.data.accessToken);
    localStorage.setItem(REFRESH_KEY, json.data.refreshToken);
  });
}

let refreshPromise = null;

// The access token is short-lived by design; a 401 from an otherwise-valid
// session just means it expired. Multiple requests can hit 401 around the
// same moment (e.g. several widgets fetching on mount), so dedupe into a
// single in-flight refresh call rather than firing one per request.
function refreshAccessToken() {
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!refreshToken) return Promise.reject(new Error('No refresh token'));
  if (!refreshPromise) {
    refreshPromise = performRefresh(refreshToken)
      .catch((err) => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_KEY);
        throw err;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

async function request(path, { method = 'GET', body, headers, retryOn401 = true, ...rest } = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  // FormData (image uploads) must keep its own multipart Content-Type
  // (with boundary) set by the browser - never JSON-encode or override it.
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      ...(body !== undefined && !isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? (isFormData ? body : JSON.stringify(body)) : undefined,
    ...rest,
  });

  if (response.status === 401 && retryOn401 && path !== '/auth/refresh' && path !== '/auth/login') {
    const refreshed = await refreshAccessToken().then(
      () => true,
      () => false
    );
    if (refreshed) {
      return request(path, { method, body, headers, ...rest, retryOn401: false });
    }
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    throw new ApiError(`Request to ${path} failed with ${response.status}`, response.status, data);
  }

  return data;
}

export const apiClient = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
};

// Backend error envelope is { success: false, error: { code, message, details } }.
export function getErrorMessage(err) {
  if (err instanceof ApiError) return err.body?.error?.message || err.message;
  return 'Đã xảy ra lỗi. Vui lòng thử lại.';
}

export { ApiError };
