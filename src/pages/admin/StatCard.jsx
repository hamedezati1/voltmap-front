import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatCard({ label, value, sub, subUp, Icon, color, bg }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: "clamp(12px, 3.5vw, 20px) clamp(12px, 3.5vw, 22px)",
        border: "1px solid #eef0f3",
        flex: 1,
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 8,
          marginBottom: 14,
        }}
      >
        <span
          style={{
            fontSize: 13,
            color: "#888",
            fontFamily: "Vazirmatn",
            minWidth: 0,
            lineHeight: 1.5,
          }}
        >
          {label}
        </span>
        <div
          style={{
            width: 42,
            height: 42,
            flexShrink: 0,
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
          fontSize: "clamp(22px, 6vw, 28px)",
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
          flexWrap: "wrap",
          color: subUp ? "#27AE60" : "#e74c3c",
        }}
      >
        {subUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        <span>{sub}</span>
      </div>
    </div>
  );
}
