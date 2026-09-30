import { useState, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import StationDetail from "./pages/StationDetail";
import Admin from "./pages/Admin";
import Routes_ from "./pages/Routes";
import Trip from "./pages/trip";
import GoldPaymentPlaceholder from "./pages/trip/GoldPaymentPlaceholder";
import Profile from "./pages/Profile";
import Reports from "./pages/Reports";
import MyStation from "./pages/MyStation";
import Contact from "./pages/Contact";
import Help from "./pages/Help";
import Splash from "./pages/Splash";
import Onboarding from "./pages/Onboarding";
import Auth from "./pages/Auth";
import PersonalInfo from "./pages/PersonalInfo";
import Vehicles from "./pages/Vehicles";
import AddVehicle from "./pages/AddVehicle";
import VehicleDetail from "./pages/VehicleDetail";
import BottomNav from "./components/BottomNav";
import {
  RequireAuth,
  RequireAdmin,
  SplashRoute,
  OnboardingRoute,
  AuthRoute,
} from "./components/RouteGuards";
import { fetchStations } from "./api";

export default function App() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  useEffect(() => {
    fetchStations()
      .then(setStations)
      .finally(() => setLoading(false));
  }, []);

  if (isAdmin) {
    return (
      <div style={{ background: "#f7f8fa" }}>
        <Routes>
          <Route
            path="/admin/*"
            element={
              <RequireAdmin>
                <Admin
                  stations={stations}
                  setStations={setStations}
                  loading={loading}
                />
              </RequireAdmin>
            }
          />
        </Routes>
      </div>
    );
  }

  const gatePaths = ["/splash", "/onboarding", "/auth"];
  const isGate = gatePaths.includes(location.pathname);

  // Gate screens: full-screen, no bottom nav
  if (isGate) {
    return (
      <div className="mobile-shell">
        <Routes>
          <Route
            path="/splash"
            element={
              <SplashRoute>
                <Splash />
              </SplashRoute>
            }
          />
          <Route
            path="/onboarding"
            element={
              <OnboardingRoute>
                <Onboarding />
              </OnboardingRoute>
            }
          />
          <Route
            path="/auth"
            element={
              <AuthRoute>
                <Auth />
              </AuthRoute>
            }
          />
        </Routes>
      </div>
    );
  }

  // App: mobile shell — requires auth
  return (
    <div className="mobile-shell">
      <RequireAuth>
        <Routes>
          <Route
            path="/"
            element={
              <Home
                stations={stations}
                setStations={setStations}
                loading={loading}
              />
            }
          />
          <Route
            path="/station/:id"
            element={
              <StationDetail stations={stations} setStations={setStations} />
            }
          />
          <Route path="/routes" element={<Routes_ />} />
          <Route path="/trip" element={<Trip />} />
          <Route path="/trip/upgrade" element={<GoldPaymentPlaceholder />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/my-station" element={<MyStation />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/help" element={<Help />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/personal-info" element={<PersonalInfo />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/vehicles/add" element={<AddVehicle />} />
          <Route path="/vehicle/:id" element={<VehicleDetail />} />
        </Routes>
        <BottomNav />
      </RequireAuth>
    </div>
  );
}
