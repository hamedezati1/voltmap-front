import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Car,
  Plus,
  Loader2,
  Plug,
  BatteryCharging,
  Gauge,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { addVehicle, fetchCars } from "../api";
import { FieldError } from "../components/FieldError";
import { validateVehicle, inputErrorClass } from "../lib/validation";

const inputBase =
  "w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-emerald-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-700/50 dark:text-white dark:focus:bg-gray-700";

const BODY_TYPES = [
  { value: "SEDAN", label: "سدان", emoji: "🚗" },
  { value: "SUV", label: "شاسی‌بلند", emoji: "🚙" },
  { value: "HATCHBACK", label: "هاچ‌بک", emoji: "🚘" },
];

function parseMaxRange(rangeKm) {
  if (!rangeKm) return null;
  const nums = String(rangeKm).match(/\d+/g);
  if (!nums?.length) return null;
  return Number(nums[nums.length - 1]);
}

function carLabel(car) {
  return (
    car.displayName ||
    [car.brand, car.model, car.trim].filter(Boolean).join(" ")
  );
}

export default function AddVehicle() {
  const navigate = useNavigate();
  const [cars, setCars] = useState([]);
  const [loadingCars, setLoadingCars] = useState(true);
  const [bodyType, setBodyType] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [catalogCarId, setCatalogCarId] = useState("");
  const [batteryLevel, setBatteryLevel] = useState("");
  const [year, setYear] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchCars()
      .then(setCars)
      .catch(() => setCars([]))
      .finally(() => setLoadingCars(false));
  }, []);

  const brands = useMemo(() => {
    if (!bodyType) return [];
    return [
      ...new Set(
        cars.filter((c) => c.bodyType === bodyType).map((c) => c.brand),
      ),
    ].sort((a, b) => a.localeCompare(b));
  }, [cars, bodyType]);

  const models = useMemo(() => {
    if (!bodyType || !brand) return [];
    return [
      ...new Set(
        cars
          .filter((c) => c.bodyType === bodyType && c.brand === brand)
          .map((c) => c.model),
      ),
    ].sort((a, b) => a.localeCompare(b));
  }, [cars, bodyType, brand]);

  const variants = useMemo(() => {
    if (!bodyType || !brand || !model) return [];
    return cars.filter(
      (c) => c.bodyType === bodyType && c.brand === brand && c.model === model,
    );
  }, [cars, bodyType, brand, model]);

  const selectedCar = useMemo(
    () => cars.find((c) => String(c.id) === String(catalogCarId)) || null,
    [cars, catalogCarId],
  );

  // اگر فقط یک وریانت باشد، خودکار انتخاب شود
  useEffect(() => {
    if (variants.length === 1) {
      setCatalogCarId(String(variants[0].id));
    } else if (variants.length === 0) {
      setCatalogCarId("");
    } else if (
      catalogCarId &&
      !variants.some((v) => String(v.id) === String(catalogCarId))
    ) {
      setCatalogCarId("");
    }
  }, [variants, catalogCarId]);

  const selectBodyType = (value) => {
    setBodyType(value);
    setBrand("");
    setModel("");
    setCatalogCarId("");
    if (errors.catalogCarId)
      setErrors((prev) => ({ ...prev, catalogCarId: undefined }));
  };

  const selectBrand = (value) => {
    setBrand(value);
    setModel("");
    setCatalogCarId("");
    if (errors.catalogCarId)
      setErrors((prev) => ({ ...prev, catalogCarId: undefined }));
  };

  const selectModel = (value) => {
    setModel(value);
    setCatalogCarId("");
    if (errors.catalogCarId)
      setErrors((prev) => ({ ...prev, catalogCarId: undefined }));
  };

  const handleSubmit = async () => {
    const form = {
      catalogCarId,
      batteryLevel,
      year,
      connector: selectedCar?.connector,
      name: selectedCar ? carLabel(selectedCar) : "",
      estimatedRange: selectedCar ? parseMaxRange(selectedCar.rangeKm) : "",
    };
    const result = validateVehicle(form);
    setErrors(result.errors);
    if (!result.ok) return;

    setSaving(true);
    try {
      const payload = {
        catalogCarId: Number(catalogCarId),
      };
      if (batteryLevel !== "") payload.batteryLevel = Number(batteryLevel);
      if (year !== "") payload.year = Number(year);
      // برای سازگاری با mock و نمایش فوری
      payload.name = form.name;
      payload.connector = form.connector;
      if (form.estimatedRange) payload.estimatedRange = form.estimatedRange;

      await addVehicle(payload);
      navigate("/vehicles", { replace: true });
    } catch {
      // toast از apiClient
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-900"
      style={{ paddingBottom: 80 }}
    >
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(135deg, #2ECC71 0%, #1a8a40 100%)",
            height: 130,
          }}
        />
        <div className="relative px-4 pt-3 pb-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/vehicles")}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm transition-colors hover:bg-white/30"
            >
              <ArrowRight size={20} color="#fff" />
            </button>
            <div>
              <p className="text-base font-semibold text-white">افزودن خودرو</p>
              <p className="text-[11px] text-white/80">
                انتخاب از کاتالوگ خودروهای برقی ایران
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="relative -mt-8 px-4 pb-6">
        <section className="rounded-3xl mt-10 bg-white p-5 shadow-md dark:bg-gray-800">
          {loadingCars ? (
            <div className="flex flex-col items-center gap-3 py-10">
              <Loader2 size={28} className="animate-spin text-emerald-500" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                در حال بارگذاری کاتالوگ...
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* نوع بدنه */}
              <div>
                <label className="mb-2 block text-xs font-medium text-gray-500 dark:text-gray-400">
                  نوع خودرو
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {BODY_TYPES.map((t) => {
                    const active = bodyType === t.value;
                    const count = cars.filter(
                      (c) => c.bodyType === t.value,
                    ).length;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => selectBodyType(t.value)}
                        className={`rounded-2xl border px-2 py-3 text-center transition-all ${
                          active
                            ? "border-emerald-400 bg-emerald-50 shadow-sm dark:border-emerald-500 dark:bg-emerald-900/30"
                            : "border-gray-200 bg-gray-50 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-700/40"
                        }`}
                      >
                        <div className="text-lg leading-none">{t.emoji}</div>
                        <div
                          className={`mt-1.5 text-xs font-bold ${
                            active
                              ? "text-emerald-700 dark:text-emerald-300"
                              : "text-gray-700 dark:text-gray-200"
                          }`}
                        >
                          {t.label}
                        </div>
                        <div className="mt-0.5 text-[10px] text-gray-400">
                          {count} مدل
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* برند */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
                  برند
                </label>
                <select
                  value={brand}
                  disabled={!bodyType}
                  onChange={(e) => selectBrand(e.target.value)}
                  className={`${inputBase} ${inputErrorClass(!!errors.catalogCarId && !brand)}`}
                  style={{ fontFamily: "Vazirmatn" }}
                >
                  <option value="">
                    {bodyType
                      ? "برند را انتخاب کنید"
                      : "اول نوع خودرو را انتخاب کنید"}
                  </option>
                  {brands.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              {/* مدل */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
                  مدل
                </label>
                <select
                  value={model}
                  disabled={!brand}
                  onChange={(e) => selectModel(e.target.value)}
                  className={inputBase}
                  style={{ fontFamily: "Vazirmatn" }}
                >
                  <option value="">
                    {brand ? "مدل را انتخاب کنید" : "اول برند را انتخاب کنید"}
                  </option>
                  {models.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* تریم / نسخه */}
              {variants.length > 1 && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
                    نسخه / تریم
                  </label>
                  <select
                    value={catalogCarId}
                    onChange={(e) => {
                      setCatalogCarId(e.target.value);
                      if (errors.catalogCarId)
                        setErrors((prev) => ({
                          ...prev,
                          catalogCarId: undefined,
                        }));
                    }}
                    className={`${inputBase} ${inputErrorClass(!!errors.catalogCarId)}`}
                    style={{ fontFamily: "Vazirmatn" }}
                  >
                    <option value="">نسخه را انتخاب کنید</option>
                    {variants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.trim || "نسخه استاندارد"} — باتری {v.batteryKwh} kWh
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <FieldError message={errors.catalogCarId} />

              {/* کارت مشخصات انتخاب‌شده */}
              {selectedCar && (
                <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white dark:border-emerald-800 dark:from-emerald-950/40 dark:to-gray-800">
                  <div className="flex items-start gap-3 border-b border-emerald-100 px-4 py-3 dark:border-emerald-900/50">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm">
                      <Car size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2
                          size={14}
                          className="flex-shrink-0 text-emerald-500"
                        />
                        <p className="truncate text-sm font-bold text-gray-900 dark:text-white">
                          {carLabel(selectedCar)}
                        </p>
                      </div>
                      <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                        {BODY_TYPES.find(
                          (t) => t.value === selectedCar.bodyType,
                        )?.label || selectedCar.bodyType}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 p-3">
                    <SpecChip
                      icon={<BatteryCharging size={14} />}
                      label="باتری"
                      value={`${selectedCar.batteryKwh} kWh`}
                    />
                    <SpecChip
                      icon={<Gauge size={14} />}
                      label="برد"
                      value={`${selectedCar.rangeKm} km`}
                    />
                    <SpecChip
                      icon={<Plug size={14} />}
                      label="نازل"
                      value={selectedCar.connector}
                    />
                    <SpecChip
                      icon={<Zap size={14} />}
                      label="شارژ DC"
                      value={`${selectedCar.maxDcKw} kW`}
                    />
                  </div>
                </div>
              )}

              {/* وضعیت فعلی کاربر */}
              <div className="border-t border-gray-100 pt-4 dark:border-gray-700">
                <p className="mb-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
                  وضعیت فعلی خودرو
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
                      درصد باتری
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={batteryLevel}
                      onChange={(e) => {
                        setBatteryLevel(e.target.value);
                        if (errors.batteryLevel)
                          setErrors((prev) => ({
                            ...prev,
                            batteryLevel: undefined,
                          }));
                      }}
                      className={`${inputBase} ${inputErrorClass(!!errors.batteryLevel)}`}
                      placeholder="مثلاً 75"
                    />
                    <FieldError message={errors.batteryLevel} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
                      سال ساخت
                    </label>
                    <input
                      type="number"
                      min={1370}
                      max={1500}
                      value={year}
                      onChange={(e) => {
                        setYear(e.target.value);
                        if (errors.year)
                          setErrors((prev) => ({ ...prev, year: undefined }));
                      }}
                      className={`${inputBase} ${inputErrorClass(!!errors.year)}`}
                      placeholder="اختیاری"
                    />
                    <FieldError message={errors.year} />
                  </div>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={saving || !selectedCar}
                className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white transition-opacity active:opacity-90 disabled:opacity-50"
                style={{ background: "#2ECC71" }}
              >
                {saving ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Plus size={18} />
                )}
                {saving ? "در حال ثبت..." : "افزودن خودرو"}
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function SpecChip({ icon, label, value }) {
  return (
    <div className="rounded-xl bg-white/80 px-3 py-2.5 dark:bg-gray-900/40">
      <div className="mb-1 flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
        {icon}
        <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">
          {label}
        </span>
      </div>
      <p className="truncate text-xs font-bold text-gray-800 dark:text-gray-100">
        {value}
      </p>
    </div>
  );
}
