import { useEffect } from "react";
import { Locate, X } from "lucide-react";

/**
 * مدال راهنمای اولین ورود به صفحه‌ی نقشه:
 * توضیح می‌دهد دکمه‌ی موقعیت نزدیک‌ترین ایستگاه را نشان می‌دهد.
 * بعد از بسته شدن، دیگر نمایش داده نمی‌شود (کنترلش با صفحه‌ی نقشه است).
 *
 * داخل کانتینر نقشه (position: relative) قرار می‌گیرد و فقط همان را می‌پوشاند.
 */
export default function MapLocateTipModal({ onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 1200,
        background: "rgba(15, 23, 42, 0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        direction: "rtl",
        fontFamily: "Vazirmatn",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="map-locate-tip-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[340px] rounded-3xl bg-white p-6 text-center shadow-2xl dark:bg-gray-800"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="بستن"
          className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700"
        >
          <X size={16} className="text-gray-500 dark:text-gray-300" />
        </button>

        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{
            background: "#2ECC71",
            boxShadow: "0 4px 14px rgba(46,204,113,0.5)",
          }}
        >
          <Locate size={26} color="#fff" />
        </div>

        <h2
          id="map-locate-tip-title"
          className="text-base font-bold text-gray-900 dark:text-white"
        >
          نزدیک‌ترین ایستگاه را پیدا کنید
        </h2>

        <p className="mt-2 text-sm leading-7 text-gray-500 dark:text-gray-300">
          با لمس دکمه‌ی سبز موقعیت، که پایین سمت چپ نقشه است، ولت‌مپ جای شما را
          پیدا می‌کند و نزدیک‌ترین ایستگاه شارژ را همراه با مسیر نشان می‌دهد.
        </p>

        <p className="mt-2 text-xs leading-6 text-gray-400 dark:text-gray-500">
          برای این کار باید دسترسی موقعیت مکانی را در مرورگر اجازه دهید.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-2xl py-3 text-sm font-bold text-white"
          style={{ background: "#2ECC71", fontFamily: "Vazirmatn" }}
        >
          متوجه شدم
        </button>
      </div>
    </div>
  );
}
