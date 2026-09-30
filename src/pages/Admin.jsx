import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { sidebarWidth } from "./admin/constants";
import AdminSidebar from "./admin/AdminSidebar";
import AdminTopbar from "./admin/AdminTopbar";
import DashboardPanel from "./admin/DashboardPanel";
import StationsPanel from "./admin/StationsPanel";
import UsersPanel from "./admin/UsersPanel";
import NewsPanel from "./admin/NewsPanel";
import StationReportsPanel from "./admin/StationReportsPanel";
import ReportsPanel from "./admin/ReportsPanel";
import ComingSoonPanel from "./admin/ComingSoonPanel";

export default function Admin({ stations, setStations }) {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [active, setActive] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);

  if (authLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Vazirmatn",
        }}
      >
        در حال بارگذاری...
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <Navigate
        to={isAuthenticated ? "/" : "/auth"}
        replace
        state={{ from: { pathname: "/admin" } }}
      />
    );
  }

  const width = sidebarWidth(collapsed);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        fontFamily: "Vazirmatn",
        direction: "rtl",
        background: "#f4f5f7",
      }}
    >
      <AdminSidebar
        active={active}
        setActive={setActive}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        onLeave={() => navigate("/")}
      />

      <div
        style={{
          flex: 1,
          marginRight: width,
          transition: "margin-right 0.25s cubic-bezier(0.4,0,0.2,1)",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <AdminTopbar active={active} />

        <div style={{ padding: 28, flex: 1 }}>
          {active === "dashboard" && (
            <DashboardPanel stations={stations} setActive={setActive} />
          )}
          {active === "stations" && (
            <StationsPanel stations={stations} setStations={setStations} />
          )}
          {active === "users" && <UsersPanel stations={stations} />}
          {active === "news" && <NewsPanel />}
          {active === "stationreports" && (
            <StationReportsPanel setStations={setStations} />
          )}
          {active === "reports" && <ReportsPanel stations={stations} />}
          {(active === "chargers" || active === "settings") && (
            <ComingSoonPanel />
          )}
        </div>
      </div>
    </div>
  );
}
