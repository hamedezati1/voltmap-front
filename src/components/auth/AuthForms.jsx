import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { FieldError } from "../FieldError";
import {
  validateOtpRequest,
  validateOtpVerify,
  normalizePhone,
  inputErrorClass,
} from "../../lib/validation";

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition-colors focus:border-emerald-400 focus:bg-white";

const labelClass = "mb-1.5 block text-xs font-medium text-gray-500";

function useResendCountdown(seconds, resetKey = 0) {
  const [left, setLeft] = useState(seconds);
  // resetKey باعث ریست تایمر بعد از ارسال مجدد می‌شود
  // (حتی اگر مقدار seconds عوض نشده باشد)
  useEffect(() => {
    setLeft(seconds);
  }, [seconds, resetKey]);
  useEffect(() => {
    if (left <= 0) return undefined;
    const t = setTimeout(() => setLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  return left;
}

/**
 * فرم دو مرحله‌ای OTP برای ورود یا ثبت‌نام
 * purpose: 'login' | 'register'
 */
export function OtpAuthForm({
  purpose,
  onRequestOtp,
  onVerifyOtp,
  loading,
  error,
}) {
  const isRegister = purpose === "register";
  const [step, setStep] = useState("phone"); // phone | code
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState({});
  const [resendAfter, setResendAfter] = useState(60);
  const [resendKey, setResendKey] = useState(0);
  const countdown = useResendCountdown(
    step === "code" ? resendAfter : 0,
    resendKey,
  );

  const clearField = (field) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const startResendTimer = (meta) => {
    setResendAfter(meta?.resendAfter || 60);
    setResendKey((k) => k + 1);
  };

  const handleRequest = async (e) => {
    e.preventDefault();
    const result = validateOtpRequest({ phone, name, purpose });
    setErrors(result.errors);
    if (!result.ok) return;

    const normalized = normalizePhone(phone);
    const meta = await onRequestOtp({
      phone: normalized,
      purpose,
      name: isRegister ? name.trim() : undefined,
    });
    if (meta == null) return;
    startResendTimer(meta);
    setPhone(normalized);
    setStep("code");
    setCode("");
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const result = validateOtpVerify({ phone, code, name, purpose });
    setErrors(result.errors);
    if (!result.ok) return;

    await onVerifyOtp({
      phone: normalizePhone(phone),
      code: code.trim(),
      purpose,
      name: isRegister ? name.trim() : undefined,
    });
  };

  const handleResend = async () => {
    if (countdown > 0 || loading) return;
    const meta = await onRequestOtp({
      phone: normalizePhone(phone),
      purpose,
      name: isRegister ? name.trim() : undefined,
    });
    if (meta == null) return;
    startResendTimer(meta);
    setCode("");
  };

  if (step === "code") {
    return (
      <form onSubmit={handleVerify} className="space-y-4" noValidate>
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          کد تأیید به شماره{" "}
          <span className="font-semibold" dir="ltr">
            {phone}
          </span>{" "}
          ارسال شد.
        </p>
        <div>
          <label className={labelClass}>کد تأیید</label>
          <input
            type="text"
            inputMode="numeric"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, "").slice(0, 8));
              clearField("code");
            }}
            placeholder="کد ۵ رقمی"
            className={`${inputClass} text-center tracking-[0.35em] ${inputErrorClass(!!errors.code)}`}
            style={{ fontFamily: "Vazirmatn" }}
            dir="ltr"
            autoComplete="one-time-code"
            maxLength={8}
          />
          <FieldError message={errors.code} />
        </div>
        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white disabled:opacity-60"
          style={{ background: "#2ECC71", fontFamily: "Vazirmatn" }}
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          {isRegister ? "تأیید و ثبت‌نام" : "تأیید و ورود"}
        </button>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <button
            type="button"
            onClick={() => {
              setStep("phone");
              setCode("");
              setErrors({});
            }}
            className="text-emerald-600"
            style={{ fontFamily: "Vazirmatn" }}
          >
            تغییر شماره
          </button>
          <button
            type="button"
            disabled={countdown > 0 || loading}
            onClick={handleResend}
            className="disabled:opacity-50"
            style={{ fontFamily: "Vazirmatn" }}
          >
            {countdown > 0 ? `ارسال مجدد (${countdown})` : "ارسال مجدد کد"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleRequest} className="space-y-4" noValidate>
      {isRegister && (
        <div>
          <label className={labelClass}>نام و نام خانوادگی</label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              clearField("name");
            }}
            placeholder="علی محمدی"
            className={`${inputClass} ${inputErrorClass(!!errors.name)}`}
            style={{ fontFamily: "Vazirmatn" }}
            maxLength={100}
          />
          <FieldError message={errors.name} />
        </div>
      )}
      <div>
        <label className={labelClass}>شماره موبایل</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
            setPhone(digits);
            clearField("phone");
          }}
          placeholder="09123456789"
          className={`${inputClass} ${inputErrorClass(!!errors.phone)}`}
          style={{ fontFamily: "Vazirmatn" }}
          dir="ltr"
          inputMode="numeric"
          maxLength={11}
        />
        <FieldError message={errors.phone} />
        <p className="mt-1.5 text-[11px] text-gray-400">
          کد یک‌بارمصرف به این شماره پیامک می‌شود
        </p>
      </div>
      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white disabled:opacity-60"
        style={{ background: "#2ECC71", fontFamily: "Vazirmatn" }}
      >
        {loading && <Loader2 size={18} className="animate-spin" />}
        دریافت کد تأیید
      </button>
    </form>
  );
}
