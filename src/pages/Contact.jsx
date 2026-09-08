import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Mail,
  Phone,
  Instagram,
  Linkedin,
  Copy,
  Check,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";
import { COMPANY } from "../data/company";

const CONTACTS = [
  {
    Icon: Mail,
    label: "ایمیل",
    value: COMPANY.email,
    href: `mailto:${COMPANY.email}`,
    color: "#3498DB",
    bg: "#EBF5FB",
  },
  {
    Icon: Phone,
    label: "شماره تلفن",
    value: COMPANY.phone,
    href: COMPANY.phoneHref,
    color: "#27AE60",
    bg: "#e8faf0",
  },
  {
    Icon: Instagram,
    label: "اینستاگرام",
    value: COMPANY.instagram,
    href: COMPANY.instagramUrl,
    color: "#E1306C",
    bg: "#fde8ef",
  },
  {
    Icon: Linkedin,
    label: "لینکدین",
    value: COMPANY.linkedin,
    href: COMPANY.linkedinUrl,
    color: "#0A66C2",
    bg: "#e8f1fa",
  },
];

export default function Contact() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(null);

  const copyValue = async (e, value, key) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className="h-screen bg-gray-50 dark:bg-gray-900"
      style={{ paddingBottom: 80 }}
    >
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(135deg, #2ECC71 0%, #1a8a40 100%)",
            height: 110,
          }}
        />
        <div className="relative flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm transition-colors hover:bg-white/30"
            aria-label="بازگشت"
          >
            <ArrowRight size={20} color="#fff" />
          </button>
          <span className="text-base font-semibold text-white">
            ارتباط با ما
          </span>
        </div>
      </div>

      <main className="relative  mt-2 px-4 pb-6">
        <section className="rounded-3xl bg-white p-5 shadow-md dark:bg-gray-800">
          <h1 className="text-base font-bold text-gray-900 dark:text-white">
            {COMPANY.name}
            <span className="mr-1.5 text-sm font-medium text-gray-400">
              {COMPANY.nameEn}
            </span>
          </h1>
          <p className="mt-2 text-sm leading-7 text-gray-500 dark:text-gray-400">
            برای پیشنهاد، گزارش مشکل یا همکاری با تیم ولت‌مپ از راه‌های زیر با
            ما در ارتباط باشید.
          </p>
        </section>

        <section className="mt-4 overflow-hidden rounded-3xl bg-white shadow-sm dark:bg-gray-800">
          {CONTACTS.map(({ Icon, label, value, href, color, bg }, i) => (
            <div
              key={label}
              className="flex w-full items-center gap-3 px-4 py-3.5"
              style={{
                borderBottom:
                  i < CONTACTS.length - 1 ? "1px solid #f5f5f5" : "none",
              }}
            >
              <a
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={
                  href.startsWith("http") ? "noopener noreferrer" : undefined
                }
                className="flex min-w-0 flex-1 items-center gap-3 text-right"
              >
                <div
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                  style={{ background: bg, color }}
                >
                  <Icon size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {label}
                  </p>
                  <p
                    className="mt-0.5 truncate text-sm font-semibold text-gray-900 dark:text-white"
                    dir={
                      label === "ایمیل" || label === "لینکدین" ? "ltr" : "rtl"
                    }
                  >
                    {value}
                  </p>
                </div>
                <ExternalLink
                  size={14}
                  className="flex-shrink-0 text-gray-300"
                />
              </a>
              <button
                type="button"
                onClick={(e) => copyValue(e, value, label)}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700"
                aria-label="کپی"
              >
                {copied === label ? (
                  <Check size={14} className="text-emerald-500" />
                ) : (
                  <Copy size={14} className="text-gray-400" />
                )}
              </button>
            </div>
          ))}
        </section>

        <section className="mt-4 rounded-3xl bg-white p-5 shadow-sm dark:bg-gray-800">
          <div className="mb-3 flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-500" />
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              نماد اعتماد الکترونیکی
            </h2>
          </div>
          <p className="mb-4 text-xs leading-6 text-gray-400 dark:text-gray-500">
            پس از دریافت اینماد، تصویر یا کد رسمی در این بخش نمایش داده می‌شود.
          </p>
          {/* e namad */}
          <a
            referrerpolicy="origin"
            target="_blank"
            href="https://trustseal.enamad.ir/?id=7632896&Code=SswXBG1YGLozdaLCzOiT8UGQPxqW3d94"
            rel="noopener noreferrer"
            referrerPolicy="origin"
            className="flex items-center justify-center rounded-2xl border border-gray-100 bg-gray-50 py-4 dark:border-gray-700 dark:bg-gray-700/40"
          >
            <img
              referrerpolicy="origin"
              src="https://trustseal.enamad.ir/logo.aspx?id=7632896&Code=SswXBG1YGLozdaLCzOiT8UGQPxqW3d94"
              alt=""
              code="SswXBG1YGLozdaLCzOiT8UGQPxqW3d94"
            />
          </a>
        </section>
      </main>
    </div>
  );
}
