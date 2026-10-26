import { useEffect, useMemo, useState } from "react";
import {
  MapPin,
  X,
  CheckCircle,
  ClipboardList,
  ThumbsUp,
  ThumbsDown,
  Trash2,
} from "lucide-react";
import {
  approveStationReport,
  deleteStationReport,
  fetchStationReports,
  rejectStationReport,
} from "../../api";
import StatCard from "./StatCard";
import useIsMobile from "./useIsMobile";
import { missingReportFields } from "../../lib/stationReportFields";
import { membershipLabel } from "../../lib/membership";

export default function StationReportsPanel({ setStations }) {
  const isMobile = useIsMobile();
  const [stationReports, setStationReports] = useState([]);
  const [srLoading, setSrLoading] = useState(false);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [kindFilter, setKindFilter] = useState("all");

  useEffect(() => {
    setSrLoading(true);
    fetchStationReports()
      .then(setStationReports)
      .finally(() => setSrLoading(false));
  }, []);

  const visibleReports = useMemo(() => {
    if (kindFilter === "home") return stationReports.filter((report) => report.isHome);
    if (kindFilter === "public") return stationReports.filter((report) => !report.isHome);
    return stationReports;
  }, [stationReports, kindFilter]);

  const handleApproveReport = async (report) => {
    try {
      const result = await approveStationReport(report.id);
      if (result?.station) {
        setStations((prev) => [
          result.station,
          ...prev.filter((station) => station.id !== result.station.id),
        ]);
      }
      setStationReports((prev) =>
        prev.map((item) =>
          item.id === report.id
            ? { ...item, ...result, station: undefined, status: "approved" }
            : item,
        ),
      );
      alert(
        report.isHome
          ? `✅ ایستگاه خانگی «${report.name}» تأیید شد و در بخش «شارژرها» قرار گرفت`
          : `✅ ایستگاه «${report.name}» تأیید و به لیست ایستگاه‌ها اضافه شد`,
      );
    } catch (err) {
      alert(err.message || "تأیید گزارش ناموفق بود");
    }
  };

  const handleDeleteReport = async (report) => {
    if (
      !window.confirm(
        `گزارش «${report.name}» برای همیشه از پایگاه داده حذف شود؟ خود ایستگاه تأییدشده، اگر ساخته شده باشد، باقی می‌ماند.`,
      )
    ) {
      return;
    }
    try {
      await deleteStationReport(report.id);
      setStationReports((prev) => prev.filter((item) => item.id !== report.id));
    } catch (err) {
      alert(err.message || "حذف گزارش ناموفق بود");
    }
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
                      gridTemplateColumns: isMobile ? "repeat(2,minmax(0,1fr))" : "repeat(3,1fr)",
                      gap: isMobile ? 10 : 16,
                      marginBottom: isMobile ? 14 : 24,
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

                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      marginBottom: isMobile ? 12 : 16,
                      flexWrap: "wrap",
                    }}
                  >
                    {[
                      { key: "all", label: "همه" },
                      { key: "public", label: "عمومی" },
                      { key: "home", label: "خانگی" },
                    ].map((item) => {
                      const on = kindFilter === item.key;
                      const count =
                        item.key === "home"
                          ? stationReports.filter((report) => report.isHome).length
                          : item.key === "public"
                            ? stationReports.filter((report) => !report.isHome).length
                            : stationReports.length;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setKindFilter(item.key)}
                          style={{
                            border: on ? "1.5px solid #2ECC71" : "1px solid #e5e7eb",
                            background: on ? "#e8faf0" : "#fff",
                            color: on ? "#1a7a40" : "#666",
                            borderRadius: 12,
                            padding: "8px 14px",
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: "pointer",
                            fontFamily: "Vazirmatn",
                          }}
                        >
                          {item.label} ({count.toLocaleString("fa-IR")})
                        </button>
                      );
                    })}
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
                          maxHeight: "90vh",
                          overflowY: "auto",
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
                  {!srLoading && visibleReports.length === 0 && (
                    <div
                      style={{
                        textAlign: "center",
                        padding: isMobile ? 36 : 60,
                        background: "#f5f7fa",
                        borderRadius: 16,
                        border: "1px solid #eef0f3",
                      }}
                    >
                      <ClipboardList
                        size={40}
                        color="#ddd"
                        style={{ margin: "0 auto 12px" }}
                      />
                      <p style={{ color: "#aaa", fontSize: 14 }}>
                        {stationReports.length === 0
                          ? "هنوز گزارشی ثبت نشده"
                          : "در این فیلتر گزارشی نیست"}
                      </p>
                    </div>
                  )}

                  {!srLoading && visibleReports.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: isMobile ? 12 : 16,
                      }}
                    >
                      {visibleReports.map((report) => {
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
                                padding: isMobile ? "12px 14px" : "14px 18px",
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
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    flexWrap: "wrap",
                                    gap: 8,
                                    marginBottom: 4,
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: 15,
                                      fontWeight: 700,
                                      color: "#1a1a1a",
                                      minWidth: 0,
                                    }}
                                  >
                                    {report.name}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: 10,
                                      background: report.isHome
                                        ? "#FFF6E0"
                                        : "#EBF5FB",
                                      color: report.isHome ? "#8C5E08" : "#2980B9",
                                      padding: "2px 8px",
                                      borderRadius: 20,
                                    }}
                                  >
                                    {report.isHome
                                      ? "ایستگاه خانگی ← شارژرها"
                                      : "ایستگاه معمولی"}
                                  </span>
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
                                <div style={{ fontSize: 12, color: "#555", lineHeight: 1.8 }}>
                                  ثبت‌کننده:{" "}
                                  <b>{report.reporterName || "کاربر حذف‌شده"}</b>
                                  {report.reporterMembership
                                    ? ` · اشتراک ${membershipLabel(report.reporterMembership)}`
                                    : ""}
                                  <br />
                                  تاریخ ثبت:{" "}
                                  {report.createdAt
                                    ? new Date(report.createdAt).toLocaleString("fa-IR")
                                    : "—"}
                                  {report.city ? ` · ${report.city}` : ""}
                                </div>
                              </div>
                            </div>

                            {/* جزئیات کامل برای بررسی ادمین */}
                            <div style={{ padding: isMobile ? "12px 14px" : "14px 18px" }}>
                              {(() => {
                                const missing = missingReportFields(report);
                                if (!missing.length) return null;
                                return (
                                  <div
                                    style={{
                                      fontSize: 12,
                                      color: "#B45309",
                                      background: "#FEF3C7",
                                      border: "1px solid #FDE68A",
                                      borderRadius: 10,
                                      padding: "8px 10px",
                                      marginBottom: 12,
                                      lineHeight: 1.8,
                                    }}
                                  >
                                    ⚠️ فیلدهای ناقص: {missing.join("، ")}
                                  </div>
                                );
                              })()}

                              {report.image && (
                                <a
                                  href={report.image}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{ display: "block", marginBottom: 12 }}
                                >
                                  <img
                                    src={report.image}
                                    alt={report.name}
                                    style={{
                                      width: "100%",
                                      maxHeight: 220,
                                      objectFit: "cover",
                                      borderRadius: 12,
                                      display: "block",
                                    }}
                                  />
                                </a>
                              )}

                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: isMobile
                                    ? "repeat(2,minmax(0,1fr))"
                                    : "repeat(4,minmax(0,1fr))",
                                  gap: 8,
                                  marginBottom: 12,
                                }}
                              >
                                {[
                                  { label: "نام ایستگاه", value: report.name },
                                  { label: "شهر", value: report.city },
                                  { label: "ساعت کاری", value: report.hours },
                                  { label: "نوع شارژر", value: report.type },
                                  { label: "کانکتور", value: report.connector },
                                  {
                                    label: "توان",
                                    value: report.power ? `${report.power} kW` : "",
                                  },
                                  { label: "تعداد پورت", value: report.ports },
                                  {
                                    label: "قیمت هر kWh",
                                    value: report.isFree
                                      ? "رایگان"
                                      : report.price
                                        ? /^\d+$/.test(String(report.price))
                                          ? `${Number(report.price).toLocaleString("fa-IR")} تومان`
                                          : report.price
                                        : "",
                                  },
                                  {
                                    label: "عرض جغرافیایی",
                                    value: report.lat,
                                    ltr: true,
                                  },
                                  {
                                    label: "طول جغرافیایی",
                                    value: report.lng,
                                    ltr: true,
                                  },
                                  {
                                    label: "گزارش‌دهنده",
                                    value: report.reporterName,
                                    optional: true,
                                  },
                                  {
                                    label: "اشتراک گزارش‌دهنده",
                                    value: report.reporterMembership
                                      ? membershipLabel(report.reporterMembership)
                                      : "",
                                    optional: true,
                                  },
                                ].map((item) => {
                                  const empty =
                                    item.value === undefined ||
                                    item.value === null ||
                                    String(item.value).trim() === "";
                                  return (
                                    <div
                                      key={item.label}
                                      style={{
                                        background: "#fff",
                                        border: "1px solid #eef0f3",
                                        borderRadius: 8,
                                        padding: "8px 8px",
                                        textAlign: "center",
                                        minWidth: 0,
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
                                          color:
                                            empty && !item.optional
                                              ? "#E74C3C"
                                              : "#1a1a1a",
                                          direction: item.ltr ? "ltr" : "rtl",
                                          wordBreak: "break-word",
                                        }}
                                      >
                                        {empty ? "—" : item.value}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              <div
                                style={{
                                  fontSize: 12,
                                  color: report.address ? "#666" : "#E74C3C",
                                  marginBottom: 8,
                                  lineHeight: 1.8,
                                }}
                              >
                                <MapPin
                                  size={12}
                                  style={{ display: "inline", marginLeft: 4 }}
                                />
                                <b style={{ color: "#888", fontWeight: 600 }}>
                                  آدرس:{" "}
                                </b>
                                {report.address || "—"}
                              </div>

                              <div
                                style={{
                                  fontSize: 12,
                                  color:
                                    report.notes || report.ownerNote
                                      ? "#666"
                                      : "#E74C3C",
                                  background: "#fff",
                                  border: "1px solid #eef0f3",
                                  borderRadius: 8,
                                  padding: "8px 10px",
                                  marginBottom: 10,
                                  lineHeight: 1.8,
                                }}
                              >
                                <b style={{ color: "#888", fontWeight: 600 }}>
                                  توضیحات:{" "}
                                </b>
                                {report.notes || report.ownerNote || "—"}
                              </div>

                              <div style={{ fontSize: 11, color: "#aaa" }}>
                                تاریخ ثبت:{" "}
                                {report.createdAt
                                  ? new Date(report.createdAt).toLocaleString(
                                      "fa-IR",
                                    )
                                  : "—"}
                              </div>

                              {/* دکمه‌های عملیات */}
                              {report.status === "pending" && (
                                <div
                                  style={{
                                    display: "flex",
                                    gap: 8,
                                    flexWrap: "wrap",
                                    marginTop: 12,
                                  }}
                                >
                                  <button
                                    onClick={() => handleApproveReport(report)}
                                    style={{
                                      flex: "1 1 140px",
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
                                      flex: "1 1 140px",
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
                                    gap: 8,
                                    marginTop: 8,
                                    flexWrap: "wrap",
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 6,
                                      color: "#2ECC71",
                                      fontSize: 12,
                                    }}
                                  >
                                    <CheckCircle size={14} /> ایستگاه تأیید و
                                    اضافه شده
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteReport(report)}
                                    style={{
                                      marginRight: "auto",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 6,
                                      padding: "8px 12px",
                                      background: "#fef2f2",
                                      color: "#E74C3C",
                                      border: "1px solid #fecaca",
                                      borderRadius: 10,
                                      fontSize: 12,
                                      fontWeight: 700,
                                      cursor: "pointer",
                                      fontFamily: "Vazirmatn",
                                    }}
                                  >
                                    <Trash2 size={14} /> حذف گزارش
                                  </button>
                                </div>
                              )}

                              {report.status === "rejected" && (
                                <div style={{ marginTop: 8 }}>
                                  <div
                                    style={{
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
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteReport(report)}
                                    style={{
                                      marginTop: 8,
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 6,
                                      padding: "8px 12px",
                                      background: "#fef2f2",
                                      color: "#E74C3C",
                                      border: "1px solid #fecaca",
                                      borderRadius: 10,
                                      fontSize: 12,
                                      fontWeight: 700,
                                      cursor: "pointer",
                                      fontFamily: "Vazirmatn",
                                    }}
                                  >
                                    <Trash2 size={14} /> حذف گزارش
                                  </button>
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
