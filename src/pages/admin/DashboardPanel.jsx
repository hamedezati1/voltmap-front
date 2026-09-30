import { useEffect, useMemo, useState } from "react";
import {
  MapPin,
  Zap,
  Users,
  Star,
  AlertCircle,
} from "lucide-react";
import { fetchUsers, getAllCrowdStats } from "../../api";
import StatusDonutChart from "../../components/StatusDonutChart";
import StatCard from "./StatCard";
import { STATUSES, CHART_DATA, CHART_DAYS } from "./constants";

export default function DashboardPanel({ stations, setActive }) {
  const [users, setUsers] = useState([]);
  const [crowdStats, setCrowdStats] = useState([]);

  useEffect(() => {
    getAllCrowdStats()
      .then(setCrowdStats)
      .catch(() => setCrowdStats([]));
  }, []);

  useEffect(() => {
    fetchUsers()
      .then(setUsers)
      .catch(() => setUsers([]));
  }, []);

  const allReviews = useMemo(
    () =>
      stations.flatMap((s) =>
        (s.reviews || []).map((r) => ({
          ...r,
          stationName: s.name,
          stationId: s.id,
        })),
      ),
    [stations],
  );

  const available = stations.filter((s) => s.status === "available").length;
  const busy = stations.filter((s) => s.status === "busy").length;
  const waiting = stations.filter((s) => s.status === "waiting").length;
  const chartData = CHART_DATA;
  const chartDays = CHART_DAYS;

  return (
            <>
              {/* Stats */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4,1fr)",
                  gap: 16,
                  marginBottom: 24,
                }}
              >
                <StatCard
                  label="تعداد ایستگاه‌ها"
                  value={stations.length}
                  sub="۳.۱٪ نسبت به ماه قبل"
                  subUp
                  Icon={MapPin}
                  color="#2ECC71"
                  bg="#e8faf0"
                />
                <StatCard
                  label="کاربران ثبت‌نام‌شده"
                  value={users.length}
                  sub="در سیستم"
                  subUp
                  Icon={Users}
                  color="#3498DB"
                  bg="#EBF5FB"
                />
                <StatCard
                  label="ایستگاه‌های شلوغ"
                  value={busy}
                  sub="مشغول"
                  subUp={false}
                  Icon={AlertCircle}
                  color="#E67E22"
                  bg="#fef3e2"
                />
                <StatCard
                  label="نظرات کاربران"
                  value={allReviews.length}
                  sub="۸.۵٪ نسبت به ماه قبل"
                  subUp
                  Icon={Star}
                  color="#F39C12"
                  bg="#fef9e7"
                />
              </div>

              {/* گزارش‌های وضعیت کاربری - فقط اگه گزارشی باشه نشون داده میشه */}
              {/* TODO: این داده باید از GET /stations/crowd-reports/summary بیاد */}
              {crowdStats.filter((c) => c.recent > 0).length > 0 && (
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 16,
                    border: "1px solid #eef0f3",
                    overflow: "hidden",
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{
                      padding: "14px 20px",
                      borderBottom: "1px solid #f5f7fa",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Users size={16} color="#3498DB" />
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#1a1a1a",
                      }}
                    >
                      گزارش‌های وضعیت کاربری (۳۰ دقیقه اخیر)
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        color: "#aaa",
                        marginRight: "auto",
                      }}
                    >
                      الگوریتم: اگه ≥۲ گزارش و &gt;۵۰٪ شلوغ → وضعیت busy می‌شه
                    </span>
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f8f9fb" }}>
                        {[
                          "ایستگاه",
                          "گزارش خلوت",
                          "گزارش شلوغ",
                          "وضعیت محاسبه‌شده",
                        ].map((h, i) => (
                          <th
                            key={i}
                            style={{
                              padding: "10px 16px",
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
                      {crowdStats
                        .filter((c) => c.recent > 0)
                        .map((c) => {
                          const st = stations.find((s) => s.id === c.stationId);
                          const computed = c.computedStatus;
                          return (
                            <tr
                              key={c.stationId}
                              style={{ borderTop: "1px solid #f5f7fa" }}
                            >
                              <td
                                style={{
                                  padding: "10px 16px",
                                  fontSize: 13,
                                  fontWeight: 600,
                                  color: "#1a1a1a",
                                }}
                              >
                                {st?.name || `ایستگاه #${c.stationId}`}
                              </td>
                              <td style={{ padding: "10px 16px" }}>
                                <span
                                  style={{
                                    fontSize: 12,
                                    background: "#e8faf0",
                                    color: "#27AE60",
                                    padding: "2px 10px",
                                    borderRadius: 20,
                                  }}
                                >
                                  {c.availableCount}
                                </span>
                              </td>
                              <td style={{ padding: "10px 16px" }}>
                                <span
                                  style={{
                                    fontSize: 12,
                                    background: "#fef3e2",
                                    color: "#E67E22",
                                    padding: "2px 10px",
                                    borderRadius: 20,
                                  }}
                                >
                                  {c.busyCount}
                                </span>
                              </td>
                              <td style={{ padding: "10px 16px" }}>
                                {computed ? (
                                  <span
                                    style={{
                                      fontSize: 12,
                                      fontWeight: 600,
                                      background:
                                        computed === "busy"
                                          ? "#fef3e2"
                                          : "#e8faf0",
                                      color:
                                        computed === "busy"
                                          ? "#E67E22"
                                          : "#27AE60",
                                      padding: "3px 10px",
                                      borderRadius: 20,
                                    }}
                                  >
                                    {computed === "busy"
                                      ? "شلوغ (آپدیت شد)"
                                      : "خلوت (آپدیت شد)"}
                                  </span>
                                ) : (
                                  <span style={{ fontSize: 11, color: "#aaa" }}>
                                    هنوز به حد نصاب نرسیده ({c.recent}/۲)
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Two cols */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.4fr 1fr",
                  gap: 20,
                  marginBottom: 24,
                }}
              >
                {/* Recent stations */}
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 16,
                    padding: 22,
                    border: "1px solid #eef0f3",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 18,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: "#1a1a1a",
                      }}
                    >
                      آخرین ایستگاه‌های ثبت شده
                    </span>
                    <button
                      onClick={() => setActive("stations")}
                      style={{
                        fontSize: 12,
                        color: "#2ECC71",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "Vazirmatn",
                      }}
                    >
                      مشاهده همه
                    </button>
                  </div>
                  {stations.slice(0, 5).map((s) => {
                    const st =
                      STATUSES.find((x) => x.value === s.status) || STATUSES[0];
                    return (
                      <div
                        key={s.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                          paddingBottom: 14,
                          marginBottom: 14,
                          borderBottom: "1px solid #f5f7fa",
                        }}
                      >
                        <div
                          style={{
                            width: 50,
                            height: 50,
                            borderRadius: 12,
                            overflow: "hidden",
                            background: "#e8faf0",
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {s.image ? (
                            <img
                              src={s.image}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                              alt=""
                            />
                          ) : (
                            <Zap size={22} color="#2ECC71" />
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: "#1a1a1a",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {s.name}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "#aaa",
                              marginTop: 2,
                            }}
                          >
                            {s.city} · {s.type} · {s.maxPower || s.power || "—"}
                            kW
                            {s.operator ? ` · ${s.operator}` : ""}
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: 11,
                            padding: "4px 12px",
                            borderRadius: 20,
                            background: st.bg,
                            color: st.color,
                            fontWeight: 600,
                            flexShrink: 0,
                          }}
                        >
                          {st.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Donut chart */}
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 16,
                    padding: 22,
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
                    وضعیت شارژرها
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      marginBottom: 20,
                    }}
                  >
                    <StatusDonutChart
                      total={stations.length}
                      available={available}
                      busy={busy}
                      waiting={waiting}
                    />
                  </div>
                  {STATUSES.map((s) => {
                    const count = stations.filter(
                      (st) => st.status === s.value,
                    ).length;
                    const pct = stations.length
                      ? Math.round((count / stations.length) * 100)
                      : 0;
                    return (
                      <div
                        key={s.value}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 10,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <div
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: "50%",
                              background: s.color,
                              flexShrink: 0,
                            }}
                          ></div>
                          <span style={{ fontSize: 13, color: "#555" }}>
                            {s.label}
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 12,
                              color: "rgba(255,255,255,0.35)",
                            }}
                          >
                            {pct}٪
                          </span>
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: "#1a1a1a",
                              minWidth: 20,
                              textAlign: "left",
                            }}
                          >
                            {count}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Chart + Reviews */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.4fr 1fr",
                  gap: 20,
                }}
              >
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 16,
                    padding: 22,
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
                      gap: 10,
                      height: 140,
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
                            width: "100%",
                            background:
                              "linear-gradient(180deg,#2ECC71,#1a8a40)",
                            borderRadius: 6,
                            height: `${(v / 250) * 130}px`,
                            minHeight: 4,
                          }}
                        ></div>
                        <span
                          style={{
                            fontSize: 10,
                            color: "#aaa",
                            whiteSpace: "nowrap",
                          }}
                        >
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
                    padding: 22,
                    border: "1px solid #eef0f3",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 16,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: "#1a1a1a",
                      }}
                    >
                      گزارش‌های اخیر
                    </span>
                    <button
                      onClick={() => setActive("users")}
                      style={{
                        fontSize: 12,
                        color: "#2ECC71",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "Vazirmatn",
                      }}
                    >
                      همه
                    </button>
                  </div>
                  {allReviews.length === 0 ? (
                    <p
                      style={{
                        color: "#aaa",
                        fontSize: 13,
                        textAlign: "center",
                        padding: "20px 0",
                      }}
                    >
                      هنوز نظری ثبت نشده
                    </p>
                  ) : (
                    allReviews.slice(0, 4).map((r, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          gap: 12,
                          paddingBottom: 12,
                          marginBottom: 12,
                          borderBottom: "1px solid #f5f7fa",
                        }}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            background: "#EBF5FB",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Users size={15} color="#3498DB" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              marginBottom: 2,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: "#1a1a1a",
                              }}
                            >
                              {r.user || r.userName || r.user_name}
                            </span>
                            <div style={{ display: "flex", gap: 1 }}>
                              {[1, 2, 3, 4, 5].map((n) => (
                                <Star
                                  key={n}
                                  size={11}
                                  color="#F39C12"
                                  fill={n <= r.rating ? "#F39C12" : "none"}
                                />
                              ))}
                            </div>
                          </div>
                          <p
                            style={{
                              fontSize: 12,
                              color: "#666",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {r.text}
                          </p>
                          <p
                            style={{
                              fontSize: 11,
                              color: "#aaa",
                              marginTop: 2,
                            }}
                          >
                            {r.stationName}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
  );
}
