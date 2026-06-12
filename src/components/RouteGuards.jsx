import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isOnboardingDone } from '../lib/storage'
import AppLoading from './AppLoading'

/** مسیرهای اصلی اپ — فقط برای کاربر لاگین‌شده */
export function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) return <AppLoading />

  if (!isAuthenticated) {
    if (!isOnboardingDone()) {
      return <Navigate to="/splash" state={{ from: location }} replace />
    }
    return <Navigate to="/auth" state={{ from: location }} replace />
  }

  return children
}

/** مسیرهای مهمان — فقط برای کاربر لاگین‌نشده */
export function GuestRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return <AppLoading />
  if (isAuthenticated) return <Navigate to="/" replace />

  return children
}

export function SplashRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return <AppLoading />
  if (isAuthenticated) return <Navigate to="/" replace />
  if (isOnboardingDone()) return <Navigate to="/auth" replace />

  return children
}

export function OnboardingRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return <AppLoading />
  if (isAuthenticated) return <Navigate to="/" replace />
  if (isOnboardingDone()) return <Navigate to="/auth" replace />

  return children
}

export function AuthRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return <AppLoading />
  if (isAuthenticated) return <Navigate to="/" replace />

  return children
}
