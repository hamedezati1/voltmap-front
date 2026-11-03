import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check, Heart, Loader2 } from "lucide-react";
import { checkoutDonation } from "../api";
import { useAuth } from "../context/AuthContext";
import { formatToman } from "../lib/money";

const MIN_TOMAN = 1000;
const MAX_TOMAN = 50_000_000;
const PRESETS = [50_000, 100_000, 200_000, 500_000];
const RETURN_KEY = "voltmap_payment_return";

const POINTS = [
  "نگهداری نقشه، سرورها و داده‌های ایستگاه",
  "بررسی ایستگاه‌های تازه‌ای که کاربران ثبت می‌کنند",
  "پشتیبانی و ادامهٔ ساخت ولت‌مپ",
];

function parseToman(raw) {
  const digits = String(raw)
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[^\d]/g, "");
  if (!digits) return null;
  const value = Number(digits);
  if (!Number.isSafeInteger(value)) return null;
  return value;
}

export default function Donate() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [raw, setRaw] = useState("100000");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const amount = parseToman(raw);
  const amountOk = amount != null && amount >= MIN_TOMAN && amount <= MAX_TOMAN;

  const pay = async () => {
    setError("");
    if (!amountOk) {
      setError("مبلغ را بین ۱٬۰۰۰ و ۱۰۰٬۰۰۰٬۰۰۰ تومان وارد کنید.");
      return;
    }
    if (!isAuthenticated) {
      navigate("/auth", { state: { from: { pathname: "/donate" } } });
      return;
    }
    setSubmitting(true);
    try {
      const result = await checkoutDonation(amount);
      sessionStorage.setItem(RETURN_KEY, "/");
      window.location.assign(result.paymentUrl);
    } catch (err) {
      setError(err.message || "اتصال به درگاه ناموفق بود");
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-900"
      style={{ paddingBottom: 96 }}
    >
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(135deg, #2ECC71 0%, #1a8a40 100%)",
            height: 118,
          }}
        />
        <div className="relative flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20"
            aria-label="بازگشت"
          >
            <ArrowRight size={20} color="#fff" />
          </button>
          <Heart size={18} color="#fff" />
          <span className="text-base font-semibold text-white">
            حمایت از ولت‌مپ
          </span>
        </div>
      </div>

      <main className="relative mt-2 space-y-4 px-4 pb-6">
        <section className="rounded-3xl bg-white p-5 shadow-md dark:bg-gray-800">
          <h1 className="text-base font-bold text-gray-900 dark:text-white">
            اگر مایلید، به تیم کمک کنید
          </h1>
          <p className="mt-2 text-sm leading-7 text-gray-500 dark:text-gray-400">
            ولت‌مپ با کمک کاربران ایستگاه‌های شارژ را روی نقشه نگه می‌دارد. هر
            مبلغی که دوست دارید وارد کنید و همان را در درگاه واریز کنید. این
            پرداخت داوطلبانه است و اشتراک، سطح دسترسی یا امکانات حساب شما را
            تغییر نمی‌دهد.
          </p>
          <ul className="mt-4 space-y-2">
            {POINTS.map((point) => (
              <li
                key={point}
                className="flex items-start gap-2 text-xs leading-6 text-gray-600 dark:text-gray-300"
              >
                <Check
                  size={14}
                  className="mt-1 flex-shrink-0 text-emerald-500"
                />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm dark:bg-gray-800">
          <p className="text-sm font-bold text-gray-900 dark:text-white">
            مبلغ حمایت
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {PRESETS.map((preset) => {
              const selected = amount === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setRaw(String(preset));
                    setError("");
                  }}
                  className="rounded-2xl px-3 py-3 text-sm font-bold"
                  style={{
                    background: selected ? "#2ECC71" : "transparent",
                    color: selected ? "#fff" : "#fff",
                    border: selected
                      ? "1.5px solid #2ECC71"
                      : "1px solid #e5e7eb",
                  }}
                >
                  {formatToman(preset)}
                </button>
              );
            })}
          </div>

          <label
            className="mt-4 block text-xs text-gray-400"
            htmlFor="donation-amount"
          >
            یا مبلغ دلخواه (تومان)
          </label>
          <input
            id="donation-amount"
            inputMode="numeric"
            value={raw}
            onChange={(event) => {
              setRaw(event.target.value);
              setError("");
            }}
            className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-900 outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
          <p className="mt-2 text-xs leading-6 text-gray-500 dark:text-gray-400">
            {amountOk
              ? `مبلغ پرداختی: ${formatToman(amount)}`
              : "حداقل ۱٬۰۰۰ و حداکثر ۱۰۰٬۰۰۰٬۰۰۰ تومان"}
          </p>

          {error && (
            <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs leading-6 text-red-600 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </p>
          )}

          {!isAuthenticated && (
            <p className="mt-3 text-xs leading-6 text-gray-500 dark:text-gray-400">
              برای واریز باید وارد حساب شوید. بعد از ورود به همین صفحه
              برمی‌گردید.
            </p>
          )}

          <button
            type="button"
            onClick={pay}
            disabled={submitting || !amountOk}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white disabled:opacity-60"
            style={{ background: "#2ECC71" }}
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {submitting
              ? "در حال اتصال به درگاه..."
              : isAuthenticated
                ? "پرداخت و حمایت"
                : "ورود و حمایت"}
          </button>
        </section>
      </main>
    </div>
  );
}
