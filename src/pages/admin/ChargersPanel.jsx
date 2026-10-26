import { useEffect, useMemo, useState } from "react";
import {
  Home,
  Search,
  Trash2,
  Eye,
  EyeOff,
  MapPin,
  Clock,
  Zap,
  Wrench,
  User,
} from "lucide-react";
import {
  deleteHomeStation,
  fetchHomeStations,
  updateHomeStation,
  storageUrl,
} from "../../api";
import { isHomeStation } from "../../lib/homeStations";
import StatCard from "./StatCard";
import useIsMobile from "./useIsMobile";

const TABS = [
  { key: "home", label: "شارژرهای خانگی کاربران", Icon: Home },
  { key: "future", label: "مدیریت پیشرفته", Icon: Wrench },
];

function InfoCell({ label, value, ltr = false }) {
  const empty = value === undefined || value === null || String(value) === "";
  return (
    <div
      style={{
        background: "#f8f9fb",
        border: "1px solid #eef0f3",
        borderRadius: 8,
        padding: "8px 8px",
        textAlign: "center",
        minWidth: 0,
      }}
    >
      <div style={{ fontSize: 10, color: "#aaa", marginBottom: 3 }}>{label}</div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: empty ? "#E74C3C" : "#1a1a1a",
          direction: ltr ? "ltr" : "rtl",
          wordBreak: "break-word",
        }}
      >
        {empty ? "—" : value}
      </div>
    </div>
  );
}

/**
 * شارژرها
 *  - بخش اول: ایستگاه‌های خانگی که کاربران پرو/پلاس در اختیار عموم گذاشته‌اند
 *    (بعد از تأیید ادمین در «ایستگاه‌های گزارش‌شده» اینجا قرار می‌گیرند)
 *  - بخش دوم: جای قابلیت‌های آینده
 */
