import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { login as apiLogin, register as apiRegister, logout as apiLogout, getSession } from '../api/auth'
import { setAccessToken, clearAccessToken } from '../api/tokenStore'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSession()
      .then(session => {
        if (session?.user && session?.token) {
          setUser(session.user)
          setToken(session.token)
          setAccessToken(session.token)
        } else {
          clearAccessToken()
        }
      })
      .catch(() => {
        clearAccessToken()
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (credentials) => {
    const session = await apiLogin(credentials)
    setUser(session.user)
    setToken(session.token)
    setAccessToken(session.token)
    return session
  }, [])

  const register = useCallback(async (data) => {
    const session = await apiRegister(data)
    setUser(session.user)
    setToken(session.token)
    setAccessToken(session.token)
    return session
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiLogout()
    } finally {
      setUser(null)
      setToken(null)
      clearAccessToken()
    }
  }, [])

  const isAuthenticated = !!token

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
