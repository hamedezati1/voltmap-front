import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Crown, CreditCard } from "lucide-react";

export default function GoldPaymentPlaceholder() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.returnTo || "/trip";

  return (
    <div
      className="flex min-h-screen flex-col bg-gray-50 px-4 py-8 dark:bg-gray-900"
      style={{ paddingBottom: 96 }}
    >
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-8 flex items-center gap-1 self-start text-sm font-semibold text-gray-500 dark:text-gray-400"
      >
        <ArrowRight size={16} /> بازگشت
      </button>

      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-50 dark:bg-amber-900/30">
          <Crown size={36} color="#F59E0B" />
        </div>
        <h1 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
          اشتراک طلایی
        </h1>
        <p className="mb-8 max-w-xs text-sm leading-7 text-gray-500 dark:text-gray-400">
          برنامه‌ریزی سفر فقط برای اعضای طلایی فعال است. درگاه پرداخت هنوز وصل
          نشده؛ این صفحه جای اتصال درگاه است.
        </p>

        <button
          type="button"
          disabled
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white opacity-60"
          style={{ background: "#F59E0B", fontFamily: "Vazirmatn" }}
        >
          <CreditCard size={18} /> پرداخت (به‌زودی)
        </button>
        <p className="mb-6 text-[11px] text-gray-400">
          TODO: این دکمه را به درگاه واقعی وصل کنید — منطق در{" "}
          <span className="font-mono">startGoldPayment.js</span>
        </p>

        <button
          type="button"
          onClick={() => navigate(returnTo)}
          className="text-sm font-semibold text-emerald-600 dark:text-emerald-400"
        >
          بازگشت به سفر
        </button>
      </div>
    </div>
  );
}
