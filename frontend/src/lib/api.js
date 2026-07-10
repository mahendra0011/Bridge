// Central API client powered by Axios.
// All requests go through here so token handling, base URL, timeout, interceptors, and error shape stay consistent across the app.
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || ''

class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.status = status
    this.data = data
  }
}

// Get CSRF token from cookies
function getCsrfToken() {
  return document.cookie
    .split('; ')
    .find(r => r.startsWith('csrf-token='))
    ?.split('=')[1]
}

// Handle unauthenticated errors - redirect to login
function handleAuthError() {
  const currentPath = window.location.pathname
  if (!currentPath.includes('/login')) {
    window.location.href = '/login'
  }
}

const axiosClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 15000, // 15 second timeout built-in
})

// Request Interceptor
axiosClient.interceptors.request.use((config) => {
  if (config.method && config.method.toUpperCase() !== 'GET' && !config.skipCsrf) {
    const csrfToken = getCsrfToken()
    if (csrfToken) {
      config.headers['x-csrf-token'] = csrfToken
    }
  }
  return config
}, (error) => Promise.reject(error))

/**
 * Core request helper powered by Axios with retry support.
 */
async function request(path, {
  method = 'GET',
  body,
  isFormData = false,
  skipCsrf = false,
  timeout = 15000,
  retries = 2
} = {}) {
  let lastError
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const headers = {}
      if (!isFormData && body !== undefined) {
        headers['Content-Type'] = 'application/json'
      }

      const response = await axiosClient.request({
        url: path,
        method,
        data: body,
        headers,
        skipCsrf,
        timeout
      })

      return response.data
    } catch (err) {
      lastError = err
      const status = err.response?.status || 0
      const data = err.response?.data || null

      if (status === 401 || status === 403) {
        handleAuthError()
      }

      // If server responded with an error status, don't retry non-network errors unless needed
      if (err.response) {
        throw new ApiError(
          data?.message || `Request failed (${status})`,
          status,
          data
        )
      }

      if (attempt === retries) break
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
    }
  }

  if (lastError instanceof ApiError) {
    throw lastError
  }

  throw new ApiError('Network error — check your connection and try again.', 0, null)
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
