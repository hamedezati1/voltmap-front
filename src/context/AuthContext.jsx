import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  requestOtp as apiRequestOtp,
  verifyOtp as apiVerifyOtp,
  logout as apiLogout,
  getSession,
} from '../api/auth'
import { setAccessToken, clearStoredSession } from '../api/tokenStore'
import { SESSION_EXPIRED_EVENT } from '../api/client'
import { normalizeMembership } from '../lib/membership'

/** نام قدیمی یا فارسی اشتراک را به free / pro / plus تبدیل می‌کند */
const withMembership = (u) =>
  u ? { ...u, membership: normalizeMembership(u.membership) } : u

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUserRaw] = useState(null)
  const setUser = useCallback(
    (next) =>
      setUserRaw((prev) =>
        withMembership(typeof next === 'function' ? next(prev) : next),
      ),
    [],
  )
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
          clearStoredSession()
        }
      })
      .catch(() => {
        clearStoredSession()
      })
      .finally(() => setLoading(false))
  }, [])

  // وسط استفاده، اگر refresh token قطعاً رد شد، state ری‌اکت هم با storage هماهنگ شود
  // (وگرنه UI «لاگین» می‌ماند در حالی که توکنی نیست)
  useEffect(() => {
    const onExpired = () => {
      setUser(null)
      setToken(null)
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired)
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
      clearStoredSession()
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
