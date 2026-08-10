import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  requestOtp as apiRequestOtp,
  verifyOtp as apiVerifyOtp,
  logout as apiLogout,
  getSession,
} from '../api/auth'
import { setAccessToken, clearAccessToken } from '../api/tokenStore'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSession()
      .then((session) => {
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

  const requestOtp = useCallback(async (payload, options) => {
    return apiRequestOtp(payload, options)
  }, [])

  const verifyOtp = useCallback(async (payload, options) => {
    const session = await apiVerifyOtp(payload, options)
    setUser(session.user)
    setToken(session.token)
    setAccessToken(session.token)
    return session
  }, [])

  const logout = useCallback(async (options) => {
    try {
      await apiLogout(options)
    } finally {
      setUser(null)
      setToken(null)
      clearAccessToken()
    }
  }, [])

  const isAuthenticated = !!token

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        requestOtp,
        verifyOtp,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
