import {
  Settings,
} from "lucide-react";

export default function ComingSoonPanel() {
  return (
            <div
              style={{
                background: "#fff",
                borderRadius: 16,
                padding: 60,
                textAlign: "center",
                border: "1px solid #eef0f3",
              }}
            >
              <Settings
                size={52}
                color="#ddd"
                style={{ margin: "0 auto 18px" }}
              />
              <h2
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.95)",
                  marginBottom: 10,
                }}
              >
                به زودی اضافه می‌شود
              </h2>
              <p style={{ fontSize: 14, color: "#aaa" }}>
                این بخش در حال توسعه است
              </p>
            </div>
  );
}
