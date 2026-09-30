import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  MapPin,
  Zap,
  Clock,
  DollarSign,
  Star,
  Navigation,
  Heart,
  Loader2,
  Users,
  CheckCircle,
  XCircle,
  Phone,
  Building2,
  Plug,
  ParkingCircle,
  BadgeCheck,
  Info,
  Calendar,
} from "lucide-react";
import { isOwnerStation } from "../lib/mapMarkers";
import {
  addStationReview,
  addFavoriteStation,
  removeFavoriteStation,
  isFavoriteStation,
  submitCrowdReport,
  getCrowdStats,
} from "../api";

const STATUSES = [
  { value: "available", label: "خلوت", color: "#27AE60", bg: "#e8faf0" },
  { value: "busy", label: "شلوغ", color: "#E67E22", bg: "#fef3e2" },
  { value: "waiting", label: "در انتظار", color: "#3498DB", bg: "#EBF5FB" },
  { value: "offline", label: "خاموش", color: "#95a5a6", bg: "#f0f0f0" },
];

function InfoRow({ icon: Icon, label, value }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 dark:border-gray-700 last:border-0">
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          background: "#f3faf5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={15} color="#2ECC71" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 11, color: "#999", marginBottom: 2 }}>{label}</p>
        <p
          style={{ fontSize: 13, fontWeight: 600 }}
          className="text-gray-900 dark:text-white break-words"
        >
          {value}
        </p>
      </div>
    </div>
  );
}

