// Every request is a same-origin relative path under /api. In production
// this is served by the CloudFront distribution's "/api/*" behavior, which
// forwards to whichever API Gateway belongs to that environment - so no
// backend URL/domain is ever hardcoded here. In local dev, Vite's dev
// server proxies /api instead (see vite.config.js).
const API_BASE = '/api';

class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

async function request(path, { method = 'GET', body, headers, ...rest } = {}) {
  const token = localStorage.getItem('authToken');
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
