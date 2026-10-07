import {
  Zap,
  Users,
  LogOut,
  ChevronRight,
  Menu,
} from "lucide-react";
import { NAV, sidebarWidth } from "./constants";

export default function AdminSidebar({ active, setActive, collapsed, setCollapsed, onLeave }) {
  const width = sidebarWidth(collapsed);
  return (
      <div
        style={{
          width,
          flexShrink: 0,
          background: "#0f1923",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          overflowY: "auto",
          overflowX: "hidden",
          transition: "width 0.25s cubic-bezier(0.4,0,0.2,1)",
          zIndex: 100,
          boxShadow: "0 0 40px rgba(0,0,0,0.2)",
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: "18px 16px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg,#2ECC71,#1a7a40)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Zap size={18} color="#fff" />
            </div>
            {!collapsed && (
              <div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#fff",
                    lineHeight: 1.2,
                  }}
                >
                  ولت<span style={{ color: "#2ECC71" }}>مپ</span>
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.35)",
                    letterSpacing: 1,
                  }}
                >
                  VoltMap Admin
                </div>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#aaa",
                display: "flex",
                alignItems: "center",
              }}
            >
              <ChevronRight size={18} />
            </button>
          )}
        </div>

        {collapsed && (
          <div
            style={{
              padding: "12px 0",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <button
              onClick={() => setCollapsed(false)}
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "none",
                cursor: "pointer",
                color: "#555",
                borderRadius: 8,
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Menu size={16} />
            </button>
          </div>
        )}

        {/* Nav */}
        <nav
          style={{
            flex: 1,
            padding: "8px",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {NAV.map(({ key, Icon, label }) => (
            <button
              key={key}
              onClick={() => setActive(key)}
              title={collapsed ? label : ""}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: collapsed ? "10px 0" : "10px 14px",
                justifyContent: collapsed ? "center" : "flex-start",
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
                width: "100%",
                textAlign: "right",
                background:
                  active === key ? "rgba(46,204,113,0.15)" : "transparent",
                color: active === key ? "#2ECC71" : "rgba(255,255,255,0.5)",
                fontFamily: "Vazirmatn",
                fontSize: 13,
                fontWeight: active === key ? 600 : 400,
                transition: "all 0.15s",
                position: "relative",
              }}
            >
              {active === key && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "20%",
                    bottom: "20%",
                    width: 3,
                    borderRadius: "0 3px 3px 0",
                    background: "#2ECC71",
                  }}
                />
              )}
              <Icon size={18} style={{ flexShrink: 0 }} />
              {!collapsed && <span className="sidebar-label">{label}</span>}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div
          style={{
            padding: "10px 8px",
            borderTop: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          {/* Admin info */}
          {!collapsed && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 12,
                background: "rgba(255,255,255,0.05)",
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,#2ECC71,#1a7a40)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Users size={16} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>
                  مدیر سیستم
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                  admin@voltmap.ir
                </div>
              </div>
            </div>
          )}
          <button
            onClick={onLeave}
            title={collapsed ? "بازگشت به اپ" : ""}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: collapsed ? "10px 0" : "10px 14px",
              justifyContent: collapsed ? "center" : "flex-start",
              borderRadius: 12,
              border: "none",
              cursor: "pointer",
              width: "100%",
              background: "transparent",
              color: "rgba(255,255,255,0.35)",
              fontFamily: "Vazirmatn",
              fontSize: 13,
              transition: "all 0.15s",
            }}
          >
            <LogOut size={17} />
            {!collapsed && "بازگشت به اپ"}
          </button>
        </div>
      </div>
  );
}