export default function StationDetail({ stations, setStations }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const station = stations.find((s) => s.id === Number(id));

  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewName, setReviewName] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [crowdStep, setCrowdStep] = useState("idle");
  const [crowdLoading, setCrowdLoading] = useState(false);
  const [crowdStats, setCrowdStats] = useState(null);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (!station) return;
    let cancelled = false;
    isFavoriteStation(station.id).then((v) => {
      if (!cancelled) setIsFav(!!v);
    });
    getCrowdStats(station.id)
      .then((v) => {
        if (!cancelled) setCrowdStats(v);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [station]);

  if (!station)
    return (
      <div className="flex items-center justify-center h-screen dark:bg-gray-900">
        <p style={{ color: "#888" }}>ایستگاه یافت نشد</p>
      </div>
    );

  const currentStatus =
    STATUSES.find((s) => s.value === station.status) || STATUSES[0];
  const images = [station.image1, station.image2, station.image3].filter(
    Boolean,
  );
  const heroImage = images[activeImage] || station.image;
  const portsLabel =
    [
      station.acPorts > 0 ? `${station.acPorts} پورت AC` : null,
      station.dcPorts > 0 ? `${station.dcPorts} پورت DC` : null,
    ]
      .filter(Boolean)
      .join(" · ") || `${station.ports || 0} پورت`;
  const priceLabel = station.isFree
    ? "رایگان"
    : station.price ||
      (station.pricePerKwh ? `${station.pricePerKwh} تومان/kWh` : "—");
  const locationLabel = [station.province, station.city, station.district]
    .filter(Boolean)
    .join(" · ");
  const dataUpdated = station.dataUpdatedAt
    ? new Date(station.dataUpdatedAt).toLocaleDateString("fa-IR")
    : null;

  const handleAddReview = async () => {
    if (!reviewText.trim()) return;
    try {
      const updated = await addStationReview(station.id, {
        user: reviewName || "کاربر ناشناس",
        text: reviewText,
        rating: reviewRating,
      });
      setStations((prev) =>
        prev.map((s) => (Number(s.id) === Number(updated.id) ? updated : s)),
      );
      setReviewText("");
      setReviewName("");
      setReviewRating(5);
      setShowForm(false);
    } catch (err) {
      alert(err.message || "خطا در ثبت نظر");
    }
  };

  const handleToggleFavorite = async () => {
    setFavLoading(true);
    try {
      if (isFav) {
        await removeFavoriteStation(station.id);
        setIsFav(false);
      } else {
        await addFavoriteStation(station.id);
        setIsFav(true);
      }
    } finally {
      setFavLoading(false);
    }
  };

  const handleCrowdReport = async (type) => {
    setCrowdLoading(true);
    try {
      const result = await submitCrowdReport(station.id, type);
      const newStats = await getCrowdStats(station.id);
      setCrowdStats(newStats);
      if (result?.updated && result?.status) {
        setStations((prev) =>
          prev.map((s) =>
            s.id === station.id ? { ...s, status: result.status } : s,
          ),
        );
      }
      setCrowdStep("done");
    } finally {
      setCrowdLoading(false);
    }
  };

  return (
    <div
      className="flex flex-col  bg-gray-50 dark:bg-gray-900"
      style={{ paddingBottom: 80 }}
    >
      <div
        style={{
          height: 220,
          background: "#e0f2e0",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {heroImage ? (
          <img
            src={heroImage}
            alt={station.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Zap size={64} color="#2ECC71" opacity={0.3} />
          </div>
        )}
        <button
          onClick={() => navigate(-1)}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: "rgba(255,255,255,0.9)",
            borderRadius: 12,
            width: 38,
            height: 38,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            cursor: "pointer",
          }}
        >
          <ArrowRight size={20} color="#333" />
        </button>
        <div
          style={{
            position: "absolute",
            bottom: 12,
            right: 12,
            display: "flex",
            gap: 6,
            alignItems: "center",
          }}
        >
          {station.isVerified && (
            <span
              style={{
                background: "#E6F1FB",
                color: "#0C447C",
                padding: "4px 10px",
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <BadgeCheck size={12} /> تأییدشده
            </span>
          )}
          <span
            style={{
              background: currentStatus.bg,
              color: currentStatus.color,
              padding: "4px 12px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {currentStatus.label}
          </span>
        </div>
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 px-4 pt-3 overflow-x-auto">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setActiveImage(i)}
              style={{
                width: 56,
                height: 56,
                borderRadius: 10,
                overflow: "hidden",
                border:
                  i === activeImage
                    ? "2px solid #2ECC71"
                    : "2px solid transparent",
                padding: 0,
                flexShrink: 0,
              }}
            >
              <img
                src={src}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </button>
          ))}
        </div>
      )}

      <div className="px-4 pt-4 flex flex-col gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h1
              style={{ fontSize: 18, fontWeight: 700 }}
              className="text-gray-900 dark:text-white"
            >
              {station.name}
            </h1>
            {station.code && (
              <span
                style={{
                  fontSize: 11,
                  background: "#f5f5f5",
                  color: "#666",
                  padding: "3px 8px",
                  borderRadius: 8,
                  flexShrink: 0,
                }}
              >
                {station.code}
              </span>
            )}
          </div>
          {isOwnerStation(station) && (
            <span
              className="mb-2 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold"
              style={{ background: "#FFF6E0", color: "#8C5E08" }}
            >
              ایستگاه کاربران
            </span>
          )}
          {station.operator && (
            <p
              style={{
                fontSize: 12,
                marginBottom: 8,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
              className="text-gray-500"
            >
              <Building2 size={12} color="#2ECC71" /> {station.operator}
            </p>
          )}
          <p
            style={{
              fontSize: 13,
              marginBottom: 12,
              display: "flex",
              alignItems: "flex-start",
              gap: 4,
            }}
            className="text-gray-500 dark:text-gray-400"
          >
            <MapPin
              size={13}
              color="#2ECC71"
              style={{ marginTop: 2, flexShrink: 0 }}
            />
            <span>
              {[locationLabel, station.address].filter(Boolean).join(" — ")}
            </span>
          </p>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: "نوع", value: station.type },
              {
                label: "توان",
                value: `${station.maxPower || station.power || "—"} kW`,
              },
              { label: "پورت‌ها", value: portsLabel },
              {
                label: "سوکت",
                value: station.connectors || station.connector || "—",
              },
              { label: "ساعات", value: station.hours || "—" },
              { label: "قیمت", value: priceLabel },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-center"
              >
                <p
                  style={{ fontSize: 11, marginBottom: 2 }}
                  className="text-gray-400 dark:text-gray-500"
                >
                  {item.label}
                </p>
                <p
                  style={{ fontSize: 12, fontWeight: 600 }}
                  className="text-gray-900 dark:text-white"
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 mb-4">
            <Star size={20} color="#F39C12" fill="#F39C12" />
            <span
              style={{ fontSize: 20, fontWeight: 700 }}
              className="text-gray-900 dark:text-white"
            >
              {station.rating || "—"}
            </span>
            <span style={{ fontSize: 13 }} className="text-gray-400">
              ({station.reviews?.length || 0} نظر)
            </span>
            {!station.isActive && (
              <span
                style={{
                  fontSize: 11,
                  marginRight: "auto",
                  background: "#f0f0f0",
                  color: "#888",
                  padding: "3px 8px",
                  borderRadius: 8,
                }}
              >
                غیرفعال در کاتالوگ
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <button
              disabled={station.lat == null || station.lng == null}
              onClick={() =>
                window.open(
                  `https://maps.google.com/?q=${station.lat},${station.lng}`,
                )
              }
              className="flex-1 py-3 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2"
              style={{
                background: station.lat == null ? "#95a5a6" : "#2ECC71",
                fontFamily: "Vazirmatn",
                opacity: station.lat == null ? 0.7 : 1,
              }}
            >
              <Navigation size={16} /> مسیریابی
            </button>
            <button
              onClick={handleToggleFavorite}
              disabled={favLoading}
              className="py-3 px-4 rounded-xl text-sm font-semibold border flex items-center justify-center transition-colors"
              style={{
                borderColor: isFav ? "#e74c3c" : "#e0e0e0",
                background: isFav ? "#fef2f2" : "#fff",
                color: isFav ? "#e74c3c" : "#888",
                minWidth: 52,
              }}
            >
              {favLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Heart size={16} fill={isFav ? "#e74c3c" : "none"} />
              )}
            </button>
            <button
              onClick={() => setShowForm((f) => !f)}
              className="flex-1 py-3 rounded-xl text-sm font-semibold border flex items-center justify-center gap-2"
              style={{
                borderColor: "#e0e0e0",
                color: "#555",
                fontFamily: "Vazirmatn",
                background: "#fff",
              }}
            >
              <Star size={16} /> ثبت نظر
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
          <h2
            style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}
            className="text-gray-900 dark:text-white"
          >
            جزئیات ایستگاه
          </h2>
          <InfoRow icon={Building2} label="اپراتور" value={station.operator} />
          <InfoRow
            icon={MapPin}
            label="استان / شهر / منطقه"
            value={locationLabel}
          />
          <InfoRow
            icon={Plug}
            label="نوع سوکت‌ها"
            value={station.connectors || station.connector}
          />
          <InfoRow icon={Zap} label="پورت AC / DC" value={portsLabel} />
          <InfoRow
            icon={Zap}
            label="حداکثر توان"
            value={station.maxPower ? `${station.maxPower} kW` : null}
          />
          <InfoRow
            icon={ParkingCircle}
            label="جای پارک"
            value={station.parkingSpots}
          />
          <InfoRow
            icon={DollarSign}
            label="هزینه هر کیلووات"
            value={priceLabel}
          />
          <InfoRow icon={Clock} label="ساعت کاری" value={station.hours} />
          <InfoRow icon={Phone} label="شماره تماس" value={station.phone} />
          <InfoRow
            icon={Calendar}
            label="آخرین بروزرسانی داده"
            value={dataUpdated}
          />
          <InfoRow icon={Info} label="توضیحات" value={station.description} />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <Users size={16} className="text-emerald-500" />
            <span
              style={{ fontSize: 14, fontWeight: 700 }}
              className="text-gray-900 dark:text-white"
            >
              وضعیت فعلی ایستگاه
            </span>
            {crowdStats && crowdStats.recent >= 2 && (
              <span
                style={{
                  fontSize: 11,
                  background: "#e8faf0",
                  color: "#27AE60",
                  padding: "2px 8px",
                  borderRadius: 20,
                  marginRight: "auto",
                }}
              >
                بر اساس {crowdStats.recent} گزارش کاربری
              </span>
            )}
          </div>

          {crowdStats && crowdStats.recent > 0 && (
            <div className="flex gap-2 mb-3">
              <div
                className="flex-1 rounded-xl p-2.5 text-center"
                style={{ background: "#e8faf0" }}
              >
                <div
                  style={{ fontSize: 18, fontWeight: 700, color: "#27AE60" }}
                >
                  {crowdStats.availableCount}
                </div>
                <div style={{ fontSize: 11, color: "#27AE60" }}>گزارش خلوت</div>
              </div>
              <div
                className="flex-1 rounded-xl p-2.5 text-center"
                style={{ background: "#fef3e2" }}
              >
                <div
                  style={{ fontSize: 18, fontWeight: 700, color: "#E67E22" }}
                >
                  {crowdStats.busyCount}
                </div>
                <div style={{ fontSize: 11, color: "#E67E22" }}>گزارش شلوغ</div>
              </div>
            </div>
          )}

          {crowdStep === "idle" && (
            <button
              onClick={() => setCrowdStep("confirm")}
              className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 border dark:border-gray-600"
              style={{
                background: "#f8f9fb",
                color: "#555",
                fontFamily: "Vazirmatn",
              }}
            >
              <CheckCircle size={15} className="text-emerald-500" />
              آیا در این ایستگاه حضور دارید؟
            </button>
          )}

          {crowdStep === "confirm" && (
            <div>
              <p
                style={{ fontSize: 13, marginBottom: 10, textAlign: "center" }}
                className="text-gray-600 dark:text-gray-300"
              >
                وضعیت ایستگاه را انتخاب کنید:
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleCrowdReport("available")}
                  disabled={crowdLoading}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-opacity"
                  style={{
                    background: "#e8faf0",
                    color: "#27AE60",
                    border: "1.5px solid #27AE60",
                    fontFamily: "Vazirmatn",
                    opacity: crowdLoading ? 0.6 : 1,
                  }}
                >
                  {crowdLoading ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <CheckCircle size={15} />
                  )}
                  خلوته
                </button>
                <button
                  onClick={() => handleCrowdReport("busy")}
                  disabled={crowdLoading}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-opacity"
                  style={{
                    background: "#fef3e2",
                    color: "#E67E22",
                    border: "1.5px solid #E67E22",
                    fontFamily: "Vazirmatn",
                    opacity: crowdLoading ? 0.6 : 1,
                  }}
                >
                  {crowdLoading ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <XCircle size={15} />
                  )}
                  شلوغه
                </button>
              </div>
              <button
                onClick={() => setCrowdStep("idle")}
                style={{
                  width: "100%",
                  marginTop: 8,
                  fontSize: 12,
                  color: "#aaa",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "Vazirmatn",
                }}
              >
                انصراف
              </button>
            </div>
          )}

          {crowdStep === "done" && (
            <div
              className="flex items-center gap-2 justify-center py-2"
              style={{ color: "#27AE60" }}
            >
              <CheckCircle size={18} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>
                گزارش شما ثبت شد، ممنون!
              </span>
            </div>
          )}

          {station.status === "offline" && crowdStep === "idle" && (
            <div
              className="mt-2 rounded-xl p-3"
              style={{ background: "#fef2f2", border: "1px solid #fecaca" }}
            >
              <p
                style={{
                  fontSize: 12,
                  color: "#E74C3C",
                  marginBottom: 8,
                  fontWeight: 600,
                }}
              >
                ⚠️ این ایستگاه خاموش اعلام شده
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleCrowdReport("available")}
                  disabled={crowdLoading}
                  style={{
                    flex: 1,
                    padding: "7px",
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 600,
                    border: "1.5px solid #27AE60",
                    background: "#e8faf0",
                    color: "#27AE60",
                    cursor: "pointer",
                    fontFamily: "Vazirmatn",
                  }}
                >
                  ✓ روشن است
                </button>
                <button
                  onClick={() => handleCrowdReport("busy")}
                  disabled={crowdLoading}
                  style={{
                    flex: 1,
                    padding: "7px",
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 600,
                    border: "1.5px solid #E74C3C",
                    background: "#fef2f2",
                    color: "#E74C3C",
                    cursor: "pointer",
                    fontFamily: "Vazirmatn",
                  }}
                >
                  ✗ هنوز خاموش
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center mb-3">
            <span
              style={{ fontSize: 15, fontWeight: 700 }}
              className="text-gray-900 dark:text-white"
            >
              نظرات کاربران
            </span>
          </div>
          {showForm && (
            <div
              className="mb-4 p-3 rounded-xl"
              style={{ background: "#f9fdf9", border: "1px solid #d0f0e0" }}
            >
              <input
                value={reviewName}
                onChange={(e) => setReviewName(e.target.value)}
                placeholder="نام شما (اختیاری)"
                className="w-full rounded-xl p-2 mb-2 text-sm bg-white border border-gray-200 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                style={{ fontFamily: "Vazirmatn" }}
              />
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="نظر خود را بنویسید..."
                rows={3}
                className="w-full rounded-xl p-2 mb-2 text-sm bg-white border border-gray-200 outline-none resize-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                style={{ fontFamily: "Vazirmatn" }}
              />
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} onClick={() => setReviewRating(n)}>
                      <Star
                        size={20}
                        color="#F39C12"
                        fill={n <= reviewRating ? "#F39C12" : "none"}
                      />
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleAddReview}
                  className="px-4 py-1.5 rounded-xl text-white text-sm"
                  style={{ background: "#2ECC71", fontFamily: "Vazirmatn" }}
                >
                  ثبت
                </button>
              </div>
            </div>
          )}
          {!station.reviews?.length ? (
            <p
              style={{ fontSize: 13, textAlign: "center", padding: "12px 0" }}
              className="text-gray-400"
            >
              هنوز نظری ثبت نشده
            </p>
          ) : (
            station.reviews.map((r, i) => (
              <div
                key={r.id || i}
                className="mb-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700"
              >
                <div className="flex justify-between items-center mb-1">
                  <span
                    style={{ fontSize: 13, fontWeight: 600 }}
                    className="text-gray-900 dark:text-white"
                  >
                    {r.user || r.userName || r.user_name}
                  </span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        size={12}
                        color="#F39C12"
                        fill={n <= r.rating ? "#F39C12" : "none"}
                      />
                    ))}
                  </div>
                </div>
                <p
                  style={{ fontSize: 12 }}
                  className="text-gray-600 dark:text-gray-300"
                >
                  {r.text}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
