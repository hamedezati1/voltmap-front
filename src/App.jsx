import { useState, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import StationDetail from './pages/StationDetail'
import Admin from './pages/Admin'
import Routes_ from './pages/Routes'
import Profile from './pages/Profile'
import Splash from './pages/Splash'
import Onboarding from './pages/Onboarding'
import Auth from './pages/Auth'
import BottomNav from './components/BottomNav'
import { RequireAuth, SplashRoute, OnboardingRoute, AuthRoute } from './components/RouteGuards'
import { fetchStations } from './api'

export default function App() {
  const [stations, setStations] = useState([])
  const [loading, setLoading] = useState(true)
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')

  useEffect(() => {
    fetchStations()
      .then(setStations)
      .finally(() => setLoading(false))
  }, [])

  // Admin: full-screen desktop layout, no mobile shell
  if (isAdmin) {
    return (
      <div style={{ minHeight: '100vh', background: '#f7f8fa' }}>
        <Routes>
          <Route path="/admin/*" element={<Admin stations={stations} setStations={setStations} loading={loading} />} />
        </Routes>
      </div>
    )
  }

  const gatePaths = ['/splash', '/onboarding', '/auth']
  const isGate = gatePaths.includes(location.pathname)

  // Gate screens: full-screen, no bottom nav
  if (isGate) {
    return (
      <div className="mobile-shell">
        <Routes>
          <Route path="/splash" element={<SplashRoute><Splash /></SplashRoute>} />
          <Route path="/onboarding" element={<OnboardingRoute><Onboarding /></OnboardingRoute>} />
          <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />
        </Routes>
      </div>
    )
  }

  // App: mobile shell — requires auth
  return (
    <div className="mobile-shell">
      <RequireAuth>
        <Routes>
          <Route path="/" element={<Home stations={stations} setStations={setStations} loading={loading} />} />
          <Route path="/station/:id" element={<StationDetail stations={stations} setStations={setStations} />} />
          <Route path="/routes" element={<Routes_ />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
        <BottomNav />
      </RequireAuth>
    </div>
  )
}
