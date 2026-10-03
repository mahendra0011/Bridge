import axios from 'axios'

function getCsrfToken() {
  if (typeof document === 'undefined') return undefined
  return document.cookie
    .split('; ')
    .find(r => r.startsWith('csrf-token='))
    ?.split('=')[1]
}

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 30000,
})

// Attach CSRF header for mutating requests
api.interceptors.request.use((config) => {
  if (config.method && config.method.toUpperCase() !== 'GET') {
    const csrfToken = getCsrfToken()
    if (csrfToken) {
      config.headers['x-csrf-token'] = csrfToken
    }
  }
  return config
}, (error) => Promise.reject(error))

export default api
export { api }
