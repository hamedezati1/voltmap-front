import React, { useState, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import StationDetail from './pages/StationDetail'
import Admin from './pages/Admin'
import Routes_ from './pages/Routes'
import Profile from './pages/Profile'
import BottomNav from './components/BottomNav'
import { getStations, saveStations } from './data/stations'

export default function App() {
  const [stations, setStations] = useState([])
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')

  useEffect(() => {
    setStations(getStations())
  }, [])

  const handleStationsChange = (updated) => {
    setStations(updated)
    saveStations(updated)
  }

  // Admin: full-screen desktop layout, no mobile shell
  if (isAdmin) {
    return (
      <div style={{ minHeight: '100vh', background: '#f7f8fa' }}>
        <Routes>
          <Route path="/admin/*" element={<Admin stations={stations} setStations={handleStationsChange} />} />
        </Routes>
      </div>
    )
  }

  // App: mobile shell
  return (
    <div className="mobile-shell">
      <Routes>
        <Route path="/" element={<Home stations={stations} setStations={handleStationsChange} />} />
        <Route path="/station/:id" element={<StationDetail stations={stations} setStations={handleStationsChange} />} />
        <Route path="/routes" element={<Routes_ />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
      <BottomNav />
    </div>
  )
}
