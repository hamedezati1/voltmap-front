import {
  Users,
  Bell,
} from "lucide-react";
import { NAV } from "./constants";

export default function AdminTopbar({ active }) {
  return (
        <div
          style={{
            background: "#fff",
            borderBottom: "1px solid #f0f0f0",
            padding: "14px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 50,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "#1a1a1a",
                letterSpacing: "-0.3px",
              }}
            >
              {NAV.find((n) => n.key === active)?.label}
            </div>
            <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>
              نمای کلی سیستم
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              style={{
                width: 40,
                height: 40,
                borderRadius: 11,
                border: "1px solid #eef0f3",
                background: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                position: "relative",
              }}
            >
              <Bell size={18} color="#555" />
              <span
                style={{
                  position: "absolute",
                  top: 8,
                  right: 9,
                  width: 7,
                  height: 7,
                  background: "#2ECC71",
                  borderRadius: "50%",
                  border: "2px solid #fff",
                }}
              ></span>
            </button>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "#f4f5f7",
                borderRadius: 12,
                padding: "8px 14px",
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
                }}
              >
                <Users size={16} color="#fff" />
              </div>
              <div>
                <div
                  style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}
                >
                  مدیر سیستم
                </div>
                <div style={{ fontSize: 11, color: "#aaa" }}>Admin</div>
              </div>
            </div>
          </div>
        </div>
  );
}
