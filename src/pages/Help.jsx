import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  HelpCircle,
  ChevronDown,
  MapPin,
  Route,
  Car,
  Zap,
  Bell,
  Crown,
  MessageCircle,
} from "lucide-react";

const SECTIONS = [
  {
    Icon: MapPin,
    title: "پیدا کردن ایستگاه شارژ",
    body: "در صفحه خانه روی نقشه نزدیک‌ترین ایستگاه‌ها را ببینید. با جستجو یا فیلتر شهر، نوع شارژر (AC / DC) و کانکتور می‌توانید نتیجه را محدود کنید. با کشیدن لیست به بالا، جزئیات ایستگاه‌ها را مرور کنید و روی هر کارت بزنید تا صفحه ایستگاه باز شود.",
  },
  {
    Icon: Route,
    title: "برنامه‌ریزی سفر",
    body: "از منوی پایین وارد بخش «سفر» شوید، مبدأ و مقصد را مشخص کنید و خودرویتان را انتخاب کنید. ولت‌مپ مسیر را با توقف‌های شارژ بهینه پیشنهاد می‌دهد تا در سفرهای بین‌شهری بدون نگرانی از شارژ حرکت کنید.",
  },
  {
    Icon: Car,
    title: "ثبت خودرو",
    body: "در پروفایل یا منوی کناری وارد «خودروهای من» شوید و مشخصات خودرو برقی‌تان را اضافه کنید. این اطلاعات برای محاسبه برد و پیشنهاد ایستگاه مناسب در سفر استفاده می‌شود. می‌توانید یک خودرو را به‌عنوان پیش‌فرض علامت بزنید.",
  },
  {
    Icon: Zap,
    title: "ثبت ایستگاه من",
    body: "اگر ایستگاه خانگی یا عمومی دارید و می‌خواهید در نقشه دیده شود، از منوی پایین وارد «ایستگاه من» شوید و فرم را کامل کنید. پس از بررسی تیم ولت‌مپ، ایستگاه روی نقشه قرار می‌گیرد.",
  },
  {
    Icon: Bell,
    title: "اخبار و اعلان‌ها",
    body: "اخبار شرکت، ایستگاه‌های جدید و تخفیف‌ها فقط از زنگوله بالای صفحه اصلی در دسترس است. اگر نقطه قرمز روی زنگوله دیدید، خبر جدیدی منتشر شده است.",
  },
  {
    Icon: Crown,
    title: "اشتراک ویژه",
    body: "برخی قابلیت‌ها مثل برنامه‌ریزی پیشرفته سفر برای کاربران ویژه فعال است. سطح اشتراک فعلی را در صفحه پروفایل ببینید. برای ارتقا از مسیر سفر اقدام کنید.",
  },
  {
    Icon: MessageCircle,
    title: "پشتیبانی",
    body: "اگر ایستگاهی را نادرست دیدید، اپ خطا داد یا پیشنهادی دارید، از منوی کناری وارد «ارتباط با ما» شوید و با ایمیل، تلفن یا شبکه‌های اجتماعی با تیم پشتیبانی تماس بگیرید. معمولاً در ساعات اداری پاسخ داده می‌شود.",
  },
];

export default function Help() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(0);

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
            راهنما و پشتیبانی
          </span>
        </div>
      </div>

      <main className="relative mt-5 px-4 pb-6">
        <section className="rounded-3xl bg-white p-5 shadow-md dark:bg-gray-800">
          <div className="flex items-center gap-2">
            <HelpCircle size={18} className="text-emerald-500" />
            <h1 className="text-base font-bold text-gray-900 dark:text-white">
              چطور از ولت‌مپ استفاده کنیم؟
            </h1>
          </div>
          <p className="mt-2 text-sm leading-7 text-gray-500 dark:text-gray-400">
            روی هر موضوع بزنید تا توضیح کامل را ببینید. اگر پاسخ‌تان را پیدا
            نکردید، از صفحه ارتباط با ما با پشتیبانی در تماس باشید.
          </p>
        </section>

        <section className="mt-4 overflow-hidden rounded-3xl bg-white shadow-sm dark:bg-gray-800">
          {SECTIONS.map(({ Icon, title, body }, i) => {
            const isOpen = open === i;
            return (
              <div
                key={title}
                style={{
                  borderBottom:
                    i < SECTIONS.length - 1 ? "1px solid #f5f5f5" : "none",
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-right"
                  aria-expanded={isOpen}
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30">
                    <Icon
                      size={16}
                      className="text-emerald-600 dark:text-emerald-400"
                    />
                  </div>
                  <span className="flex-1 text-sm font-semibold text-gray-900 dark:text-white">
                    {title}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`text-gray-300 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isOpen && (
                  <p className="px-4 pb-4 pr-[3.75rem] text-sm leading-7 text-gray-500 dark:text-gray-400">
                    {body}
                  </p>
                )}
              </div>
            );
          })}
        </section>

        <button
          type="button"
          onClick={() => navigate("/contact")}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold text-white"
          style={{ background: "#2ECC71" }}
        >
          <MessageCircle size={16} />
          ارتباط با پشتیبانی
        </button>
      </main>
    </div>
  );
}
