import React, { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  MapPin,
  Zap,
  Users,
  BarChart2,
  Settings,
  LogOut,
  Bell,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  RefreshCw,
  Star,
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  Clock,
  PowerOff,
  Search,
  ChevronLeft,
  ChevronRight,
  Menu,
  Phone,
  Mail,
  Calendar,
  Newspaper,
  Pin,
  PinOff,
  Pencil,
  Crown,
  ChevronDown,
  ClipboardList,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  Eye,
} from "lucide-react";
import {
  createStation,
  deleteStation,
  updateStation,
  createNews,
  deleteNews,
  updateNews,
  fetchNews,
  getAllCrowdStats,
  fetchStationReports,
  approveStationReport,
  rejectStationReport,
  deleteStationReport,
  fetchUsers,
  updateUserMembership,
  deleteUser,
  USE_MOCK,
} from "../api";
import { useAuth } from "../context/AuthContext";
import StatusDonutChart from "../components/StatusDonutChart";

const MEMBERSHIP_OPTIONS = ["رایگان", "ویژه", "طلایی"];

const NAV = [
  { key: "dashboard", Icon: LayoutDashboard, label: "داشبورد" },
  { key: "stations", Icon: MapPin, label: "ایستگاه‌ها" },
  { key: "chargers", Icon: Zap, label: "شارژرها" },
  { key: "users", Icon: Users, label: "کاربران و نظرات" },
  { key: "news", Icon: Newspaper, label: "اخبار" },
  {
    key: "stationreports",
    Icon: ClipboardList,
    label: "ایستگاه‌های گزارش‌شده",
  },
  { key: "reports", Icon: BarChart2, label: "گزارش‌ها" },
  { key: "settings", Icon: Settings, label: "تنظیمات" },
];

const STATUSES = [
  {
    value: "available",
    label: "خلوت",
    Icon: CheckCircle,
    color: "#27AE60",
    bg: "#e8faf0",
  },
  {
    value: "busy",
    label: "شلوغ",
    Icon: AlertCircle,
    color: "#E67E22",
    bg: "#fef3e2",
  },
  {
    value: "waiting",
    label: "در انتظار",
    Icon: Clock,
    color: "#3498DB",
    bg: "#EBF5FB",
  },
  {
    value: "offline",
    label: "خاموش",
    Icon: PowerOff,
    color: "#95a5a6",
    bg: "#f0f0f0",
  },
];

const EMPTY_FORM = {
  code: "",
  name: "",
  operator: "",
  province: "",
  city: "",
  district: "",
  address: "",
  lat: 35.7219,
  lng: 51.3347,
  acPorts: 0,
  dcPorts: 1,
  maxPower: "60",
  connectors: "CCS2",
  parkingSpots: "",
  isFree: false,
  pricePerKwh: "",
  isActive: true,
  isVerified: false,
  hours: "۲۴ ساعته",
  phone: "",
  image1: "",
  description: "",
  status: "available",
  // سازگاری نمایش قدیمی
  type: "DC",
  connector: "CCS2",
  power: 60,
  ports: 1,
  price: "",
  image: "",
};

