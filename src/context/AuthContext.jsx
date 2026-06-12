import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { login as apiLogin, register as apiRegister, logout as apiLogout, getSession } from '../api/auth'

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
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (credentials) => {
    const session = await apiLogin(credentials)
    setUser(session.user)
    setToken(session.token)
    return session
  }, [])

  const register = useCallback(async (data) => {
    const session = await apiRegister(data)
    setUser(session.user)
    setToken(session.token)
    return session
  }, [])

  const logout = useCallback(async () => {
    await apiLogout()
    setUser(null)
    setToken(null)
  }, [])

  const isAuthenticated = !!token

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
