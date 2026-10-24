import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { sidebarWidth } from "./admin/constants";
import useIsMobile from "./admin/useIsMobile";
import "./admin/adminResponsive.css";
import AdminSidebar from "./admin/AdminSidebar";
import AdminTopbar from "./admin/AdminTopbar";
import DashboardPanel from "./admin/DashboardPanel";
import StationsPanel from "./admin/StationsPanel";
import UsersPanel from "./admin/UsersPanel";
import NewsPanel from "./admin/NewsPanel";
import StationReportsPanel from "./admin/StationReportsPanel";
import ReportsPanel from "./admin/ReportsPanel";
import ComingSoonPanel from "./admin/ComingSoonPanel";
import ChargersPanel from "./admin/ChargersPanel";
import { isHomeStation } from "../lib/homeStations";

export default function Admin({ stations, setStations }) {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [active, setActive] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = useIsMobile();

  // ایستگاه‌های خانگی فقط در بخش «شارژرها» مدیریت می‌شوند؛
  // بقیه‌ی پنل‌ها فقط ایستگاه‌های معمولی را می‌بینند
  const publicStations = useMemo(
    () => (stations || []).filter((s) => !isHomeStation(s)),
    [stations],
  );

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  // با رفتن به دسکتاپ، دراور بسته شود
  useEffect(() => {
    if (!isMobile) setDrawerOpen(false);
  }, [isMobile]);

  // قفل اسکرول بدنه + بستن با Escape وقتی دراور بازه
  useEffect(() => {
    if (!drawerOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

  // در موبایل بعد از انتخاب هر منو، دراور بسته شود و صفحه به بالا برگردد
  const handleSetActive = useCallback(
    (key) => {
      setActive(key);
      if (isMobile) {
        setDrawerOpen(false);
        window.scrollTo({ top: 0 });
      }
    },
    [isMobile],
  );

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

  // در موبایل سایدبار همیشه حالت کامل دارد (collapse معنی ندارد)
  const sidebarCollapsed = isMobile ? false : collapsed;
  const width = sidebarWidth(sidebarCollapsed);

  const sidebar = (
    <AdminSidebar
      active={active}
      setActive={handleSetActive}
      collapsed={sidebarCollapsed}
      // در موبایل دکمه‌ی جمع‌کردن سایدبار، دراور را می‌بندد
      setCollapsed={isMobile ? closeDrawer : setCollapsed}
      onLeave={() => navigate("/")}
    />
  );

  return (
    <div
      className="adm-root"
      style={{
        display: "flex",
        minHeight: "100vh",
        fontFamily: "Vazirmatn",
        direction: "rtl",
        background: "#f4f5f7",
        // clip به‌جای hidden تا position:sticky تاپ‌بار خراب نشود
        overflowX: "clip",
      }}
    >
      {isMobile ? (
        <>
          {/* پس‌زمینه تیره پشت دراور */}
          <div
            onClick={closeDrawer}
            aria-hidden="true"
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.5)",
              opacity: drawerOpen ? 1 : 0,
              visibility: drawerOpen ? "visible" : "hidden",
              transition: "opacity 0.25s ease, visibility 0.25s ease",
              zIndex: 1090,
            }}
          />
          {/*
            ظرف دراور: چون transform دارد، سایدبارِ position:fixed داخلش
            نسبت به همین ظرف جایگذاری می‌شود.
          */}
          <div
            className="adm-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="منوی مدیریت"
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width,
              maxWidth: "85vw",
              transform: drawerOpen ? "translateX(0)" : "translateX(100%)",
              visibility: drawerOpen ? "visible" : "hidden",
              transition:
                "transform 0.25s cubic-bezier(0.4,0,0.2,1), visibility 0.25s",
              zIndex: 1100,
              overscrollBehavior: "contain",
            }}
          >
            {sidebar}
          </div>
        </>
      ) : (
        sidebar
      )}

      <div
        style={{
          flex: 1,
          minWidth: 0, // جلوگیری از بیرون‌زدن جدول‌ها و چارت‌ها از صفحه
          marginRight: isMobile ? 0 : width,
          transition: "margin-right 0.25s cubic-bezier(0.4,0,0.2,1)",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <AdminTopbar
          active={active}
          isMobile={isMobile}
          onMenu={() => setDrawerOpen(true)}
          menuOpen={drawerOpen}
        />

        <div style={{ padding: isMobile ? 12 : 28, flex: 1, minWidth: 0 }}>
          {active === "dashboard" && (
            <DashboardPanel
              stations={publicStations}
              setActive={handleSetActive}
            />
          )}
          {active === "stations" && (
            <StationsPanel
              stations={publicStations}
              setStations={setStations}
            />
          )}
          {active === "users" && (
            <UsersPanel stations={stations} setStations={setStations} />
          )}
          {active === "news" && <NewsPanel />}
          {active === "stationreports" && (
            <StationReportsPanel setStations={setStations} />
          )}
          {active === "reports" && <ReportsPanel stations={publicStations} />}
          {active === "chargers" && (
            <ChargersPanel stations={stations} setStations={setStations} />
          )}
          {active === "settings" && <ComingSoonPanel />}
        </div>
      </div>
    </div>
  );
}
