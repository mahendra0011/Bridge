// Central API client. All requests go through here so token handling,
// base URL, and error shape stay consistent across the app.
//
// JWT is stored in an httpOnly cookie (set by backend) — the browser sends
// it automatically with every request when credentials: 'include' is set.
// No localStorage token management needed.

const BASE_URL = import.meta.env.VITE_API_URL || ''

class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.status = status
    this.data = data
  }
}

/**
 * Core request helper.
 * @param {string} path - e.g. '/api/auth/login'
 * @param {object} options - { method, body, isFormData }
 */
async function request(path, { method = 'GET', body, isFormData = false } = {}) {
  const headers = {}
  if (!isFormData && body !== undefined) headers['Content-Type'] = 'application/json'

  let res
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      credentials: 'include',
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
    })
  } catch (err) {
    throw new ApiError('Network error — check your connection and try again.', 0, null)
  }

  const contentType = res.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await res.json().catch(() => null) : null

  if (!res.ok) {
    throw new ApiError(data?.message || `Request failed (${res.status})`, res.status, data)
  }
  return data
}

export const api = {
  get: (path) => request(path),
  post: (path, body, opts = {}) => request(path, { method: 'POST', body, ...opts }),
  put: (path, body, opts = {}) => request(path, { method: 'PUT', body, ...opts }),
  patch: (path, body, opts = {}) => request(path, { method: 'PATCH', body, ...opts }),
  delete: (path, opts = {}) => request(path, { method: 'DELETE', ...opts }),
  postForm: (path, formData) => request(path, { method: 'POST', body: formData, isFormData: true }),
  upload: (path, formData) => request(path, { method: 'POST', body: formData, isFormData: true }),
}

export { BASE_URL, ApiError }