function StatCard({ label, value, sub, subUp, Icon, color, bg }) {
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

export default function Admin({ stations, setStations }) {
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    requestOtp,
    verifyOtp,
    logout,
    loading: authLoading,
  } = useAuth();
  const [adminPhone, setAdminPhone] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [adminOtpStep, setAdminOtpStep] = useState("phone");
  const [adminLoginError, setAdminLoginError] = useState("");
  const [adminLoggingIn, setAdminLoggingIn] = useState(false);

  const needsAdminAuth =
    !USE_MOCK && (!isAuthenticated || user?.role !== "admin");

  const handleAdminRequestOtp = async (e) => {
    e.preventDefault();
    setAdminLoginError("");
    setAdminLoggingIn(true);
    try {
      const phone = adminPhone.replace(/\D/g, "").slice(0, 11);
      await requestOtp({ phone, purpose: "login" });
      setAdminPhone(phone);
      setAdminOtpStep("code");
      setAdminCode("");
    } catch (err) {
      setAdminLoginError(err.message || "ارسال کد ناموفق بود");
    } finally {
      setAdminLoggingIn(false);
    }
  };

  const handleAdminVerifyOtp = async (e) => {
    e.preventDefault();
    setAdminLoginError("");
    setAdminLoggingIn(true);
    try {
      const session = await verifyOtp({
        phone: adminPhone,
        code: adminCode.trim(),
        purpose: "login",
      });
      if (session?.user?.role !== "admin") {
        await logout();
        setAdminLoginError("این حساب دسترسی ادمین ندارد");
        setAdminOtpStep("phone");
      }
    } catch (err) {
      setAdminLoginError(err.message || "ورود ناموفق بود");
    } finally {
      setAdminLoggingIn(false);
    }
  };

  const [active, setActive] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [addMode, setAddMode] = useState(false);
  const [editStation, setEditStation] = useState(null); // ایستگاهی که در حال ویرایش است
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [membershipMenu, setMembershipMenu] = useState(null); // id کاربری که dropdown اشتراکش باز است
  const [membershipMenuPos, setMembershipMenuPos] = useState({
    top: 0,
    left: 0,
  }); // موقعیت dropdown

  const [users, setUsers] = useState([]);

  // گزارش‌های وضعیت کاربری ایستگاه‌ها
  const [crowdStats, setCrowdStats] = useState([]);
  useEffect(() => {
    getAllCrowdStats()
      .then(setCrowdStats)
      .catch(() => setCrowdStats([]));
  }, []);

  useEffect(() => {
    if (active === "users" || active === "dashboard") {
      fetchUsers()
        .then(setUsers)
        .catch(() => setUsers([]));
    }
  }, [active]);

  // ایستگاه‌های گزارش‌شده توسط کاربران
  // TODO: GET /station-reports
  const [stationReports, setStationReports] = useState([]);
  const [srLoading, setSrLoading] = useState(false);
  const [rejectModal, setRejectModal] = useState(null); // id گزارشی که داره رد میشه
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    if (active === "stationreports") {
      setSrLoading(true);
      fetchStationReports()
        .then(setStationReports)
        .finally(() => setSrLoading(false));
    }
  }, [active]);

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

  // اخبار
  const [newsList, setNewsList] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsForm, setNewsForm] = useState({
    title: "",
    body: "",
    category: "ایستگاه",
    pinned: false,
    image: null,
  });
  const [newsAddMode, setNewsAddMode] = useState(false);
  const [newsEditId, setNewsEditId] = useState(null);
  const [newsSaving, setNewsSaving] = useState(false);
  const newsImgRef = useRef(null);

  useEffect(() => {
    fetchNews()
      .then(setNewsList)
      .finally(() => setNewsLoading(false));
  }, []);

  const handleMembershipChange = async (userId, membership) => {
    try {
      const updated = await updateUserMembership(userId, membership);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, ...updated, membership } : u,
        ),
      );
    } catch (err) {
      alert(err.message || "خطا در تغییر اشتراک");
    }
    setMembershipMenu(null);
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("آیا از حذف این کاربر مطمئن هستید؟")) return;
    try {
      await deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      alert(err.message || "حذف کاربر ممکن نیست");
    }
  };

  const handleNewsImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) =>
      setNewsForm((f) => ({ ...f, image: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const handleNewsSave = async () => {
    if (!newsForm.title.trim() || !newsForm.body.trim()) return;
    setNewsSaving(true);
    try {
      if (newsEditId) {
        const updated = await updateNews(newsEditId, newsForm);
        setNewsList((prev) =>
          prev.map((n) => (n.id === newsEditId ? updated : n)),
        );
      } else {
        const created = await createNews(newsForm);
        setNewsList((prev) => [created, ...prev]);
      }
      setNewsForm({
        title: "",
        body: "",
        category: "ایستگاه",
        pinned: false,
        image: null,
      });
      setNewsAddMode(false);
      setNewsEditId(null);
    } finally {
      setNewsSaving(false);
    }
  };

  const handleNewsDelete = async (id) => {
    await deleteNews(id);
    setNewsList((prev) => prev.filter((n) => n.id !== id));
  };

  const handleNewsTogglePin = async (item) => {
    const updated = await updateNews(item.id, { pinned: !item.pinned });
    setNewsList((prev) => prev.map((n) => (n.id === item.id ? updated : n)));
  };

  const handleNewsEdit = (item) => {
    setNewsForm({
      title: item.title,
      body: item.body,
      category: item.category,
      pinned: item.pinned,
      image: item.image,
    });
    setNewsEditId(item.id);
    setNewsAddMode(true);
  };

  const SIDEBAR_W = collapsed ? 72 : 240;

  const f = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleAdd = async () => {
    if (!form.name.trim() || !form.city.trim())
      return alert("نام و شهر را وارد کنید");
    try {
      const payload = {
        ...form,
        connectors: form.connectors || form.connector,
        maxPower: form.maxPower || String(form.power || ""),
        pricePerKwh: form.pricePerKwh || form.price || null,
        image1: form.image1 || form.image || null,
        acPorts: Number(form.acPorts) || 0,
        dcPorts: Number(form.dcPorts) || 0,
      };
      if (editStation) {
        const updated = await updateStation(editStation.id, payload);
        setStations((prev) =>
          prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)),
        );
        setEditStation(null);
      } else {
        const created = await createStation(payload);
        setStations((prev) => [created, ...prev]);
      }
      setForm(EMPTY_FORM);
      setImagePreview("");
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setAddMode(false);
      }, 1500);
    } catch (err) {
      alert(err.message || "خطا در ذخیره ایستگاه");
    }
  };

  const handleEditStart = (station) => {
    setEditStation(station);
    setForm({
      code: station.code || "",
      name: station.name,
      operator: station.operator || "",
      province: station.province || "",
      city: station.city,
      district: station.district || "",
      address: station.address,
      lat: station.lat ?? 35.7219,
      lng: station.lng ?? 51.3347,
      acPorts: station.acPorts ?? 0,
      dcPorts: station.dcPorts ?? 0,
      maxPower: station.maxPower || String(station.power || ""),
      connectors: station.connectors || station.connector || "",
      parkingSpots: station.parkingSpots || "",
      isFree: Boolean(station.isFree),
      pricePerKwh: station.pricePerKwh || "",
      isActive: station.isActive !== false,
      isVerified: Boolean(station.isVerified),
      hours: station.hours || "۲۴ ساعته",
      phone: station.phone || "",
      image1: station.image1 || station.image || "",
      description: station.description || "",
      status: station.status,
      type: station.type,
      connector: station.connector || station.connectors || "",
      power: station.power,
      ports: station.ports,
      price: station.price || "",
      image: station.image || "",
    });
    setImagePreview(station.image || station.image1 || "");
    setAddMode(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("حذف شود؟")) return;
    try {
      await deleteStation(id);
      setStations((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      alert(err.message || "خطا در حذف ایستگاه");
    }
  };

  const handleToggleStatus = async (id, status) => {
    const next =
      STATUSES[
        (STATUSES.findIndex((s) => s.value === status) + 1) % STATUSES.length
      ].value;
    try {
      const updated = await updateStation(id, { status: next });
      setStations((prev) =>
        prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)),
      );
    } catch (err) {
      alert(err.message || "خطا در تغییر وضعیت");
    }
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const filtered = useMemo(
    () =>
      stations.filter(
        (s) => !search || s.name.includes(search) || s.city.includes(search),
      ),
    [stations, search],
  );

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
  const offline = stations.filter((s) => s.status === "offline").length;
  const chartData = [120, 145, 130, 190, 175, 220, 180];
  const chartDays = ["۱۸ خرداد", "۱۹", "۲۰", "۲۱", "۲۲", "۲۳", "۲۴"];

  const inputStyle = {
    width: "100%",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 10,
    padding: "9px 13px",
    fontSize: 13,
    fontFamily: "Vazirmatn",
    outline: "none",
    background: "rgba(255,255,255,0.06)",
    color: "#1a1a1a",
  };
  const selectStyle = { ...inputStyle };

  if (authLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Vazirmatn",
        }}
      >
        در حال بارگذاری...
      </div>
    );
  }

  if (needsAdminAuth) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Vazirmatn",
          direction: "rtl",
          background: "#f4f5f7",
          padding: 24,
        }}
      >
        <form
          onSubmit={
            adminOtpStep === "phone"
              ? handleAdminRequestOtp
              : handleAdminVerifyOtp
          }
          style={{
            width: "100%",
            maxWidth: 380,
            background: "#fff",
            borderRadius: 16,
            padding: 28,
            border: "1px solid #eef0f3",
            boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
          }}
        >
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>
            ورود ادمین ولت‌مپ
          </h1>
          <p style={{ fontSize: 13, color: "#888", marginBottom: 20 }}>
            ورود با شماره موبایل و کد یک‌بارمصرف
          </p>
          {adminOtpStep === "phone" ? (
            <>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  color: "#666",
                  marginBottom: 6,
                }}
              >
                شماره موبایل
              </label>
              <input
                value={adminPhone}
                onChange={(e) =>
                  setAdminPhone(e.target.value.replace(/\D/g, "").slice(0, 11))
                }
                placeholder="0912..."
                dir="ltr"
                style={{
                  width: "100%",
                  marginBottom: 14,
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  padding: "10px 12px",
                  fontFamily: "Vazirmatn",
                }}
              />
            </>
          ) : (
            <>
              <p style={{ fontSize: 13, color: "#555", marginBottom: 12 }}>
                کد به <span dir="ltr">{adminPhone}</span> ارسال شد
              </p>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  color: "#666",
                  marginBottom: 6,
                }}
              >
                کد تأیید
              </label>
              <input
                value={adminCode}
                onChange={(e) =>
                  setAdminCode(e.target.value.replace(/\D/g, "").slice(0, 8))
                }
                placeholder="کد ۵ رقمی"
                dir="ltr"
                style={{
                  width: "100%",
                  marginBottom: 14,
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  padding: "10px 12px",
                  fontFamily: "Vazirmatn",
                  letterSpacing: "0.3em",
                  textAlign: "center",
                }}
              />
              <button
                type="button"
                onClick={() => {
                  setAdminOtpStep("phone");
                  setAdminCode("");
                  setAdminLoginError("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#2ECC71",
                  fontSize: 12,
                  marginBottom: 12,
                  cursor: "pointer",
                  fontFamily: "Vazirmatn",
                }}
              >
                تغییر شماره
              </button>
            </>
          )}
          {adminLoginError && (
            <div style={{ color: "#e74c3c", fontSize: 13, marginBottom: 12 }}>
              {adminLoginError}
            </div>
          )}
          <button
            type="submit"
            disabled={adminLoggingIn}
            style={{
              width: "100%",
              padding: "12px",
              border: "none",
              borderRadius: 10,
              cursor: "pointer",
              background: "#2ECC71",
              color: "#fff",
              fontWeight: 700,
              fontFamily: "Vazirmatn",
            }}
          >
            {adminLoggingIn
              ? "لطفاً صبر کنید..."
              : adminOtpStep === "phone"
                ? "دریافت کد"
                : "ورود"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        fontFamily: "Vazirmatn",
        direction: "rtl",
        background: "#f4f5f7",
      }}
    >
      {/* ════ SIDEBAR ════ */}
      <div
        style={{
          width: SIDEBAR_W,
          flexShrink: 0,
          background: "#0f1923",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          overflowY: "auto",
          overflowX: "hidden",
          transition: "width 0.25s cubic-bezier(0.4,0,0.2,1)",
          zIndex: 100,
          boxShadow: "0 0 40px rgba(0,0,0,0.2)",
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: "18px 16px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg,#2ECC71,#1a7a40)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Zap size={18} color="#fff" />
            </div>
            {!collapsed && (
              <div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#fff",
                    lineHeight: 1.2,
                  }}
                >
                  ولت<span style={{ color: "#2ECC71" }}>مپ</span>
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.35)",
                    letterSpacing: 1,
                  }}
                >
                  VoltMap Admin
                </div>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#aaa",
                display: "flex",
                alignItems: "center",
              }}
            >
              <ChevronRight size={18} />
            </button>
          )}
        </div>

        {collapsed && (
          <div
            style={{
              padding: "12px 0",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <button
              onClick={() => setCollapsed(false)}
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "none",
                cursor: "pointer",
                color: "#555",
                borderRadius: 8,
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Menu size={16} />
            </button>
          </div>
        )}

        {/* Nav */}
        <nav
          style={{
            flex: 1,
            padding: "8px",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {NAV.map(({ key, Icon, label }) => (
            <button
              key={key}
              onClick={() => setActive(key)}
              title={collapsed ? label : ""}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: collapsed ? "10px 0" : "10px 14px",
                justifyContent: collapsed ? "center" : "flex-start",
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
                width: "100%",
                textAlign: "right",
                background:
                  active === key ? "rgba(46,204,113,0.15)" : "transparent",
                color: active === key ? "#2ECC71" : "rgba(255,255,255,0.5)",
                fontFamily: "Vazirmatn",
                fontSize: 13,
                fontWeight: active === key ? 600 : 400,
                transition: "all 0.15s",
                position: "relative",
              }}
            >
              {active === key && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "20%",
                    bottom: "20%",
                    width: 3,
                    borderRadius: "0 3px 3px 0",
                    background: "#2ECC71",
                  }}
                />
              )}
              <Icon size={18} style={{ flexShrink: 0 }} />
              {!collapsed && <span className="sidebar-label">{label}</span>}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div
          style={{
            padding: "10px 8px",
            borderTop: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          {/* Admin info */}
          {!collapsed && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 12,
                background: "rgba(255,255,255,0.05)",
                marginBottom: 8,
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
                  flexShrink: 0,
                }}
              >
                <Users size={16} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>
                  مدیر سیستم
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                  admin@voltmap.ir
                </div>
              </div>
            </div>
          )}
          <button
            onClick={() => navigate("/")}
            title={collapsed ? "بازگشت به اپ" : ""}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: collapsed ? "10px 0" : "10px 14px",
              justifyContent: collapsed ? "center" : "flex-start",
              borderRadius: 12,
              border: "none",
              cursor: "pointer",
              width: "100%",
              background: "transparent",
              color: "rgba(255,255,255,0.35)",
              fontFamily: "Vazirmatn",
              fontSize: 13,
              transition: "all 0.15s",
            }}
          >
            <LogOut size={17} />
            {!collapsed && "بازگشت به اپ"}
          </button>
        </div>
      </div>

      {/* ════ MAIN ════ */}
      <div
        style={{
          flex: 1,
          marginRight: SIDEBAR_W,
          transition: "margin-right 0.25s cubic-bezier(0.4,0,0.2,1)",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Topbar */}
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

        {/* Content */}
        <div style={{ padding: 28, flex: 1 }}>
          {/* ── DASHBOARD ── */}
          {active === "dashboard" && (
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
          )}

          {/* ── STATIONS ── */}
          {active === "stations" && (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                  gap: 16,
                }}
              >
                <div style={{ position: "relative" }}>
                  <Search
                    size={15}
                    color="#aaa"
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                    }}
                  />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="جستجوی ایستگاه..."
                    style={{
                      ...inputStyle,
                      paddingRight: 36,
                      width: 260,
                      background: "#fff",
                    }}
                  />
                </div>
                <button
                  onClick={() => setAddMode((m) => !m)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "#2ECC71",
                    color: "#fff",
                    border: "none",
                    borderRadius: 12,
                    padding: "10px 20px",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "Vazirmatn",
                    boxShadow: "0 4px 12px rgba(46,204,113,0.3)",
                  }}
                >
                  <Plus size={16} /> افزودن ایستگاه جدید
                </button>
              </div>

              {/* Add form */}
              {addMode && (
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 16,
                    padding: 28,
                    border: "1px solid #eef0f3",
                    marginBottom: 24,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 20,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: "#1a1a1a",
                      }}
                    >
                      {editStation ? "ویرایش ایستگاه" : "ایستگاه جدید"}
                    </span>
                    <button
                      onClick={() => setAddMode(false)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      <X size={20} color="#aaa" />
                    </button>
                  </div>

                  {/* Image upload */}
                  <div style={{ marginBottom: 20 }}>
                    <label
                      style={{
                        fontSize: 12,
                        color: "#888",
                        display: "block",
                        marginBottom: 8,
                        fontWeight: 500,
                      }}
                    >
                      تصویر ایستگاه
                    </label>
                    <div
                      style={{
                        border: "2px dashed #e0e0e0",
                        borderRadius: 14,
                        padding: 20,
                        textAlign: "center",
                        cursor: "pointer",
                        position: "relative",
                        background: "#fafafa",
                        transition: "border-color 0.2s",
                      }}
                    >
                      {imagePreview ? (
                        <div
                          style={{
                            position: "relative",
                            display: "inline-block",
                          }}
                        >
                          <img
                            src={imagePreview}
                            style={{
                              height: 120,
                              borderRadius: 10,
                              objectFit: "cover",
                            }}
                            alt=""
                          />
                          <button
                            onClick={() => setImagePreview("")}
                            style={{
                              position: "absolute",
                              top: -8,
                              left: -8,
                              background: "#e74c3c",
                              border: "none",
                              borderRadius: "50%",
                              width: 24,
                              height: 24,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <X size={12} color="#fff" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <Upload
                            size={32}
                            color="#ccc"
                            style={{ margin: "0 auto 10px" }}
                          />
                          <p style={{ fontSize: 13, color: "#aaa" }}>
                            کلیک کنید یا عکس را اینجا بکشید
                          </p>
                          <p
                            style={{
                              fontSize: 11,
                              color: "#ccc",
                              marginTop: 4,
                            }}
                          >
                            PNG، JPG تا ۵ مگابایت
                          </p>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImage}
                        style={{
                          position: "absolute",
                          inset: 0,
                          opacity: 0,
                          cursor: "pointer",
                          width: "100%",
                          height: "100%",
                        }}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 2fr",
                      gap: 14,
                      marginBottom: 14,
                    }}
                  >
                    {[
                      ["کد ایستگاه", "code", "text"],
                      ["نام ایستگاه *", "name", "text"],
                      ["اپراتور", "operator", "text"],
                      ["استان", "province", "text"],
                      ["شهر *", "city", "text"],
                      ["منطقه", "district", "text"],
                      ["آدرس کامل", "address", "text"],
                    ].map(([label, key]) => (
                      <div key={key}>
                        <label
                          style={{
                            fontSize: 12,
                            color: "#888",
                            display: "block",
                            marginBottom: 6,
                          }}
                        >
                          {label}
                        </label>
                        <input
                          value={form[key]}
                          onChange={(e) => f(key, e.target.value)}
                          style={inputStyle}
                        />
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(6,1fr)",
                      gap: 14,
                      marginBottom: 14,
                    }}
                  >
                    <div>
                      <label
                        style={{
                          fontSize: 12,
                          color: "#888",
                          display: "block",
                          marginBottom: 6,
                        }}
                      >
                        نوع شارژر
                      </label>
                      <select
                        value={form.type}
                        onChange={(e) => {
                          const t = e.target.value;
                          // وقتی type عوض می‌شه connector رو هم ریست کن
                          const defaultConn =
                            t === "DC"
                              ? "CCS2"
                              : t === "AC"
                                ? "Type2"
                                : "CCS2+Type2";
                          f("type", t);
                          f("connector", defaultConn);
                          f("connectors", defaultConn);
                        }}
                        style={selectStyle}
                      >
                        {["AC", "DC", "AC/DC"].map((o) => (
                          <option key={o}>{o}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label
                        style={{
                          fontSize: 12,
                          color: "#888",
                          display: "block",
                          marginBottom: 6,
                        }}
                      >
                        کانکتور
                        <span
                          style={{
                            fontSize: 10,
                            color: "#aaa",
                            marginRight: 4,
                          }}
                        >
                          {form.type === "DC"
                            ? "(DC نازل)"
                            : form.type === "AC"
                              ? "(AC نازل)"
                              : "(DC + AC نازل)"}
                        </span>
                      </label>
                      <select
                        value={form.connector}
                        onChange={(e) => {
                          f("connector", e.target.value);
                          f("connectors", e.target.value);
                        }}
                        style={selectStyle}
                      >
                        {form.type === "DC" &&
                          ["CCS2", "GB/T", "CCS2+GB/T"].map((o) => (
                            <option key={o}>{o}</option>
                          ))}
                        {form.type === "AC" &&
                          ["Type2", "GB/T", "Type2+GB/T"].map((o) => (
                            <option key={o}>{o}</option>
                          ))}
                        {form.type === "AC/DC" &&
                          [
                            "CCS2+Type2",
                            "CCS2+GB/T",
                            "Type2+GB/T",
                            "CCS2+GB/T+Type2",
                          ].map((o) => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label
                        style={{
                          fontSize: 12,
                          color: "#888",
                          display: "block",
                          marginBottom: 6,
                        }}
                      >
                        توان (kW)
                      </label>
                      <input
                        value={form.maxPower}
                        onChange={(e) => {
                          f("maxPower", e.target.value);
                          const n = Number(
                            String(e.target.value).match(
                              /(\d+(?:\.\d+)?)/,
                            )?.[1],
                          );
                          if (Number.isFinite(n)) f("power", n);
                        }}
                        placeholder="مثلاً 60 یا 60-7.4"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          fontSize: 12,
                          color: "#888",
                          display: "block",
                          marginBottom: 6,
                        }}
                      >
                        پورت AC
                      </label>
                      <input
                        type="number"
                        value={form.acPorts}
                        onChange={(e) => f("acPorts", Number(e.target.value))}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          fontSize: 12,
                          color: "#888",
                          display: "block",
                          marginBottom: 6,
                        }}
                      >
                        پورت DC
                      </label>
                      <input
                        type="number"
                        value={form.dcPorts}
                        onChange={(e) => f("dcPorts", Number(e.target.value))}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          fontSize: 12,
                          color: "#888",
                          display: "block",
                          marginBottom: 6,
                        }}
                      >
                        قیمت هر kWh
                      </label>
                      <input
                        value={form.pricePerKwh}
                        onChange={(e) => {
                          f("pricePerKwh", e.target.value);
                          f("price", e.target.value);
                        }}
                        placeholder="۴۸۷۱"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          fontSize: 12,
                          color: "#888",
                          display: "block",
                          marginBottom: 6,
                        }}
                      >
                        ساعات
                      </label>
                      <input
                        value={form.hours}
                        onChange={(e) => f("hours", e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: 14,
                      marginBottom: 20,
                    }}
                  >
                    <div>
                      <label
                        style={{
                          fontSize: 12,
                          color: "#888",
                          display: "block",
                          marginBottom: 6,
                        }}
                      >
                        عرض جغرافیایی
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        value={form.lat}
                        onChange={(e) => f("lat", Number(e.target.value))}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          fontSize: 12,
                          color: "#888",
                          display: "block",
                          marginBottom: 6,
                        }}
                      >
                        طول جغرافیایی
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        value={form.lng}
                        onChange={(e) => f("lng", Number(e.target.value))}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          fontSize: 12,
                          color: "#888",
                          display: "block",
                          marginBottom: 6,
                        }}
                      >
                        وضعیت اولیه
                      </label>
                      <select
                        value={form.status}
                        onChange={(e) => f("status", e.target.value)}
                        style={selectStyle}
                      >
                        {STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {saved && (
                    <div
                      style={{
                        background: "#e8faf0",
                        color: "#27AE60",
                        padding: 12,
                        borderRadius: 12,
                        textAlign: "center",
                        fontSize: 13,
                        marginBottom: 14,
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      <CheckCircle size={16} />
                      ایستگاه با موفقیت اضافه شد!
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      onClick={handleAdd}
                      style={{
                        background: "#2ECC71",
                        color: "#fff",
                        border: "none",
                        borderRadius: 12,
                        padding: "13px 28px",
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "Vazirmatn",
                        boxShadow: "0 4px 14px rgba(46,204,113,0.3)",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <Zap size={16} />
                      {editStation ? "ذخیره تغییرات" : "ثبت ایستگاه"}
                    </button>
                    {editStation && (
                      <button
                        onClick={() => {
                          setEditStation(null);
                          setForm(EMPTY_FORM);
                          setImagePreview("");
                          setAddMode(false);
                        }}
                        style={{
                          background: "#f5f5f5",
                          color: "#555",
                          border: "none",
                          borderRadius: 12,
                          padding: "13px 22px",
                          fontSize: 14,
                          cursor: "pointer",
                          fontFamily: "Vazirmatn",
                        }}
                      >
                        انصراف
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Table */}
              <div
                style={{
                  background: "#fff",
                  borderRadius: 16,
                  border: "1px solid #eef0f3",
                  overflow: "hidden",
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8f9fb" }}>
                      {[
                        "",
                        "نام ایستگاه",
                        "شهر",
                        "اپراتور",
                        "نوع",
                        "سوکت",
                        "توان",
                        "پورت",
                        "وضعیت",
                        "امتیاز",
                        "عملیات",
                      ].map((h, i) => (
                        <th
                          key={i}
                          style={{
                            padding: "13px 16px",
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
                    {filtered.map((s) => {
                      const st =
                        STATUSES.find((x) => x.value === s.status) ||
                        STATUSES[0];
                      return (
                        <tr
                          key={s.id}
                          style={{
                            borderTop: "1px solid #f5f7fa",
                            transition: "background 0.1s",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = "#fafbfc")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "transparent")
                          }
                        >
                          <td style={{ padding: "12px 16px" }}>
                            <div
                              style={{
                                width: 46,
                                height: 46,
                                borderRadius: 11,
                                overflow: "hidden",
                                background: "#e8faf0",
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
                                <Zap size={20} color="#2ECC71" />
                              )}
                            </div>
                          </td>
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
                          <td
                            style={{
                              padding: "12px 16px",
                              fontSize: 12,
                              color: "#888",
                            }}
                          >
                            {s.operator || "—"}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span
                              style={{
                                fontSize: 11,
                                background: "#e8faf0",
                                color: "#27AE60",
                                padding: "3px 10px",
                                borderRadius: 8,
                                fontWeight: 500,
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
                            {s.connectors || s.connector || "—"}
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              fontSize: 13,
                              color: "#666",
                            }}
                          >
                            {s.maxPower || s.power || "—"}kW
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              fontSize: 13,
                              color: "#666",
                            }}
                          >
                            {`AC:${s.acPorts ?? 0} / DC:${s.dcPorts ?? 0}`}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <button
                              onClick={() => handleToggleStatus(s.id, s.status)}
                              style={{
                                fontSize: 11,
                                padding: "4px 12px",
                                borderRadius: 20,
                                background: st.bg,
                                color: st.color,
                                fontWeight: 600,
                                border: "none",
                                cursor: "pointer",
                                fontFamily: "Vazirmatn",
                              }}
                            >
                              {st.label}
                            </button>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
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
                                  color: "#1a1a1a",
                                  fontWeight: 600,
                                }}
                              >
                                {s.rating || "—"}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button
                                onClick={() => handleEditStart(s)}
                                title="ویرایش"
                                style={{
                                  background: "#EBF5FB",
                                  border: "none",
                                  borderRadius: 9,
                                  padding: "7px 10px",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                }}
                              >
                                <Pencil size={14} color="#2980B9" />
                              </button>
                              <button
                                onClick={() => handleDelete(s.id)}
                                title="حذف"
                                style={{
                                  background: "#FCEBEB",
                                  border: "none",
                                  borderRadius: 9,
                                  padding: "7px 10px",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                }}
                              >
                                <Trash2 size={14} color="#A32D2D" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filtered.length === 0 && (
                  <div
                    style={{ textAlign: "center", padding: 48, color: "#aaa" }}
                  >
                    <Search
                      size={36}
                      color="#ddd"
                      style={{ margin: "0 auto 12px" }}
                    />
                    <p style={{ fontSize: 14 }}>نتیجه‌ای یافت نشد</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── USERS & REVIEWS ── */}
          {active === "users" &&
            (() => {
              const filteredUsers = users.filter(
                (u) =>
                  !userSearch ||
                  u.name?.includes(userSearch) ||
                  u.email?.includes(userSearch) ||
                  u.phone?.includes(userSearch),
              );
              return (
                <>
                  {/* Stats row */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4,1fr)",
                      gap: 16,
                      marginBottom: 24,
                    }}
                  >
                    <StatCard
                      label="کل کاربران"
                      value={users.length}
                      sub="ثبت‌نام‌شده"
                      subUp
                      Icon={Users}
                      color="#3498DB"
                      bg="#EBF5FB"
                    />
                    <StatCard
                      label="اشتراک ویژه"
                      value={
                        users.filter((u) => u.membership === "ویژه").length
                      }
                      sub="کاربر فعال"
                      subUp
                      Icon={Crown}
                      color="#F59E0B"
                      bg="#fef9e7"
                    />
                    <StatCard
                      label="اشتراک طلایی"
                      value={
                        users.filter((u) => u.membership === "طلایی").length
                      }
                      sub="کاربر فعال"
                      subUp
                      Icon={Crown}
                      color="#F59E0B"
                      bg="#fef9e7"
                    />
                    <StatCard
                      label="کل نظرات"
                      value={allReviews.length}
                      sub="نظر ثبت شده"
                      subUp
                      Icon={Star}
                      color="#F39C12"
                      bg="#fef9e7"
                    />
                  </div>

                  {/* Users table */}
                  <div
                    style={{
                      background: "#fff",
                      borderRadius: 16,
                      border: "1px solid #eef0f3",
                      overflow: "visible",
                      marginBottom: 24,
                    }}
                  >
                    <div
                      style={{
                        padding: "18px 22px",
                        borderBottom: "1px solid #f5f7fa",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 16,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: "#1a1a1a",
                        }}
                      >
                        کاربران ثبت‌نام‌شده
                      </span>
                      <div style={{ position: "relative" }}>
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
                          value={userSearch}
                          onChange={(e) => {
                            setUserSearch(e.target.value);
                            setUsers(readUsers());
                          }}
                          placeholder="جستجو نام، ایمیل، موبایل..."
                          style={{
                            border: "1px solid rgba(255,255,255,0.12)",
                            borderRadius: 10,
                            padding: "7px 32px 7px 12px",
                            fontSize: 12,
                            fontFamily: "Vazirmatn",
                            outline: "none",
                            width: 220,
                            background: "rgba(255,255,255,0.06)",
                            color: "#1a1a1a",
                          }}
                        />
                      </div>
                    </div>
                    {filteredUsers.length === 0 ? (
                      <div
                        style={{
                          textAlign: "center",
                          padding: 40,
                          color: "#aaa",
                        }}
                      >
                        <Users
                          size={36}
                          color="#ddd"
                          style={{ margin: "0 auto 12px" }}
                        />
                        <p style={{ fontSize: 14 }}>
                          {users.length === 0
                            ? "هنوز کاربری ثبت‌نام نکرده"
                            : "نتیجه‌ای یافت نشد"}
                        </p>
                      </div>
                    ) : (
                      <table
                        style={{ width: "100%", borderCollapse: "collapse" }}
                      >
                        <thead>
                          <tr style={{ background: "#f8f9fb" }}>
                            {[
                              "#",
                              "نام",
                              "ایمیل",
                              "موبایل",
                              "اشتراک",
                              "تاریخ ثبت‌نام",
                              "",
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
                          {filteredUsers.map((u, i) => (
                            <tr
                              key={u.id}
                              style={{ borderTop: "1px solid #f5f7fa" }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background = "#fafbfc")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background =
                                  "transparent")
                              }
                            >
                              <td style={{ padding: "12px 16px" }}>
                                <div
                                  style={{
                                    width: 38,
                                    height: 38,
                                    borderRadius: "50%",
                                    background:
                                      "linear-gradient(135deg,#3498DB,#1a5a8a)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: 14,
                                      fontWeight: 700,
                                      color: "#fff",
                                    }}
                                  >
                                    {(u.name || "؟")[0]}
                                  </span>
                                </div>
                              </td>
                              <td
                                style={{
                                  padding: "12px 16px",
                                  fontSize: 13,
                                  fontWeight: 600,
                                  color: "#1a1a1a",
                                }}
                              >
                                {u.name || "—"}
                              </td>
                              <td style={{ padding: "12px 16px" }}>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    fontSize: 12,
                                    color: "#666",
                                  }}
                                >
                                  <Mail size={12} color="#aaa" />
                                  {u.email || "—"}
                                </div>
                              </td>
                              <td style={{ padding: "12px 16px" }}>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    fontSize: 12,
                                    color: "#666",
                                  }}
                                >
                                  <Phone size={12} color="#aaa" />
                                  {u.phone || "—"}
                                </div>
                              </td>
                              <td
                                style={{
                                  padding: "12px 16px",
                                  position: "relative",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                  }}
                                >
                                  <button
                                    onClick={(e) => {
                                      const rect =
                                        e.currentTarget.getBoundingClientRect();
                                      setMembershipMenuPos({
                                        top: rect.bottom + 6,
                                        left: rect.left,
                                      });
                                      setMembershipMenu(
                                        membershipMenu === u.id ? null : u.id,
                                      );
                                    }}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 5,
                                      padding: "4px 10px",
                                      borderRadius: 20,
                                      border: "1.5px solid",
                                      fontSize: 11,
                                      fontWeight: 700,
                                      cursor: "pointer",
                                      fontFamily: "Vazirmatn",
                                      background:
                                        u.membership === "ویژه" ||
                                        u.membership === "طلایی"
                                          ? "#fef9e7"
                                          : "#f5f5f5",
                                      borderColor:
                                        u.membership === "ویژه" ||
                                        u.membership === "طلایی"
                                          ? "#F59E0B"
                                          : "#e0e0e0",
                                      color:
                                        u.membership === "ویژه" ||
                                        u.membership === "طلایی"
                                          ? "#D97706"
                                          : "#888",
                                    }}
                                  >
                                    {(u.membership === "ویژه" ||
                                      u.membership === "طلایی") && (
                                      <Crown size={11} />
                                    )}
                                    {u.membership || "رایگان"}
                                    <ChevronDown size={11} />
                                  </button>
                                </div>
                              </td>
                              <td style={{ padding: "12px 16px" }}>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    fontSize: 12,
                                    color: "#aaa",
                                  }}
                                >
                                  <Calendar size={12} />
                                  {u.createdAt
                                    ? new Date(u.createdAt).toLocaleDateString(
                                        "fa-IR",
                                      )
                                    : "—"}
                                </div>
                              </td>
                              <td style={{ padding: "12px 16px" }}>
                                <button
                                  onClick={() => handleDeleteUser(u.id)}
                                  title="حذف کاربر"
                                  style={{
                                    width: 30,
                                    height: 30,
                                    borderRadius: 8,
                                    background: "#fef2f2",
                                    border: "1px solid #fecaca",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                  }}
                                >
                                  <Trash2 size={13} color="#E74C3C" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* Membership dropdown portal — خارج از table تا overflow clip نشه */}
                  {membershipMenu !== null &&
                    (() => {
                      const menuUser = filteredUsers.find(
                        (u) => u.id === membershipMenu,
                      );
                      if (!menuUser) return null;
                      return (
                        <>
                          {/* overlay شفاف برای بستن */}
                          <div
                            style={{ position: "fixed", inset: 0, zIndex: 999 }}
                            onClick={() => setMembershipMenu(null)}
                          />
                          <div
                            style={{
                              position: "fixed",
                              top: membershipMenuPos.top,
                              left: membershipMenuPos.left,
                              zIndex: 1000,
                              background: "#fff",
                              borderRadius: 12,
                              boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
                              border: "1px solid #eee",
                              minWidth: 140,
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                padding: "8px 14px 6px",
                                fontSize: 11,
                                color: "#aaa",
                                borderBottom: "1px solid #f5f5f5",
                              }}
                            >
                              نوع اشتراک: {menuUser.name}
                            </div>
                            {MEMBERSHIP_OPTIONS.map((m) => (
                              <button
                                key={m}
                                onClick={() =>
                                  handleMembershipChange(menuUser.id, m)
                                }
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  width: "100%",
                                  padding: "10px 14px",
                                  textAlign: "right",
                                  fontSize: 13,
                                  fontFamily: "Vazirmatn",
                                  border: "none",
                                  cursor: "pointer",
                                  background:
                                    menuUser.membership === m
                                      ? m !== "رایگان"
                                        ? "#fef9e7"
                                        : "#f5f7fa"
                                      : "transparent",
                                  color: m !== "رایگان" ? "#D97706" : "#333",
                                  fontWeight:
                                    menuUser.membership === m ? 700 : 400,
                                  transition: "background 0.1s",
                                }}
                              >
                                {m !== "رایگان" ? (
                                  <Crown size={14} color="#F59E0B" />
                                ) : (
                                  <div
                                    style={{
                                      width: 14,
                                      height: 14,
                                      borderRadius: "50%",
                                      background: "#e0e0e0",
                                    }}
                                  />
                                )}
                                {m}
                                {menuUser.membership === m && (
                                  <span
                                    style={{
                                      marginRight: "auto",
                                      color: "#27AE60",
                                      fontSize: 12,
                                    }}
                                  >
                                    ✓
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        </>
                      );
                    })()}

                  {/* Reviews */}
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
                        padding: "18px 22px",
                        borderBottom: "1px solid #f5f7fa",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: "#1a1a1a",
                        }}
                      >
                        نظرات کاربران
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          color: "rgba(255,255,255,0.35)",
                        }}
                      >
                        {allReviews.length} نظر
                      </span>
                    </div>
                    <div style={{ padding: 22 }}>
                      {allReviews.length === 0 ? (
                        <p
                          style={{
                            color: "#aaa",
                            fontSize: 14,
                            textAlign: "center",
                            padding: "40px 0",
                          }}
                        >
                          هنوز هیچ نظری ثبت نشده
                        </p>
                      ) : (
                        allReviews.map((r, i) => (
                          <div
                            key={i}
                            style={{
                              display: "flex",
                              gap: 16,
                              paddingBottom: 18,
                              marginBottom: 18,
                              borderBottom: "1px solid #f5f7fa",
                            }}
                          >
                            <div
                              style={{
                                width: 44,
                                height: 44,
                                borderRadius: "50%",
                                background: "#EBF5FB",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <Users size={18} color="#3498DB" />
                            </div>
                            <div style={{ flex: 1 }}>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  marginBottom: 6,
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 14,
                                    fontWeight: 600,
                                    color: "#1a1a1a",
                                  }}
                                >
                                  {r.user || r.userName || r.user_name}
                                </span>
                                <div style={{ display: "flex", gap: 2 }}>
                                  {[1, 2, 3, 4, 5].map((n) => (
                                    <Star
                                      key={n}
                                      size={14}
                                      color="#F39C12"
                                      fill={n <= r.rating ? "#F39C12" : "none"}
                                    />
                                  ))}
                                </div>
                              </div>
                              <p
                                style={{
                                  fontSize: 13,
                                  color: "#555",
                                  marginBottom: 6,
                                  lineHeight: 1.6,
                                }}
                              >
                                {r.text}
                              </p>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 5,
                                }}
                              >
                                <MapPin size={12} color="#2ECC71" />
                                <span
                                  style={{
                                    fontSize: 12,
                                    color: "rgba(255,255,255,0.35)",
                                  }}
                                >
                                  {r.stationName}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              );
            })()}

          {/* ── NEWS ── */}
          {active === "news" &&
            (() => {
              const NEWS_CATS = ["ایستگاه", "شرکت", "تخفیف", "رویداد", "سایر"];
              return (
                <>
                  {/* Header */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 20,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 20,
                          fontWeight: 700,
                          color: "rgba(255,255,255,0.95)",
                          marginBottom: 4,
                        }}
                      >
                        مدیریت اخبار
                      </div>
                      <div style={{ fontSize: 13, color: "#888" }}>
                        اخبار ایستگاه‌ها و شرکت ولت‌مپ را اینجا منتشر کنید
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setNewsAddMode(true);
                        setNewsEditId(null);
                        setNewsForm({
                          title: "",
                          body: "",
                          category: "ایستگاه",
                          pinned: false,
                          image: null,
                        });
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "10px 20px",
                        background: "#2ECC71",
                        color: "#fff",
                        border: "none",
                        borderRadius: 12,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "Vazirmatn",
                      }}
                    >
                      <Plus size={16} /> خبر جدید
                    </button>
                  </div>

                  {/* فرم افزودن/ویرایش */}
                  {newsAddMode && (
                    <div
                      style={{
                        background: "#fff",
                        borderRadius: 16,
                        border: "1px solid #eef0f3",
                        padding: 24,
                        marginBottom: 24,
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
                        {newsEditId ? "ویرایش خبر" : "افزودن خبر جدید"}
                      </div>

                      {/* آپلود عکس */}
                      <div
                        onClick={() => newsImgRef.current?.click()}
                        style={{
                          border: "2px dashed #e0e0e0",
                          borderRadius: 12,
                          height: 140,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          marginBottom: 16,
                          overflow: "hidden",
                          position: "relative",
                          background: "#fafafa",
                        }}
                      >
                        {newsForm.image ? (
                          <>
                            <img
                              src={newsForm.image}
                              alt=""
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setNewsForm((f) => ({ ...f, image: null }));
                              }}
                              style={{
                                position: "absolute",
                                top: 8,
                                left: 8,
                                width: 28,
                                height: 28,
                                borderRadius: "50%",
                                background: "rgba(0,0,0,0.5)",
                                border: "none",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <X size={14} color="#fff" />
                            </button>
                          </>
                        ) : (
                          <>
                            <Upload size={24} color="#ccc" />
                            <span
                              style={{
                                fontSize: 12,
                                color: "#aaa",
                                marginTop: 8,
                              }}
                            >
                              کلیک کنید یا عکس را بکشید اینجا
                            </span>
                          </>
                        )}
                        <input
                          ref={newsImgRef}
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={handleNewsImage}
                        />
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 12,
                          marginBottom: 12,
                        }}
                      >
                        <div>
                          <label
                            style={{
                              fontSize: 12,
                              color: "#888",
                              display: "block",
                              marginBottom: 6,
                            }}
                          >
                            عنوان خبر *
                          </label>
                          <input
                            value={newsForm.title}
                            onChange={(e) =>
                              setNewsForm((f) => ({
                                ...f,
                                title: e.target.value,
                              }))
                            }
                            placeholder="عنوان را وارد کنید"
                            style={{
                              width: "100%",
                              border: "1px solid #e8eaed",
                              borderRadius: 10,
                              padding: "9px 12px",
                              fontSize: 13,
                              fontFamily: "Vazirmatn",
                              outline: "none",
                              boxSizing: "border-box",
                            }}
                          />
                        </div>
                        <div>
                          <label
                            style={{
                              fontSize: 12,
                              color: "#888",
                              display: "block",
                              marginBottom: 6,
                            }}
                          >
                            دسته‌بندی
                          </label>
                          <select
                            value={newsForm.category}
                            onChange={(e) =>
                              setNewsForm((f) => ({
                                ...f,
                                category: e.target.value,
                              }))
                            }
                            style={{
                              width: "100%",
                              border: "1px solid rgba(255,255,255,0.12)",
                              borderRadius: 10,
                              padding: "9px 12px",
                              fontSize: 13,
                              fontFamily: "Vazirmatn",
                              outline: "none",
                              background: "rgba(255,255,255,0.06)",
                              color: "#1a1a1a",
                            }}
                          >
                            {NEWS_CATS.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div style={{ marginBottom: 12 }}>
                        <label
                          style={{
                            fontSize: 12,
                            color: "#888",
                            display: "block",
                            marginBottom: 6,
                          }}
                        >
                          متن خبر *
                        </label>
                        <textarea
                          value={newsForm.body}
                          onChange={(e) =>
                            setNewsForm((f) => ({ ...f, body: e.target.value }))
                          }
                          rows={4}
                          placeholder="متن کامل خبر را بنویسید..."
                          style={{
                            width: "100%",
                            border: "1px solid rgba(255,255,255,0.12)",
                            borderRadius: 10,
                            padding: "9px 12px",
                            fontSize: 13,
                            fontFamily: "Vazirmatn",
                            outline: "none",
                            resize: "vertical",
                            boxSizing: "border-box",
                            background: "rgba(255,255,255,0.06)",
                            color: "#1a1a1a",
                          }}
                        />
                      </div>

                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          cursor: "pointer",
                          marginBottom: 16,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={newsForm.pinned}
                          onChange={(e) =>
                            setNewsForm((f) => ({
                              ...f,
                              pinned: e.target.checked,
                            }))
                          }
                        />
                        <span style={{ fontSize: 13, color: "#555" }}>
                          سنجاق کردن (نمایش در بالای لیست)
                        </span>
                      </label>

                      <div style={{ display: "flex", gap: 10 }}>
                        <button
                          onClick={handleNewsSave}
                          disabled={
                            newsSaving || !newsForm.title || !newsForm.body
                          }
                          style={{
                            flex: 1,
                            padding: "10px 0",
                            background: "#2ECC71",
                            color: "#fff",
                            border: "none",
                            borderRadius: 10,
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: "pointer",
                            fontFamily: "Vazirmatn",
                            opacity: newsSaving ? 0.7 : 1,
                          }}
                        >
                          {newsSaving
                            ? "در حال ذخیره..."
                            : newsEditId
                              ? "ذخیره تغییرات"
                              : "انتشار خبر"}
                        </button>
                        <button
                          onClick={() => {
                            setNewsAddMode(false);
                            setNewsEditId(null);
                          }}
                          style={{
                            padding: "10px 20px",
                            background: "#f5f5f5",
                            color: "#555",
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
                  )}

                  {/* لیست اخبار */}
                  {newsLoading ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: 40,
                        color: "#aaa",
                      }}
                    >
                      در حال بارگذاری...
                    </div>
                  ) : newsList.length === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: 60,
                        background: "#fff",
                        borderRadius: 16,
                        border: "1px solid #eef0f3",
                      }}
                    >
                      <Newspaper
                        size={40}
                        color="#ddd"
                        style={{ margin: "0 auto 12px" }}
                      />
                      <p style={{ color: "#aaa", fontSize: 14 }}>
                        هنوز خبری منتشر نشده
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: 16 }}>
                      {newsList.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            background: "#fff",
                            borderRadius: 16,
                            border: "1px solid #eef0f3",
                            overflow: "hidden",
                            display: "flex",
                            gap: 0,
                          }}
                        >
                          {item.image && (
                            <div
                              style={{
                                width: 140,
                                flexShrink: 0,
                                overflow: "hidden",
                              }}
                            >
                              <img
                                src={item.image}
                                alt=""
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                            </div>
                          )}
                          <div style={{ flex: 1, padding: "16px 20px" }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 8,
                                marginBottom: 8,
                              }}
                            >
                              {item.pinned && (
                                <Pin
                                  size={14}
                                  color="#2ECC71"
                                  style={{ flexShrink: 0, marginTop: 2 }}
                                />
                              )}
                              <div style={{ flex: 1 }}>
                                <div
                                  style={{
                                    fontSize: 15,
                                    fontWeight: 700,
                                    color: "#1a1a1a",
                                    marginBottom: 4,
                                  }}
                                >
                                  {item.title}
                                </div>
                                <div
                                  style={{
                                    display: "flex",
                                    gap: 8,
                                    marginBottom: 8,
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: 11,
                                      background: "#f0faf5",
                                      color: "#27AE60",
                                      padding: "2px 10px",
                                      borderRadius: 20,
                                    }}
                                  >
                                    {item.category}
                                  </span>
                                  <span style={{ fontSize: 11, color: "#aaa" }}>
                                    {new Date(
                                      item.publishedAt,
                                    ).toLocaleDateString("fa-IR")}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <p
                              style={{
                                fontSize: 13,
                                color: "#666",
                                lineHeight: 1.7,
                                marginBottom: 12,
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {item.body}
                            </p>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button
                                onClick={() => handleNewsEdit(item)}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 5,
                                  padding: "6px 14px",
                                  background: "#f5f7fa",
                                  color: "#555",
                                  border: "none",
                                  borderRadius: 8,
                                  fontSize: 12,
                                  cursor: "pointer",
                                  fontFamily: "Vazirmatn",
                                }}
                              >
                                <Pencil size={13} /> ویرایش
                              </button>
                              <button
                                onClick={() => handleNewsTogglePin(item)}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 5,
                                  padding: "6px 14px",
                                  background: item.pinned
                                    ? "#f0faf5"
                                    : "#f5f7fa",
                                  color: item.pinned ? "#27AE60" : "#555",
                                  border: "none",
                                  borderRadius: 8,
                                  fontSize: 12,
                                  cursor: "pointer",
                                  fontFamily: "Vazirmatn",
                                }}
                              >
                                {item.pinned ? (
                                  <>
                                    <PinOff size={13} /> رفع سنجاق
                                  </>
                                ) : (
                                  <>
                                    <Pin size={13} /> سنجاق
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleNewsDelete(item.id)}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 5,
                                  padding: "6px 14px",
                                  background: "#fef2f2",
                                  color: "#e74c3c",
                                  border: "none",
                                  borderRadius: 8,
                                  fontSize: 12,
                                  cursor: "pointer",
                                  fontFamily: "Vazirmatn",
                                  marginRight: "auto",
                                }}
                              >
                                <Trash2 size={13} /> حذف
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}

          {/* ── STATION REPORTS ── */}
          {active === "stationreports" &&
            (() => {
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
            })()}

          {/* ── REPORTS ── */}
          {active === "reports" && (
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
          )}

          {/* ── OTHER ── */}
          {(active === "chargers" || active === "settings") && (
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
          )}
        </div>
      </div>
    </div>
  );
}
