/**
 * صفحه گزارش‌ها
 * - نمایش اخبار برای همه کاربران
 * - فرم گزارش ایستگاه جدید برای کاربران طلایی
 *
 * TODO: وقتی به دیتابیس وصل شد:
 *   GET /news, POST /station-reports
 */
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Newspaper,
  Pin,
  Calendar,
  ChevronLeft,
  Loader2,
  RefreshCw,
  Plus,
  MapPin,
  Zap,
  Plug,
  Camera,
  X,
  CheckCircle,
  Crown,
  Home,
  ChevronDown,
  Locate,
} from "lucide-react";
import { fetchNews, submitStationReport } from "../api";
import { useAuth } from "../context/AuthContext";
import { FieldError } from "../components/FieldError";
import { validateStationReport, inputErrorClass } from "../lib/validation";

const CATEGORY_COLORS = {
  ایستگاه: { bg: "#e8faf0", text: "#27AE60" },
  شرکت: { bg: "#EBF5FB", text: "#2980B9" },
  تخفیف: { bg: "#fef9e7", text: "#F39C12" },
  رویداد: { bg: "#f5eef8", text: "#8E44AD" },
  سایر: { bg: "#f0f0f0", text: "#7f8c8d" },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return `${mins} دقیقه پیش`;
  if (hours < 24) return `${hours} ساعت پیش`;
  return `${days} روز پیش`;
}

const CONNECTORS_BY_TYPE = {
  DC: ["CCS2", "GB/T", "CCS2+GB/T"],
  AC: ["Type2", "GB/T", "Type2+GB/T"],
  "AC/DC": ["CCS2+Type2", "CCS2+GB/T", "Type2+GB/T", "CCS2+GB/T+Type2"],
};

const EMPTY_FORM = {
  name: "",
  city: "",
  address: "",
  lat: "",
  lng: "",
  type: "DC",
  connector: "CCS2",
  power: "",
  ports: "",
  price: "",
  hours: "۲۴ ساعته",
  isHome: false,
  ownerNote: "",
  image: null,
};

