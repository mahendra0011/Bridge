import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [company, setCompany] = useState(null)
  const [agency, setAgency] = useState(null)
  const [loading, setLoading] = useState(true)

  // On mount, try to get user from cookie-based session
  useEffect(() => {
    api
      .get('/api/auth/me')
      .then((data) => {
        setUser(data.user)
        setCompany(data.company || null)
        setAgency(data.agency || null)
      })
      .catch(() => {
        // No valid session — user is not logged in
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const data = await api.post('/api/auth/login', { email, password })
    setUser(data.user)
    return data.user
  }, [])

  const signup = useCallback(async (payload) => {
    const data = await api.post('/api/auth/signup', payload)
    return data
  }, [])

  const companySignup = useCallback(async (payload) => {
    const data = await api.post('/api/auth/company-signup', payload)
    return data
  }, [])

  /** Called after OTP is verified — user data returned, token is in cookie */
  const loginWithToken = useCallback((userData) => {
    setUser(userData)
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout')
    } catch {
      // best-effort
    }
    setUser(null)
    setCompany(null)
    setAgency(null)
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const data = await api.get('/api/auth/me')
      setUser(data.user)
      setCompany(data.company || null)
      setAgency(data.agency || null)
      return data.user
    } catch {
      return null
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, company, agency, loading, login, signup, companySignup, loginWithToken, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
