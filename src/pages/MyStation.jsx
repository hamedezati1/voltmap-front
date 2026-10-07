import { useState } from "react";
import {
  Zap,
  Home,
  BadgeCheck,
  MapPinned,
  ChevronLeft,
  ArrowRight,
} from "lucide-react";
import StationReportForm from "../components/StationReportForm";

const STEPS = [
  {
    n: "۱",
    title: "ایستگاه من چیست؟",
    text: "اگر شارژر برق در خانه، محل کار یا فضای شخصی خودتان دارید، می‌توانید آن را به‌عنوان ایستگاه خودتان در ولت‌مپ معرفی کنید. این ایستگاه با ایستگاه‌های عمومی فرق دارد و متعلق به شماست.",
    Icon: Home,
  },
  {
    n: "۲",
    title: "ثبت برای کسب درآمد",
    text: "با ثبت ایستگاه، راننده‌های خودروی برقی آن را روی نقشه می‌بینند و برای شارژ به شما مراجعه می‌کنند. تعرفه را خودتان مشخص می‌کنید و از همین راه می‌توانید درآمد داشته باشید.",
    Icon: Zap,
  },
  {
    n: "۳",
    title: "تأیید توسط ادمین",
    text: "بعد از ارسال مشخصات، درخواست شما بررسی می‌شود. تا قبل از تأیید، ایستگاه روی نقشه قرار نمی‌گیرد. پس از تأیید ادمین، ایستگاه رسماً ثبت و برای همه قابل مشاهده می‌شود.",
    Icon: BadgeCheck,
  },
  {
    n: "۴",
    title: "نمایش متفاوت روی نقشه",
    text: "ایستگاه تأییدشده با پین طلایی و آیکون خانه نشان داده می‌شود تا از پین سبز ایستگاه‌های عمومی جدا باشد.",
    Icon: MapPinned,
  },
];

function PinSample({ gold }) {
  const main = gold ? "#F0B429" : "#27AE60";
  const dark = gold ? "#C4840A" : "#1a7a40";
  return (
    <svg viewBox="0 0 52 64" width="40" height="50" aria-hidden="true">
      <defs>
        <linearGradient
          id={gold ? "pinGold" : "pinPublic"}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" stopColor={main} />
          <stop offset="100%" stopColor={dark} />
        </linearGradient>
      </defs>
      <path
        d="M26 2 C13.3 2 3 12.3 3 25 C3 38.5 26 62 26 62 C26 62 49 38.5 49 25 C49 12.3 38.7 2 26 2 Z"
        fill={`url(#${gold ? "pinGold" : "pinPublic"})`}
        stroke="white"
        strokeWidth="2.5"
      />
      {gold ? (
        <path
          d="M26 16 L18 23 H20.2 V30 H23.6 V25.2 H28.4 V30 H31.8 V23 H34 Z"
          fill="white"
        />
      ) : (
        <path d="M29 18 L25 25 H28 L26 33 L34 23 H31 L33 18 Z" fill="white" />
      )}
    </svg>
  );
}

export default function MyStation() {
  const [step, setStep] = useState("intro");

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col"
      style={{ paddingBottom: 80 }}
    >
      <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center gap-2">
          {step === "form" && (
            <button
              type="button"
              onClick={() => setStep("intro")}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700"
              aria-label="بازگشت به توضیحات"
            >
              <ArrowRight
                size={16}
                className="text-gray-600 dark:text-gray-200"
              />
            </button>
          )}
          <Zap size={20} className="text-emerald-500" />
          <span className="text-base font-bold text-gray-900 dark:text-white">
            ایستگاه من
          </span>
        </div>
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          {step === "intro"
            ? "شارژر خودتان را ثبت کنید و بعد از تأیید روی نقشه دیده شود"
            : "مشخصات ایستگاه را کامل کنید تا برای بررسی ارسال شود"}
        </p>
      </div>

      {step === "intro" ? (
        <div className="flex-1 overflow-y-auto px-4 py-5">
          <div className="mb-5 rounded-2xl bg-white p-4 dark:bg-gray-800">
            <h1 className="text-base font-bold text-gray-900 dark:text-white">
              ایستگاه شخصی شما در ولت‌مپ
            </h1>
            <p className="mt-2 text-sm leading-7 text-gray-500 dark:text-gray-400">
              این بخش برای صاحب شارژ است. ایستگاه خانگی یا محل کارتان را ثبت
              می‌کنید، ادمین آن را بررسی می‌کند و بعد از تأیید، راننده‌ها همان
              نقطه را روی نقشه با نشان مخصوص شما می‌بینند.
            </p>
          </div>

          <div className="space-y-3">
            {STEPS.map((item) => (
              <div
                key={item.n}
                className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-sm font-bold text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300">
                  {item.n}
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
                    <item.Icon size={15} className="text-emerald-500" />
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs leading-6 text-gray-500 dark:text-gray-400">
                    {item.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-center gap-8 rounded-2xl border border-gray-100 bg-white px-4 py-4 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex flex-col items-center gap-1">
              <PinSample />
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                ایستگاه عمومی
              </span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <PinSample gold />
              <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                ایستگاه شما
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStep("form")}
            className="mt-5 flex w-full items-center justify-center gap-1 rounded-2xl py-3.5 text-sm font-bold text-white"
            style={{ background: "#2ECC71" }}
          >
            ثبت ایستگاه من
            <ChevronLeft size={18} />
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <StationReportForm hideHeader />
        </div>
      )}
    </div>
  );
}