// ─── فرم گزارش ایستگاه جدید ─────────────────────────────────────────────────
function StationReportForm({ onClose }) {
  const { user } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [locating, setLocating] = useState(false);
  const [errors, setErrors] = useState({});
  const imgRef = useRef(null);

  const f = (key, val) => {
    setForm((prev) => {
      const next = { ...prev, [key]: val };
      if (key === "type") {
        next.connector = CONNECTORS_BY_TYPE[val]?.[0] || "CCS2";
      }
      return next;
    });
    if (errors[key] || (key === "ownerNote" && errors.notes) || errors.name) {
      setErrors((prev) => ({
        ...prev,
        [key]: undefined,
        ...(key === "ownerNote" ? { notes: undefined } : {}),
      }));
    }
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => f("image", ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleLocate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        f("lat", pos.coords.latitude.toFixed(6));
        f("lng", pos.coords.longitude.toFixed(6));
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const handleSubmit = async () => {
    const fieldErrors = {};
    const backend = validateStationReport(form);
    Object.assign(fieldErrors, backend.errors);

    // الزامات UX فرم (علاوه بر بک‌اند)
    if (!form.city.trim()) fieldErrors.city = "شهر الزامی است";
    if (!form.address.trim()) fieldErrors.address = "آدرس الزامی است";
    if (!form.lat || !form.lng)
      fieldErrors.location = "لطفاً موقعیت دقیق ایستگاه را وارد کنید";

    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    setSaving(true);
    try {
      await submitStationReport({
        ...form,
        lat: parseFloat(form.lat),
        lng: parseFloat(form.lng),
        power: parseInt(form.power) || 22,
        ports: parseInt(form.ports) || 1,
        notes: form.ownerNote || undefined,
        reportedBy: user?.id,
        reporterName: user?.name || "کاربر ناشناس",
      });
      setDone(true);
    } finally {
      setSaving(false);
    }
  };

  if (done)
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
          <CheckCircle size={32} className="text-emerald-500" />
        </div>
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">
          گزارش ثبت شد!
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-6 mb-6">
          ایستگاه گزارش‌شده مورد بررسی قرار می‌گیرد.
          <br />
          با تشکر از گزارش شما 🙏
        </p>
        <button
          onClick={onClose}
          className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold"
          style={{ background: "#2ECC71" }}
        >
          بازگشت
        </button>
      </div>
    );

  const inputCls =
    "w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-400 transition-colors";

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
            <Plus size={16} className="text-emerald-500" />
          </div>
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            گزارش ایستگاه جدید
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700"
        >
          <X size={16} className="text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* آپلود عکس */}
      <div
        onClick={() => imgRef.current?.click()}
        className="relative h-36 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 flex flex-col items-center justify-center cursor-pointer overflow-hidden"
      >
        {form.image ? (
          <>
            <img
              src={form.image}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                f("image", null);
              }}
              className="absolute top-2 left-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center"
            >
              <X size={13} color="#fff" />
            </button>
          </>
        ) : (
          <>
            <Camera
              size={22}
              className="text-gray-300 dark:text-gray-500 mb-1"
            />
            <p className="text-xs text-gray-400">عکس ایستگاه (اختیاری)</p>
          </>
        )}
        <input
          ref={imgRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImage}
        />
      </div>

      {/* نوع ایستگاه */}
      <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
        <input
          type="checkbox"
          id="isHome"
          checked={form.isHome}
          onChange={(e) => f("isHome", e.target.checked)}
          className="w-4 h-4 accent-emerald-500"
        />
        <label
          htmlFor="isHome"
          className="text-sm text-blue-700 dark:text-blue-300 cursor-pointer flex items-center gap-1.5"
        >
          <Home size={14} /> ایستگاه خانگی (می‌خواهم در اختیار عموم بگذارم)
        </label>
      </div>

      {/* اطلاعات اصلی */}
      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">
            نام ایستگاه *
          </label>
          <input
            value={form.name}
            onChange={(e) => f("name", e.target.value)}
            placeholder="مثلاً: پارکینگ برج میلاد"
            className={`${inputCls} ${inputErrorClass(!!errors.name)}`}
            style={{ fontFamily: "Vazirmatn" }}
          />
          <FieldError message={errors.name} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">
              شهر *
            </label>
            <input
              value={form.city}
              onChange={(e) => f("city", e.target.value)}
              placeholder="تهران"
              className={`${inputCls} ${inputErrorClass(!!errors.city)}`}
              style={{ fontFamily: "Vazirmatn" }}
            />
            <FieldError message={errors.city} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">
              ساعت کاری
            </label>
            <input
              value={form.hours}
              onChange={(e) => f("hours", e.target.value)}
              placeholder="۲۴ ساعته"
              className={inputCls}
              style={{ fontFamily: "Vazirmatn" }}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">
            آدرس دقیق *
          </label>
          <input
            value={form.address}
            onChange={(e) => f("address", e.target.value)}
            placeholder="آدرس کامل ایستگاه"
            className={`${inputCls} ${inputErrorClass(!!errors.address)}`}
            style={{ fontFamily: "Vazirmatn" }}
          />
          <FieldError message={errors.address} />
        </div>
      </div>

      {/* موقعیت جغرافیایی */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            موقعیت جغرافیایی *
          </label>
          <button
            onClick={handleLocate}
            disabled={locating}
            className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold"
          >
            {locating ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Locate size={12} />
            )}
            موقعیت فعلی
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            value={form.lat}
            onChange={(e) => f("lat", e.target.value)}
            placeholder="عرض جغرافیایی (lat)"
            className={`${inputCls} ${inputErrorClass(!!errors.location)}`}
            type="number"
            step="0.0001"
            dir="ltr"
          />
          <input
            value={form.lng}
            onChange={(e) => f("lng", e.target.value)}
            placeholder="طول جغرافیایی (lng)"
            className={`${inputCls} ${inputErrorClass(!!errors.location)}`}
            type="number"
            step="0.0001"
            dir="ltr"
          />
        </div>
        <FieldError message={errors.location} />
        {form.lat &&
          (parseFloat(form.lat) < 25 || parseFloat(form.lat) > 40) && (
            <p className="text-[11px] text-red-500 mt-1">
              ⚠️ عرض جغرافیایی ایران باید بین ۲۵ تا ۴۰ باشد
            </p>
          )}
      </div>

      {/* مشخصات فنی */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">
              نوع شارژر
            </label>
            <select
              value={form.type}
              onChange={(e) => f("type", e.target.value)}
              className={inputCls}
              style={{ fontFamily: "Vazirmatn" }}
            >
              {["AC", "DC", "AC/DC"].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">
              کانکتور
            </label>
            <select
              value={form.connector}
              onChange={(e) => f("connector", e.target.value)}
              className={inputCls}
              style={{ fontFamily: "Vazirmatn" }}
            >
              {(CONNECTORS_BY_TYPE[form.type] || []).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">
              توان (kW)
            </label>
            <input
              value={form.power}
              onChange={(e) => f("power", e.target.value)}
              placeholder="22"
              className={inputCls}
              type="number"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">
              تعداد پورت
            </label>
            <input
              value={form.ports}
              onChange={(e) => f("ports", e.target.value)}
              placeholder="1"
              className={inputCls}
              type="number"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">
              قیمت/kWh
            </label>
            <input
              value={form.price}
              onChange={(e) => f("price", e.target.value)}
              placeholder="رایگان"
              className={inputCls}
              style={{ fontFamily: "Vazirmatn" }}
            />
          </div>
        </div>
      </div>

      {/* توضیحات */}
      <div>
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">
          توضیحات اضافه (اختیاری)
        </label>
        <textarea
          value={form.ownerNote}
          onChange={(e) => f("ownerNote", e.target.value)}
          rows={3}
          placeholder="اطلاعات بیشتر درباره ایستگاه، محدودیت‌ها، نحوه دسترسی..."
          maxLength={1000}
          className={`${inputCls} resize-none ${inputErrorClass(!!errors.notes)}`}
          style={{ fontFamily: "Vazirmatn" }}
        />
        <div className="mt-1 flex items-center justify-between">
          <FieldError message={errors.notes} />
          <span className="text-[10px] text-gray-400">
            {(form.ownerNote || "").length}/1000
          </span>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={saving}
        className="w-full py-3.5 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
        style={{ background: "#2ECC71", fontFamily: "Vazirmatn" }}
      >
        {saving ? (
          <>
            <Loader2 size={16} className="animate-spin" /> در حال ثبت...
          </>
        ) : (
          <>
            <CheckCircle size={16} /> ثبت گزارش
          </>
        )}
      </button>
    </div>
  );
}

// ─── کامپوننت اصلی Reports ────────────────────────────────────────────────────
export default function Reports() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isGold = user?.membership === "ویژه" || user?.membership === "طلایی";

  const [tab, setTab] = useState("news"); // 'news' | 'report'
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [activeCategory, setActiveCategory] = useState("همه");

  const load = () => {
    setLoading(true);
    fetchNews()
      .then(setNews)
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, []);

  const categories = [
    "همه",
    ...Array.from(new Set(news.map((n) => n.category))),
  ];
  const filtered =
    activeCategory === "همه"
      ? news
      : news.filter((n) => n.category === activeCategory);
  const pinned = filtered.filter((n) => n.pinned);
  const regular = filtered.filter((n) => !n.pinned);

  // نمایش جزئیات یک خبر
  if (selected) {
    const cat = CATEGORY_COLORS[selected.category] || CATEGORY_COLORS["سایر"];
    return (
      <div
        className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col"
        style={{ paddingBottom: 80 }}
      >
        <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSelected(null)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700"
          >
            <ChevronLeft
              size={20}
              className="text-gray-700 dark:text-gray-200"
            />
          </button>
          <span className="text-sm font-semibold text-gray-900 dark:text-white flex-1 truncate">
            {selected.title}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {selected.image && (
            <div style={{ height: 220, overflow: "hidden" }}>
              <img
                src={selected.image}
                alt={selected.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: cat.bg, color: cat.text }}
              >
                {selected.category}
              </span>
              {selected.pinned && (
                <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                  <Pin size={11} /> سنجاق شده
                </span>
              )}
              <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mr-auto">
                <Calendar size={11} />
                {new Date(selected.publishedAt).toLocaleDateString("fa-IR")}
              </span>
            </div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white mb-4 leading-7">
              {selected.title}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-7 whitespace-pre-wrap">
              {selected.body}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col"
      style={{ paddingBottom: 80 }}
    >
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Newspaper size={20} className="text-emerald-500" />
            <span className="text-base font-bold text-gray-900 dark:text-white">
              اخبار و گزارش‌ها
            </span>
          </div>
          <button
            onClick={load}
            className="h-8 w-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700"
          >
            <RefreshCw
              size={15}
              className={`text-gray-500 dark:text-gray-400 ${loading ? "animate-spin" : ""}`}
            />
          </button>
        </div>

        {/* تب‌ها */}
        <div className="flex px-4 pb-3 gap-2">
          <button
            onClick={() => setTab("news")}
            className="flex-1 py-2 rounded-xl text-xs font-semibold transition-colors"
            style={{
              background: tab === "news" ? "#2ECC71" : "transparent",
              color: tab === "news" ? "#fff" : "#888",
              border: tab === "news" ? "none" : "1px solid #e5e7eb",
            }}
          >
            اخبار
          </button>
          <button
            onClick={() => setTab("report")}
            className="flex-1 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            style={{
              background: tab === "report" ? "#2ECC71" : "transparent",
              color: tab === "report" ? "#fff" : "#888",
              border: tab === "report" ? "none" : "1px solid #e5e7eb",
            }}
          >
            <Plus size={12} />
            گزارش ایستگاه جدید
          </button>
        </div>

        {/* فیلتر دسته — فقط توی تب اخبار */}
        {tab === "news" && !loading && categories.length > 1 && (
          <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors"
                style={{
                  background:
                    activeCategory === cat ? "#2ECC71" : "transparent",
                  borderColor: activeCategory === cat ? "#2ECC71" : "#e0e0e0",
                  color: activeCategory === cat ? "#fff" : undefined,
                  fontFamily: "Vazirmatn",
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* تب گزارش ایستگاه */}
        {tab === "report" && (
          <StationReportForm onClose={() => setTab("news")} />
        )}

        {/* تب اخبار */}
        {tab === "news" && (
          <div className="p-4 space-y-4">
            {loading && (
              <div className="flex flex-col items-center gap-3 py-20">
                <Loader2 size={28} className="animate-spin text-emerald-500" />
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  در حال بارگذاری...
                </p>
              </div>
            )}

            {!loading && filtered.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-20">
                <Newspaper
                  size={40}
                  className="text-gray-200 dark:text-gray-700"
                />
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  خبری برای نمایش وجود ندارد
                </p>
              </div>
            )}

            {!loading && pinned.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-3">
                  <Pin size={13} className="text-emerald-500" />
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    اخبار مهم
                  </span>
                </div>
                <div className="space-y-3">
                  {pinned.map((item) => (
                    <NewsCard
                      key={item.id}
                      item={item}
                      onClick={() => setSelected(item)}
                    />
                  ))}
                </div>
              </div>
            )}

            {!loading && regular.length > 0 && (
              <div>
                {pinned.length > 0 && (
                  <div className="flex items-center gap-1.5 mb-3 mt-2">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      آخرین اخبار
                    </span>
                  </div>
                )}
                <div className="space-y-3">
                  {regular.map((item) => (
                    <NewsCard
                      key={item.id}
                      item={item}
                      onClick={() => setSelected(item)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function NewsCard({ item, onClick }) {
  const cat = CATEGORY_COLORS[item.category] || CATEGORY_COLORS["سایر"];
  return (
    <button
      onClick={onClick}
      className="w-full text-right rounded-2xl bg-white dark:bg-gray-800 shadow-sm overflow-hidden transition-transform active:scale-[0.99] border border-gray-100 dark:border-gray-700"
    >
      {item.image && (
        <div style={{ height: 160, overflow: "hidden" }}>
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ background: cat.bg, color: cat.text }}
          >
            {item.category}
          </span>
          {item.pinned && (
            <Pin size={11} className="text-emerald-500 flex-shrink-0" />
          )}
          <span className="text-[11px] text-gray-400 dark:text-gray-500 mr-auto">
            {timeAgo(item.publishedAt)}
          </span>
        </div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1.5 leading-6">
          {item.title}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-5 line-clamp-2">
          {item.body}
        </p>
        <div className="mt-3 flex items-center justify-end">
          <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
            ادامه مطلب <ChevronLeft size={12} />
          </span>
        </div>
      </div>
    </button>
  );
}
