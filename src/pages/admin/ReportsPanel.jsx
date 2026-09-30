import {
  MapPin,
  Star,
  CheckCircle,
  AlertCircle,
  PowerOff,
} from "lucide-react";
import StatCard from "./StatCard";
import { STATUSES, CHART_DATA, CHART_DAYS } from "./constants";

export default function ReportsPanel({ stations }) {
  const available = stations.filter((s) => s.status === "available").length;
  const busy = stations.filter((s) => s.status === "busy").length;
  const offline = stations.filter((s) => s.status === "offline").length;
  const chartData = CHART_DATA;
  const chartDays = CHART_DAYS;

  return (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4,1fr)",
                  gap: 16,
                  marginBottom: 24,
                }}
              >
                <StatCard
                  label="کل ایستگاه‌ها"
                  value={stations.length}
                  sub="ثبت شده"
                  subUp
                  Icon={MapPin}
                  color="#2ECC71"
                  bg="#e8faf0"
                />
                <StatCard
                  label="خلوت"
                  value={available}
                  sub="در دسترس"
                  subUp
                  Icon={CheckCircle}
                  color="#27AE60"
                  bg="#d5f0e0"
                />
                <StatCard
                  label="شلوغ"
                  value={busy}
                  sub="مشغول"
                  subUp={false}
                  Icon={AlertCircle}
                  color="#E67E22"
                  bg="#fef3e2"
                />
                <StatCard
                  label="خاموش"
                  value={offline}
                  sub="غیرفعال"
                  subUp={false}
                  Icon={PowerOff}
                  color="#95a5a6"
                  bg="#f0f0f0"
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr",
                  gap: 20,
                  marginBottom: 24,
                }}
              >
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 16,
                    padding: 24,
                    border: "1px solid #eef0f3",
                  }}
                >
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: "#1a1a1a",
                      marginBottom: 20,
                    }}
                  >
                    نمودار استفاده (۷ روز اخیر)
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-end",
                      gap: 12,
                      height: 160,
                    }}
                  >
                    {chartData.map((v, i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            color: "#888",
                            fontWeight: 600,
                          }}
                        >
                          {v}
                        </div>
                        <div
                          style={{
                            width: "100%",
                            background:
                              "linear-gradient(180deg,#2ECC71,#1a8a40)",
                            borderRadius: "6px 6px 3px 3px",
                            height: `${(v / 250) * 130}px`,
                          }}
                        ></div>
                        <span style={{ fontSize: 10, color: "#aaa" }}>
                          {chartDays[i]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    background: "#fff",
                    borderRadius: 16,
                    padding: 24,
                    border: "1px solid #eef0f3",
                  }}
                >
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: "#1a1a1a",
                      marginBottom: 16,
                    }}
                  >
                    توزیع نوع شارژر
                  </div>
                  {["AC", "DC", "AC/DC"].map((type) => {
                    const count = stations.filter(
                      (s) => s.type === type,
                    ).length;
                    const pct = stations.length
                      ? Math.round((count / stations.length) * 100)
                      : 0;
                    const colors = {
                      AC: "#F39C12",
                      DC: "#3498DB",
                      "AC/DC": "#2ECC71",
                    };
                    return (
                      <div key={type} style={{ marginBottom: 14 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: 6,
                          }}
                        >
                          <span style={{ fontSize: 13, color: "#555" }}>
                            {type}
                          </span>
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: "#1a1a1a",
                            }}
                          >
                            {count} ({pct}٪)
                          </span>
                        </div>
                        <div
                          style={{
                            height: 8,
                            borderRadius: 4,
                            background: "#f0f0f0",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              borderRadius: 4,
                              background: colors[type],
                              width: `${pct}%`,
                              transition: "width 0.5s",
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div
                style={{
                  background: "#fff",
                  borderRadius: 16,
                  border: "1px solid #eef0f3",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "16px 22px",
                    borderBottom: "1px solid #f5f7fa",
                  }}
                >
                  <span
                    style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a" }}
                  >
                    آمار تفصیلی همه ایستگاه‌ها
                  </span>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8f9fb" }}>
                      {[
                        "ایستگاه",
                        "شهر",
                        "نوع",
                        "توان",
                        "پورت‌ها",
                        "وضعیت",
                        "نظرات",
                        "امتیاز",
                      ].map((h, i) => (
                        <th
                          key={i}
                          style={{
                            padding: "12px 16px",
                            fontSize: 12,
                            color: "#888",
                            fontWeight: 600,
                            textAlign: "right",
                            fontFamily: "Vazirmatn",
                            borderBottom: "1px solid #eef0f3",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stations.map((s) => {
                      const st =
                        STATUSES.find((x) => x.value === s.status) ||
                        STATUSES[0];
                      return (
                        <tr
                          key={s.id}
                          style={{ borderTop: "1px solid #f5f7fa" }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = "#fafbfc")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "transparent")
                          }
                        >
                          <td
                            style={{
                              padding: "12px 16px",
                              fontSize: 13,
                              fontWeight: 600,
                              color: "#1a1a1a",
                            }}
                          >
                            {s.name}
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              fontSize: 13,
                              color: "#666",
                            }}
                          >
                            {s.city}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span
                              style={{
                                fontSize: 11,
                                background: "#e8faf0",
                                color: "#27AE60",
                                padding: "3px 10px",
                                borderRadius: 8,
                              }}
                            >
                              {s.type}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              fontSize: 13,
                              color: "#666",
                            }}
                          >
                            {s.power}kW
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              fontSize: 13,
                              color: "#666",
                            }}
                          >
                            {s.ports}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span
                              style={{
                                fontSize: 11,
                                padding: "4px 12px",
                                borderRadius: 20,
                                background: st.bg,
                                color: st.color,
                                fontWeight: 600,
                              }}
                            >
                              {st.label}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              fontSize: 13,
                              color: "#666",
                            }}
                          >
                            {s.reviews.length}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                              }}
                            >
                              <Star
                                size={13}
                                color="#F39C12"
                                fill={s.rating ? "#F39C12" : "none"}
                              />
                              <span
                                style={{
                                  fontSize: 13,
                                  fontWeight: 600,
                                  color: "#1a1a1a",
                                }}
                              >
                                {s.rating || "—"}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
  );
}
