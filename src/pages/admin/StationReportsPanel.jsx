import { useEffect, useState } from "react";
import {
  MapPin,
  X,
  CheckCircle,
  ClipboardList,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import {
  approveStationReport,
  createStation,
  fetchStationReports,
  rejectStationReport,
} from "../../api";
import StatCard from "./StatCard";

export default function StationReportsPanel({ setStations }) {
  const [stationReports, setStationReports] = useState([]);
  const [srLoading, setSrLoading] = useState(false);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    setSrLoading(true);
    fetchStationReports()
      .then(setStationReports)
      .finally(() => setSrLoading(false));
  }, []);

  const handleApproveReport = async (report) => {
    await approveStationReport(report.id);
    try {
      const type =
        report.type === "DC" ? "DC" : report.type === "AC/DC" ? "AC/DC" : "AC";
      const ports = report.ports || 1;
      const newStation = await createStation({
        name: report.name,
        city: report.city || "نامشخص",
        address: report.address || "نامشخص",
        lat: report.lat ?? 35.6892,
        lng: report.lng ?? 51.389,
        type,
        connector: report.connector || "Type2",
        connectors: report.connector || "Type2",
        power: report.power || 22,
        maxPower: String(report.power || 22),
        ports,
        acPorts:
          type === "DC"
            ? 0
            : type === "AC/DC"
              ? Math.max(1, Math.floor(ports / 2))
              : ports,
        dcPorts:
          type === "AC"
            ? 0
            : type === "AC/DC"
              ? Math.max(1, ports - Math.floor(ports / 2))
              : ports,
        status: "available",
        isOwnerStation: true,
        pricePerKwh: report.price || null,
        hours: report.hours || "۲۴ ساعته",
      });
      setStations((prev) => [newStation, ...prev]);
    } catch (err) {
      alert(err.message || "تأیید گزارش انجام شد ولی ساخت ایستگاه ناموفق بود");
    }
    setStationReports((prev) =>
      prev.map((r) => (r.id === report.id ? { ...r, status: "approved" } : r)),
    );
    alert(`✅ ایستگاه «${report.name}» تأیید و به لیست اضافه شد`);
  };

  const handleRejectReport = async () => {
    if (!rejectModal) return;
    await rejectStationReport(rejectModal, rejectReason);
    setStationReports((prev) =>
      prev.map((r) =>
        r.id === rejectModal ? { ...r, status: "rejected" } : r,
      ),
    );
    setRejectModal(null);
    setRejectReason("");
  };

              const pending = stationReports.filter(
                (r) => r.status === "pending",
              );
              const approved = stationReports.filter(
                (r) => r.status === "approved",
              );
              const rejected = stationReports.filter(
                (r) => r.status === "rejected",
              );
              const STATUS_BADGE = {
                pending: {
                  bg: "#fef9e7",
                  color: "#D97706",
                  label: "در انتظار بررسی",
                },
                approved: {
                  bg: "#e8faf0",
                  color: "#27AE60",
                  label: "تأیید شده",
                },
                rejected: { bg: "#fef2f2", color: "#E74C3C", label: "رد شده" },
              };
              return (
                <>
                  {/* آمار */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3,1fr)",
                      gap: 16,
                      marginBottom: 24,
                    }}
                  >
                    <StatCard
                      label="در انتظار بررسی"
                      value={pending.length}
                      sub="گزارش جدید"
                      subUp
                      Icon={ClipboardList}
                      color="#D97706"
                      bg="#fef9e7"
                    />
                    <StatCard
                      label="تأیید شده"
                      value={approved.length}
                      sub="اضافه به لیست"
                      subUp
                      Icon={CheckCircle}
                      color="#27AE60"
                      bg="#e8faf0"
                    />
                    <StatCard
                      label="رد شده"
                      value={rejected.length}
                      sub="گزارش"
                      subUp={false}
                      Icon={X}
                      color="#E74C3C"
                      bg="#fef2f2"
                    />
                  </div>

                  {srLoading && (
                    <div
                      style={{
                        textAlign: "center",
                        padding: 40,
                        color: "#888",
                      }}
                    >
                      در حال بارگذاری...
                    </div>
                  )}

                  {/* modal رد کردن */}
                  {rejectModal && (
                    <div
                      style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.5)",
                        zIndex: 9999,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 16,
                      }}
                    >
                      <div
                        style={{
                          background: "#1a2035",
                          borderRadius: 16,
                          padding: 24,
                          width: "100%",
                          maxWidth: 400,
                          border: "1px solid rgba(255,255,255,0.1)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 15,
                            fontWeight: 700,
                            color: "#fff",
                            marginBottom: 12,
                          }}
                        >
                          دلیل رد گزارش
                        </div>
                        <textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="دلیل رد شدن را بنویسید (اختیاری)..."
                          rows={3}
                          style={{
                            width: "100%",
                            borderRadius: 10,
                            border: "1px solid rgba(255,255,255,0.12)",
                            background: "rgba(255,255,255,0.06)",
                            color: "#fff",
                            padding: "10px 12px",
                            fontSize: 13,
                            fontFamily: "Vazirmatn",
                            outline: "none",
                            resize: "none",
                            boxSizing: "border-box",
                          }}
                        />
                        <div
                          style={{ display: "flex", gap: 10, marginTop: 16 }}
                        >
                          <button
                            onClick={handleRejectReport}
                            style={{
                              flex: 1,
                              padding: "10px",
                              background: "#E74C3C",
                              color: "#fff",
                              border: "none",
                              borderRadius: 10,
                              fontSize: 13,
                              fontWeight: 700,
                              cursor: "pointer",
                              fontFamily: "Vazirmatn",
                            }}
                          >
                            رد کردن
                          </button>
                          <button
                            onClick={() => {
                              setRejectModal(null);
                              setRejectReason("");
                            }}
                            style={{
                              flex: 1,
                              padding: "10px",
                              background: "rgba(255,255,255,0.08)",
                              color: "#fff",
                              border: "none",
                              borderRadius: 10,
                              fontSize: 13,
                              cursor: "pointer",
                              fontFamily: "Vazirmatn",
                            }}
                          >
                            انصراف
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* لیست گزارش‌ها */}
                  {!srLoading && stationReports.length === 0 && (
                    <div
                      style={{
                        textAlign: "center",
                        padding: 60,
                        background: "#f5f7fa",
                        borderRadius: 16,
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <ClipboardList
                        size={40}
                        color="rgba(255,255,255,0.15)"
                        style={{ margin: "0 auto 12px" }}
                      />
                      <p style={{ color: "#aaa", fontSize: 14 }}>
                        هنوز گزارشی ثبت نشده
                      </p>
                    </div>
                  )}

                  {!srLoading && stationReports.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                      }}
                    >
                      {stationReports.map((report) => {
                        const badge =
                          STATUS_BADGE[report.status] || STATUS_BADGE.pending;
                        return (
                          <div
                            key={report.id}
                            style={{
                              background: "#f8f9fb",
                              borderRadius: 16,
                              border: "1px solid #eef0f3",
                              overflow: "hidden",
                            }}
                          >
                            {/* هدر کارت */}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                padding: "14px 18px",
                                borderBottom: "1px solid #f5f7fa",
                              }}
                            >
                              {report.image && (
                                <img
                                  src={report.image}
                                  alt=""
                                  style={{
                                    width: 52,
                                    height: 52,
                                    borderRadius: 10,
                                    objectFit: "cover",
                                    flexShrink: 0,
                                  }}
                                />
                              )}
                              <div style={{ flex: 1 }}>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    marginBottom: 4,
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: 15,
                                      fontWeight: 700,
                                      color: "#1a1a1a",
                                    }}
                                  >
                                    {report.name}
                                  </span>
                                  {report.isHome && (
                                    <span
                                      style={{
                                        fontSize: 10,
                                        background: "rgba(52,152,219,0.2)",
                                        color: "#3498DB",
                                        padding: "2px 8px",
                                        borderRadius: 20,
                                        border:
                                          "1px solid rgba(52,152,219,0.3)",
                                      }}
                                    >
                                      خانگی
                                    </span>
                                  )}
                                  <span
                                    style={{
                                      fontSize: 11,
                                      padding: "2px 10px",
                                      borderRadius: 20,
                                      fontWeight: 600,
                                      background: badge.bg,
                                      color: badge.color,
                                      marginRight: "auto",
                                    }}
                                  >
                                    {badge.label}
                                  </span>
                                </div>
                                <div style={{ fontSize: 12, color: "#888" }}>
                                  {report.city} · گزارش از:{" "}
                                  {report.reporterName || "—"} ·{" "}
                                  {new Date(
                                    report.createdAt,
                                  ).toLocaleDateString("fa-IR")}
                                </div>
                              </div>
                            </div>

                            {/* جزئیات */}
                            <div style={{ padding: "14px 18px" }}>
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "repeat(4,1fr)",
                                  gap: 8,
                                  marginBottom: 12,
                                }}
                              >
                                {[
                                  { label: "نوع", value: report.type },
                                  { label: "کانکتور", value: report.connector },
                                  {
                                    label: "توان",
                                    value: `${report.power || "—"}kW`,
                                  },
                                  { label: "پورت", value: report.ports || "—" },
                                ].map((item) => (
                                  <div
                                    key={item.label}
                                    style={{
                                      background: "#f8f9fb",
                                      borderRadius: 8,
                                      padding: "8px 6px",
                                      textAlign: "center",
                                    }}
                                  >
                                    <div
                                      style={{
                                        fontSize: 10,
                                        color: "#aaa",
                                        marginBottom: 3,
                                      }}
                                    >
                                      {item.label}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: "rgba(255,255,255,0.8)",
                                      }}
                                    >
                                      {item.value}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <div
                                style={{
                                  fontSize: 12,
                                  color: "rgba(255,255,255,0.5)",
                                  marginBottom: 6,
                                }}
                              >
                                <MapPin
                                  size={12}
                                  style={{ display: "inline", marginLeft: 4 }}
                                />
                                {report.address}
                              </div>

                              {report.lat && report.lng && (
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: "#aaa",
                                    marginBottom: 6,
                                    direction: "ltr",
                                  }}
                                >
                                  📍 {report.lat}, {report.lng}
                                </div>
                              )}

                              {(report.notes || report.ownerNote) && (
                                <div
                                  style={{
                                    fontSize: 12,
                                    color: "rgba(255,255,255,0.5)",
                                    background: "#f8f9fb",
                                    borderRadius: 8,
                                    padding: "8px 10px",
                                    marginBottom: 10,
                                  }}
                                >
                                  💬 {report.notes || report.ownerNote}
                                </div>
                              )}

                              {/* دکمه‌های عملیات */}
                              {report.status === "pending" && (
                                <div
                                  style={{
                                    display: "flex",
                                    gap: 8,
                                    marginTop: 12,
                                  }}
                                >
                                  <button
                                    onClick={() => handleApproveReport(report)}
                                    style={{
                                      flex: 1,
                                      padding: "10px",
                                      background: "rgba(46,204,113,0.2)",
                                      color: "#2ECC71",
                                      border:
                                        "1.5px solid rgba(46,204,113,0.4)",
                                      borderRadius: 10,
                                      fontSize: 13,
                                      fontWeight: 700,
                                      cursor: "pointer",
                                      fontFamily: "Vazirmatn",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      gap: 6,
                                    }}
                                  >
                                    <ThumbsUp size={15} /> تأیید و اضافه کردن
                                  </button>
                                  <button
                                    onClick={() => setRejectModal(report.id)}
                                    style={{
                                      flex: 1,
                                      padding: "10px",
                                      background: "rgba(231,76,60,0.15)",
                                      color: "#E74C3C",
                                      border: "1.5px solid rgba(231,76,60,0.3)",
                                      borderRadius: 10,
                                      fontSize: 13,
                                      fontWeight: 700,
                                      cursor: "pointer",
                                      fontFamily: "Vazirmatn",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      gap: 6,
                                    }}
                                  >
                                    <ThumbsDown size={15} /> رد کردن
                                  </button>
                                </div>
                              )}

                              {report.status === "approved" && (
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    marginTop: 8,
                                    color: "#2ECC71",
                                    fontSize: 12,
                                  }}
                                >
                                  <CheckCircle size={14} /> ایستگاه تأیید و
                                  اضافه شده
                                </div>
                              )}

                              {report.status === "rejected" && (
                                <div
                                  style={{
                                    marginTop: 8,
                                    color: "#E74C3C",
                                    fontSize: 12,
                                  }}
                                >
                                  <X
                                    size={14}
                                    style={{ display: "inline", marginLeft: 4 }}
                                  />
                                  رد شده
                                  {report.rejectReason && (
                                    <span
                                      style={{ color: "#888", marginRight: 6 }}
                                    >
                                      · {report.rejectReason}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              );
}
