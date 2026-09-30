import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatCard({ label, value, sub, subUp, Icon, color, bg }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: "20px 22px",
        border: "1px solid #eef0f3",
        flex: 1,
        minWidth: 160,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 14,
        }}
      >
        <span style={{ fontSize: 13, color: "#888", fontFamily: "Vazirmatn" }}>
          {label}
        </span>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={20} color={color} />
        </div>
      </div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: "#1a1a1a",
          marginBottom: 8,
          letterSpacing: "-0.5px",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 12,
          display: "flex",
          alignItems: "center",
          gap: 4,
          color: subUp ? "#27AE60" : "#e74c3c",
        }}
      >
        {subUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        <span>{sub}</span>
      </div>
    </div>
  );
}
