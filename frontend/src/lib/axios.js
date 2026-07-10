import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 15000,
  withCredentials: true,
})

// CSRF token interceptor
apiClient.interceptors.request.use(config => {
  const csrfToken = document.cookie
    .split('; ')
    .find(r => r.startsWith('csrf-token='))?.split('=')[1]
  if (csrfToken && config.method !== 'get') {
    config.headers['x-csrf-token'] = csrfToken
  }
  return config
})

// Response interceptor for auth errors
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      if (!window.location.hash.includes('login')) {
        window.location.href = '/#/login'
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient