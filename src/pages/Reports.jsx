/**
 * صفحه اخبار
 * فقط از زنگوله نوتیفیکیشن صفحه اصلی قابل دسترسی است.
 *
 * TODO: وقتی به دیتابیس وصل شد: GET /news
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Newspaper,
  Pin,
  Calendar,
  ChevronLeft,
  Loader2,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { fetchNews } from "../api";

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

export default function Reports() {
  const navigate = useNavigate();
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
      <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/")}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700"
              aria-label="بازگشت"
            >
              <ArrowRight size={16} className="text-gray-600 dark:text-gray-300" />
            </button>
            <Newspaper size={20} className="text-emerald-500" />
            <span className="text-base font-bold text-gray-900 dark:text-white">
              اخبار
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

        {!loading && categories.length > 1 && (
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
