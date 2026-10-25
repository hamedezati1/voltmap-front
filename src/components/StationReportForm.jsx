import { useState, useRef } from "react";
import {
  Plus,
  Home,
  Camera,
  X,
  CheckCircle,
  Loader2,
  Locate,
  Lock,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { submitStationReport } from "../api";
import { useAuth } from "../context/AuthContext";
import { FieldError } from "./FieldError";
import { validateStationReport, inputErrorClass } from "../lib/validation";
import { canHostHomeStation, membershipLevel } from "../lib/membership";
import { startGoldPayment } from "../pages/trip/startGoldPayment";

const CONNECTORS_BY_TYPE = {
  DC: ["CCS2", "GB/T", "CCS2+GB/T"],
  AC: ["Type2", "GB/T", "Type2+GB/T"],
  "AC/DC": ["CCS2+Type2", "CCS2+GB/T", "Type2+GB/T", "CCS2+GB/T+Type2"],
};

// هیچ گزینه‌ای از قبل انتخاب نشده؛ کاربر باید همه را خودش مشخص کند
const EMPTY_FORM = {
  name: "",
  city: "",
  address: "",
  lat: "",
  lng: "",
  type: "",
  connector: "",
  power: "",
  ports: "",
  price: "",
  isFree: false,
  hours: "۲۴ ساعته",
  isHome: false,
  ownerNote: "",
  image: null,
};

const FIELD_ORDER = [
  "image",
  "name",
  "city",
  "hours",
  "address",
  "location",
  "type",
  "connector",
  "power",
  "ports",
  "price",
  "notes",
];

/** عکس را کوچک می‌کند تا ذخیره‌سازی (localStorage / آپلود) سنگین نشود */
function readAndShrinkImage(file, maxSide = 1280, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve(reader.result);
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        if (scale === 1 && file.size < 400 * 1024) {
          resolve(reader.result);
          return;
        }
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function Label({ children, required = true }) {
  return (
    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">
      {children}
      {required && <span className="text-red-500 mr-0.5">*</span>}
    </label>
  );
}

export default function StationReportForm({ onClose, hideHeader = false }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canHost = canHostHomeStation(user);

  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [submittedHome, setSubmittedHome] = useState(false);
  const [locating, setLocating] = useState(false);
  const [errors, setErrors] = useState({});
  const imgRef = useRef(null);
  const rootRef = useRef(null);

  const errorCount = Object.values(errors).filter(Boolean).length;

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setDone(false);
  };

  const clearError = (...keys) =>
    setErrors((prev) => {
      const next = { ...prev };
      keys.forEach((k) => delete next[k]);
      return next;
    });

  const f = (key, val) => {
    setForm((prev) => {
      const next = { ...prev, [key]: val };
      if (key === "type") next.connector = "";
      if (key === "isFree") next.price = val ? "" : prev.price;
      return next;
    });
    const map = {
      ownerNote: ["notes"],
      lat: ["location"],
      lng: ["location"],
      isFree: ["price"],
    };
    clearError(key, ...(map[key] || []));
    if (key === "type") clearError("connector");
  };

  const handleImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      f("image", await readAndShrinkImage(file));
    } catch {
      setErrors((prev) => ({ ...prev, image: "خواندن عکس ناموفق بود" }));
    }
    e.target.value = "";
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

  /** همه‌ی فیلدها الزامی‌اند؛ اگر یکی ناقص باشد ثبت انجام نمی‌شود */
  const validate = () => {
    const e = {};
    const backend = validateStationReport(form);
    Object.assign(e, backend.errors);

    // if (!form.image) e.image = "عکس ایستگاه الزامی است";
    if (!form.name.trim()) e.name = "نام ایستگاه الزامی است";
    if (!form.city.trim()) e.city = "شهر الزامی است";
    if (!form.hours.trim()) e.hours = "ساعت کاری الزامی است";
    if (!form.address.trim()) e.address = "آدرس دقیق الزامی است";

    const lat = parseFloat(form.lat);
    const lng = parseFloat(form.lng);
    if (form.lat === "" || form.lng === "" || Number.isNaN(lat) || Number.isNaN(lng)) {
      e.location = "عرض و طول جغرافیایی الزامی است";
    } else if (lat < 25 || lat > 40 || lng < 44 || lng > 64) {
      e.location = "موقعیت باید داخل ایران باشد (عرض ۲۵ تا ۴۰ و طول ۴۴ تا ۶۴)";
    }

    if (!form.type) e.type = "نوع شارژر را انتخاب کنید";
    if (!form.connector) {
      e.connector = form.type
        ? "کانکتور را انتخاب کنید"
        : "ابتدا نوع شارژر را انتخاب کنید";
    }

    const power = Number(form.power);
    if (form.power === "" || !Number.isFinite(power) || power <= 0) {
      e.power = "توان شارژر را به kW وارد کنید";
    }
    const ports = Number(form.ports);
    if (form.ports === "" || !Number.isInteger(ports) || ports < 1) {
      e.ports = "تعداد پورت باید عدد صحیح و حداقل ۱ باشد";
    }

    if (!form.isFree) {
      const price = Number(form.price);
      if (form.price === "" || !Number.isFinite(price) || price <= 0) {
        e.price = "قیمت را وارد کنید یا «رایگان» را بزنید";
      }
    }

    if (!form.ownerNote.trim()) e.notes = "توضیحات الزامی است";
    return e;
  };

  const scrollToFirstError = (errs) => {
    const first = FIELD_ORDER.find((k) => errs[k]);
    if (!first) return;
    requestAnimationFrame(() => {
      rootRef.current
        ?.querySelector(`[data-field="${first}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  const handleSubmit = async () => {
    if (!canHost) {
      startGoldPayment({ navigate, returnTo: "/my-station" })
      return
    }

    const fieldErrors = validate();
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) {
      scrollToFirstError(fieldErrors);
      return;
    }

    // ایستگاه خانگی فقط برای پرو/پلاس
    // TODO: همین قانون باید سمت بک‌اند هم اعمال شود (رد درخواست isHome از کاربر رایگان)
    const asHome = canHost && form.isHome;

    setSaving(true);
    try {
      await submitStationReport({
        ...form,
        lat: parseFloat(form.lat),
        lng: parseFloat(form.lng),
        power: Number(form.power),
        ports: Number(form.ports),
        price: form.isFree ? "رایگان" : String(form.price),
        isFree: form.isFree,
        isHome: asHome,
        notes: form.ownerNote.trim(),
        reportedBy: user?.id,
        reporterName: user?.name || "کاربر ناشناس",
        reporterMembership: membershipLevel(user),
      });
      setSubmittedHome(asHome);
      setDone(true);
    } catch (err) {
      setErrors({ submit: err?.message || "ثبت ایستگاه ناموفق بود" });
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
          درخواست ثبت شد
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-6 mb-6">
          ایستگاه شما برای بررسی به ادمین ارسال شد.
          <br />
          {submittedHome
            ? "بعد از تأیید، به‌عنوان ایستگاه خانگی با پین طلایی و آیکون خانه برای کاربران پرو و پلاس روی نقشه دیده می‌شود."
            : "بعد از تأیید، روی نقشه برای همه نمایش داده می‌شود."}
        </p>
        <button
          onClick={onClose || resetForm}
          className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold"
          style={{ background: "#2ECC71" }}
        >
          {onClose ? "بازگشت" : "ثبت ایستگاه دیگر"}
        </button>
      </div>
    );

  const inputCls =
    "w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-400 transition-colors";
  const err = (k) => inputErrorClass(!!errors[k]);

  return (
    <div ref={rootRef} className="p-4 space-y-4">
      {!hideHeader && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
              <Plus size={16} className="text-emerald-500" />
            </div>
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              ثبت ایستگاه جدید
            </span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700"
            >
              <X size={16} className="text-gray-500 dark:text-gray-400" />
            </button>
          )}
        </div>
      )}

      <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-5">
        همه‌ی فیلدها الزامی است. تا همه‌ی اطلاعات کامل نشود، ایستگاه ثبت نمی‌شود.
      </p>

      <div data-field="image">
        <Label>عکس ایستگاه</Label>
        <div
          onClick={() => imgRef.current?.click()}
          className={`relative h-36 rounded-2xl border-2 border-dashed bg-gray-50 dark:bg-gray-700/50 flex flex-col items-center justify-center cursor-pointer overflow-hidden ${
            errors.image
              ? "border-red-400"
              : "border-gray-200 dark:border-gray-600"
          }`}
        >
          {form.image ? (
            <>
              <img
                src={form.image}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  f("image", null);
                }}
                className="absolute top-2 left-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center"
                aria-label="حذف عکس"
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
              <p className="text-xs text-gray-400">برای انتخاب عکس لمس کنید</p>
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
        <FieldError message={errors.image} />
      </div>

      {canHost ? (
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
      ) : (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
          <Lock size={14} className="mt-0.5 text-gray-400 flex-shrink-0" />
          <div className="text-xs leading-6 text-gray-500 dark:text-gray-400">
            با اشتراک رایگان امکان ثبت ایستگاه نیست.{" "}
            <button
              type="button"
              onClick={() =>
                startGoldPayment({ navigate, returnTo: "/my-station" })
              }
              className="font-semibold text-emerald-600 dark:text-emerald-400"
            >
              ارتقای اشتراک
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div data-field="name">
          <Label>نام ایستگاه</Label>
          <input
            value={form.name}
            onChange={(e) => f("name", e.target.value)}
            placeholder="مثلاً: پارکینگ برج میلاد"
            className={`${inputCls} ${err("name")}`}
            style={{ fontFamily: "Vazirmatn" }}
          />
          <FieldError message={errors.name} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div data-field="city">
            <Label>شهر</Label>
            <input
              value={form.city}
              onChange={(e) => f("city", e.target.value)}
              placeholder="تهران"
              className={`${inputCls} ${err("city")}`}
              style={{ fontFamily: "Vazirmatn" }}
            />
            <FieldError message={errors.city} />
          </div>
          <div data-field="hours">
            <Label>ساعت کاری</Label>
            <input
              value={form.hours}
              onChange={(e) => f("hours", e.target.value)}
              placeholder="۲۴ ساعته"
              className={`${inputCls} ${err("hours")}`}
              style={{ fontFamily: "Vazirmatn" }}
            />
            <FieldError message={errors.hours} />
          </div>
        </div>

        <div data-field="address">
          <Label>آدرس دقیق</Label>
          <input
            value={form.address}
            onChange={(e) => f("address", e.target.value)}
            placeholder="آدرس کامل ایستگاه"
            className={`${inputCls} ${err("address")}`}
            style={{ fontFamily: "Vazirmatn" }}
          />
          <FieldError message={errors.address} />
        </div>
      </div>

      <div data-field="location">
        <div className="flex items-center justify-between mb-1">
          <Label>موقعیت جغرافیایی</Label>
          <button
            type="button"
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
            className={`${inputCls} ${err("location")}`}
            type="number"
            step="0.0001"
            dir="ltr"
          />
          <input
            value={form.lng}
            onChange={(e) => f("lng", e.target.value)}
            placeholder="طول جغرافیایی (lng)"
            className={`${inputCls} ${err("location")}`}
            type="number"
            step="0.0001"
            dir="ltr"
          />
        </div>
        <FieldError message={errors.location} />
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div data-field="type">
            <Label>نوع شارژر</Label>
            <select
              value={form.type}
              onChange={(e) => f("type", e.target.value)}
              className={`${inputCls} ${err("type")}`}
              style={{ fontFamily: "Vazirmatn" }}
            >
              <option value="" disabled>
                انتخاب کنید
              </option>
              {["AC", "DC", "AC/DC"].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <FieldError message={errors.type} />
          </div>
          <div data-field="connector">
            <Label>کانکتور</Label>
            <select
              value={form.connector}
              onChange={(e) => f("connector", e.target.value)}
              disabled={!form.type}
              className={`${inputCls} ${err("connector")} disabled:opacity-60`}
              style={{ fontFamily: "Vazirmatn" }}
            >
              <option value="" disabled>
                {form.type ? "انتخاب کنید" : "ابتدا نوع شارژر"}
              </option>
              {(CONNECTORS_BY_TYPE[form.type] || []).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <FieldError message={errors.connector} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div data-field="power">
            <Label>توان (kW)</Label>
            <input
              value={form.power}
              onChange={(e) => f("power", e.target.value)}
              placeholder="22"
              className={`${inputCls} ${err("power")}`}
              type="number"
              min="1"
              dir="ltr"
            />
            <FieldError message={errors.power} />
          </div>
          <div data-field="ports">
            <Label>تعداد پورت</Label>
            <input
              value={form.ports}
              onChange={(e) => f("ports", e.target.value)}
              placeholder="1"
              className={`${inputCls} ${err("ports")}`}
              type="number"
              min="1"
              step="1"
              dir="ltr"
            />
            <FieldError message={errors.ports} />
          </div>
        </div>

        <div data-field="price">
          <div className="flex items-center justify-between mb-1">
            <Label>قیمت هر kWh (تومان)</Label>
            <label className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isFree}
                onChange={(e) => f("isFree", e.target.checked)}
                className="w-3.5 h-3.5 accent-emerald-500"
              />
              رایگان
            </label>
          </div>
          <input
            value={form.isFree ? "" : form.price}
            onChange={(e) => f("price", e.target.value)}
            disabled={form.isFree}
            placeholder={form.isFree ? "رایگان" : "مثلاً 3500"}
            className={`${inputCls} ${err("price")} disabled:opacity-60`}
            type="number"
            min="1"
            dir="ltr"
          />
          <FieldError message={errors.price} />
        </div>
      </div>

      <div data-field="notes">
        <Label>توضیحات</Label>
        <textarea
          value={form.ownerNote}
          onChange={(e) => f("ownerNote", e.target.value)}
          rows={3}
          placeholder="اطلاعات بیشتر درباره ایستگاه، محدودیت‌ها، نحوه دسترسی..."
          maxLength={1000}
          className={`${inputCls} resize-none ${err("notes")}`}
          style={{ fontFamily: "Vazirmatn" }}
        />
        <div className="mt-1 flex items-center justify-between">
          <FieldError message={errors.notes} />
          <span className="text-[10px] text-gray-400">
            {(form.ownerNote || "").length}/1000
          </span>
        </div>
      </div>

      {(errorCount > 0 || errors.submit) && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-6 text-red-600 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
          <AlertCircle size={14} className="mt-1 flex-shrink-0" />
          <span>
            {errors.submit ||
              `${errorCount.toLocaleString("fa-IR")} فیلد ناقص یا نامعتبر است. بعد از تکمیل همه‌ی فیلدها دوباره ثبت کنید.`}
          </span>
        </div>
      )}

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
            <CheckCircle size={16} /> ثبت ایستگاه
          </>
        )}
      </button>
    </div>
  );
}