export default function ChargersPanel({ setStations }) {
  const isMobile = useIsMobile();
  const [tab, setTab] = useState("home");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [homeStations, setHomeStations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetchHomeStations()
      .then((list) => {
        if (!alive) return;
        setHomeStations(list);
        setStations((prev) => {
          const others = (prev || []).filter((station) => !isHomeStation(station));
          return [...list, ...others];
        });
      })
      .catch(() => {
        if (alive) setHomeStations([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [setStations]);

  const filtered = useMemo(() => {
    const q = search.trim();
    if (!q) return homeStations;
    return homeStations.filter((s) =>
      [s.name, s.city, s.address, s.ownerName]
        .filter(Boolean)
        .some((v) => String(v).includes(q)),
    );
  }, [homeStations, search]);

  const activeCount = homeStations.filter((s) => s.isActive !== false).length;
  const ownersCount = new Set(
    homeStations.map((s) => s.ownerId ?? s.ownerName).filter(Boolean),
  ).size;

  const handleToggleActive = async (station) => {
    setBusyId(station.id);
    try {
      const updated = await updateHomeStation(station.id, {
        isActive: station.isActive === false,
      });
      const nextActive = station.isActive === false;
      const next = { ...station, ...updated, isActive: nextActive };
      setHomeStations((prev) => prev.map((s) => (s.id === station.id ? next : s)));
      setStations((prev) => prev.map((s) => (s.id === station.id ? { ...s, ...next } : s)));
    } catch (err) {
      alert(err.message || "خطا در تغییر وضعیت نمایش");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (station) => {
    if (!window.confirm(`ایستگاه خانگی «${station.name}» حذف شود؟`)) return;
    setBusyId(station.id);
    try {
      await deleteHomeStation(station.id);
      setHomeStations((prev) => prev.filter((s) => s.id !== station.id));
      setStations((prev) => prev.filter((s) => s.id !== station.id));
    } catch (err) {
      alert(err.message || "خطا در حذف ایستگاه");
    } finally {
      setBusyId(null);
    }
  };

  const priceText = (s) =>
    s.isFree
      ? "رایگان"
      : s.pricePerKwh
        ? /^\d+$/.test(String(s.pricePerKwh))
          ? `${Number(s.pricePerKwh).toLocaleString("fa-IR")} تومان`
          : s.pricePerKwh
        : "";

  return (
    <div style={{ fontFamily: "Vazirmatn" }}>
      {/* تب‌ها */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: isMobile ? 12 : 20,
          flexWrap: "wrap",
        }}
      >
        {TABS.map(({ key, label, Icon }) => {
          const on = tab === key;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "9px 16px",
                borderRadius: 12,
                border: on ? "1.5px solid #2ECC71" : "1px solid #e5e7eb",
                background: on ? "#e8faf0" : "#fff",
                color: on ? "#1a7a40" : "#666",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "Vazirmatn",
              }}
            >
              <Icon size={15} />
              {label}
              {key === "home" && (
                <span
                  style={{
                    background: on ? "#2ECC71" : "#e5e7eb",
                    color: on ? "#fff" : "#666",
                    borderRadius: 20,
                    fontSize: 11,
                    padding: "1px 8px",
                  }}
                >
                  {homeStations.length.toLocaleString("fa-IR")}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {tab === "home" && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile
                ? "repeat(2,minmax(0,1fr))"
                : "repeat(3,minmax(0,1fr))",
              gap: isMobile ? 10 : 16,
              marginBottom: isMobile ? 14 : 24,
            }}
          >
            <StatCard
              label="شارژر خانگی"
              value={homeStations.length}
              sub="تأییدشده"
              subUp
              Icon={Home}
              color="#F0B429"
              bg="#FFF6E0"
            />
            <StatCard
              label="نمایش‌داده‌شده روی نقشه"
              value={activeCount}
              sub="برای پرو و پلاس"
              subUp
              Icon={Eye}
              color="#27AE60"
              bg="#e8faf0"
            />
            <StatCard
              label="صاحبان شارژر"
              value={ownersCount}
              sub="کاربر"
              subUp
              Icon={User}
              color="#3498DB"
              bg="#EBF5FB"
            />
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
                padding: isMobile ? 14 : "18px 22px",
                borderBottom: "1px solid #f5f7fa",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a" }}>
                  شارژرهای خانگی کاربران
                </div>
                <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>
                  ایستگاه‌هایی که کاربران پرو و پلاس در اختیار عموم گذاشته‌اند
                </div>
              </div>
              <div
                style={{
                  position: "relative",
                  flex: isMobile ? "1 1 100%" : "0 0 auto",
                }}
              >
                <Search
                  size={14}
                  color="#aaa"
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                  }}
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="جستجوی نام، شهر، آدرس، صاحب..."
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 10,
                    padding: "8px 32px 8px 12px",
                    fontSize: 12,
                    fontFamily: "Vazirmatn",
                    outline: "none",
                    width: isMobile ? "100%" : 260,
                    background: "#f8f9fb",
                  }}
                />
              </div>
            </div>

            {loading ? (
              <div style={{ padding: 40, textAlign: "center", color: "#888" }}>
                در حال بارگذاری شارژرهای خانگی...
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: isMobile ? 36 : 60, textAlign: "center" }}>
                <Home size={40} color="#ddd" style={{ margin: "0 auto 12px" }} />
                <div style={{ fontSize: 14, color: "#888" }}>
                  {homeStations.length === 0
                    ? "هنوز شارژر خانگی تأییدشده‌ای وجود ندارد"
                    : "موردی با این جستجو پیدا نشد"}
                </div>
                {homeStations.length === 0 && (
                  <div style={{ fontSize: 12, color: "#aaa", marginTop: 6 }}>
                    وقتی ایستگاه خانگی را در «ایستگاه‌های گزارش‌شده» تأیید کنید،
                    اینجا نمایش داده می‌شود
                  </div>
                )}
              </div>
            ) : (
              <div>
                {filtered.map((s) => {
                  const active = s.isActive !== false;
                  const img = s.image1 || s.image;
                  return (
                    <div
                      key={s.id}
                      style={{
                        padding: isMobile ? 14 : "18px 22px",
                        borderTop: "1px solid #f5f7fa",
                        opacity: busyId === s.id ? 0.6 : 1,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: 12,
                          alignItems: "flex-start",
                        }}
                      >
                        <div
                          style={{
                            width: isMobile ? 56 : 72,
                            height: isMobile ? 56 : 72,
                            borderRadius: 12,
                            overflow: "hidden",
                            background: "#FFF6E0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {img ? (
                            <img
                              src={storageUrl(img)}
                              alt=""
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <Home size={24} color="#F0B429" />
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              flexWrap: "wrap",
                              gap: 8,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 15,
                                fontWeight: 700,
                                color: "#1a1a1a",
                              }}
                            >
                              {s.name}
                            </span>
                            <span
                              style={{
                                fontSize: 11,
                                padding: "2px 10px",
                                borderRadius: 20,
                                fontWeight: 600,
                                background: active ? "#e8faf0" : "#f0f0f0",
                                color: active ? "#27AE60" : "#95a5a6",
                              }}
                            >
                              {active ? "نمایش روی نقشه" : "مخفی"}
                            </span>
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: "#888",
                              marginTop: 4,
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "4px 14px",
                            }}
                          >
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <User size={12} />
                              {s.ownerName || "—"}
                            </span>
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <MapPin size={12} />
                              {s.city || "—"}
                            </span>
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <Clock size={12} />
                              {s.hours || "—"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: isMobile
                            ? "repeat(2,minmax(0,1fr))"
                            : "repeat(4,minmax(0,1fr))",
                          gap: 8,
                          marginTop: 12,
                        }}
                      >
                        <InfoCell label="نوع شارژر" value={s.type} />
                        <InfoCell label="کانکتور" value={s.connectors || s.connector} />
                        <InfoCell
                          label="توان"
                          value={s.maxPower || s.power ? `${s.maxPower || s.power} kW` : ""}
                        />
                        <InfoCell label="تعداد پورت" value={s.ports} />
                        <InfoCell label="قیمت هر kWh" value={priceText(s)} />
                        <InfoCell label="عرض جغرافیایی" value={s.lat} ltr />
                        <InfoCell label="طول جغرافیایی" value={s.lng} ltr />
                        <InfoCell label="شهر" value={s.city} />
                      </div>

                      <div
                        style={{
                          fontSize: 12,
                          color: s.address ? "#666" : "#E74C3C",
                          marginTop: 10,
                          lineHeight: 1.8,
                        }}
                      >
                        <b style={{ color: "#888", fontWeight: 600 }}>آدرس: </b>
                        {s.address || "—"}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: s.description ? "#666" : "#E74C3C",
                          marginTop: 4,
                          lineHeight: 1.8,
                        }}
                      >
                        <b style={{ color: "#888", fontWeight: 600 }}>توضیحات: </b>
                        {s.description || "—"}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          flexWrap: "wrap",
                          marginTop: 12,
                        }}
                      >
                        <button
                          onClick={() => handleToggleActive(s)}
                          disabled={busyId === s.id}
                          style={{
                            flex: isMobile ? "1 1 140px" : "0 0 auto",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                            padding: "9px 16px",
                            borderRadius: 10,
                            border: "1px solid #e5e7eb",
                            background: "#fff",
                            color: "#444",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            fontFamily: "Vazirmatn",
                          }}
                        >
                          {active ? <EyeOff size={14} /> : <Eye size={14} />}
                          {active ? "مخفی کردن از نقشه" : "نمایش روی نقشه"}
                        </button>
                        <button
                          onClick={() => handleDelete(s)}
                          disabled={busyId === s.id}
                          style={{
                            flex: isMobile ? "1 1 100px" : "0 0 auto",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                            padding: "9px 16px",
                            borderRadius: 10,
                            border: "1px solid #fecaca",
                            background: "#fef2f2",
                            color: "#E74C3C",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            fontFamily: "Vazirmatn",
                          }}
                        >
                          <Trash2 size={14} />
                          حذف
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {tab === "future" && (
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            border: "1.5px dashed #d5d9df",
            padding: isMobile ? 32 : 60,
            textAlign: "center",
          }}
        >
          <Zap size={44} color="#ddd" style={{ margin: "0 auto 16px" }} />
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#1a1a1a",
              marginBottom: 8,
            }}
          >
            به‌زودی اضافه می‌شود
          </h2>
          <p style={{ fontSize: 13, color: "#888", lineHeight: 2 }}>
            این بخش برای قابلیت‌های آینده‌ی مدیریت شارژرها رزرو شده است.
          </p>
          {/* TODO: قابلیت‌های آینده‌ی مدیریت شارژرها در این بخش اضافه شود */}
        </div>
      )}
    </div>
  );
}
