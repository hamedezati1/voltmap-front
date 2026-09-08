import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  User,
  CircleUserRound,
  Car,
  Zap,
  MapPinned,
  Navigation,
  HelpCircle,
  Phone,
  LogOut,
  ChevronLeft,
  X,
  Moon,
  Crown,
  Shield,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const MENU_ITEMS = [
  { Icon: User, label: "پروفایل", path: "/profile" },
  {
    Icon: CircleUserRound,
    label: "اطلاعات شخصی",
    path: "/profile/personal-info",
  },
  { Icon: Car, label: "خودروهای من", path: "/vehicles" },
  { Icon: Zap, label: "ایستگاه من", path: "/my-station" },
  { Icon: MapPinned, label: "نقشه مسیر", path: "/routes" },
  { Icon: Navigation, label: "برنامه‌ریزی سفر", path: "/trip" },
  { Icon: HelpCircle, label: "راهنما و پشتیبانی", path: "/help" },
  { Icon: Phone, label: "ارتباط با ما", path: "/contact" },
];

export default function SideMenu({ open, onClose }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const isAdmin = user?.role === "admin";
  const [host, setHost] = useState(null);

  useEffect(() => {
    setHost(document.querySelector(".mobile-shell"));
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const go = (path) => {
    onClose();
    if (path) navigate(path);
  };

  const handleLogout = async () => {
    onClose();
    await logout();
    navigate("/auth", { replace: true });
  };

  if (!host) return null;

  return createPortal(
    <div
      className={`side-menu-root ${open ? "is-open" : ""}`}
      aria-hidden={!open}
    >
      <button
        type="button"
        className="side-menu-backdrop"
        aria-label="بستن منو"
        onClick={onClose}
        tabIndex={open ? 0 : -1}
      />
      <aside
        className="side-menu-panel"
        role="dialog"
        aria-modal="true"
        aria-label="منوی اصلی"
      >
        <div
          className="px-4 pt-5 pb-4"
          style={{
            background: "linear-gradient(135deg, #2ECC71 0%, #1a8a40 100%)",
          }}
        >
          <div className="flex items-start justify-between mb-4">
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20"
              aria-label="بستن"
            >
              <X size={16} color="#fff" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => go("/profile")}
            className="flex w-full items-center gap-3 text-right"
          >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20">
              <User size={24} color="#fff" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white">
                {user?.name || "کاربر ولت‌مپ"}
              </p>
              <p className="mt-0.5 truncate text-xs text-white/80">
                {user?.phone || user?.email || ""}
              </p>
            </div>
          </button>
          {user?.membership && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1">
              <Crown size={12} color="#fff" />
              <span className="text-[11px] font-semibold text-white">
                {user.membership}
              </span>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-2">
          {MENU_ITEMS.map(({ Icon, label, path }) => (
            <button
              key={label}
              type="button"
              onClick={() => go(path)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-right transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30">
                <Icon
                  size={18}
                  className="text-emerald-600 dark:text-emerald-400"
                />
              </div>
              <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-100">
                {label}
              </span>
              <ChevronLeft size={16} className="text-gray-300" />
            </button>
          ))}

          {isAdmin && (
            <button
              type="button"
              onClick={() => go("/admin")}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-right transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/30">
                <Shield
                  size={18}
                  className="text-amber-600 dark:text-amber-400"
                />
              </div>
              <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-100">
                پنل ادمین
              </span>
              <ChevronLeft size={16} className="text-gray-300" />
            </button>
          )}

          <div className="mx-3 my-2 border-t border-gray-100 dark:border-gray-700" />

          <div className="flex w-full items-center gap-3 rounded-xl px-3 py-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700">
              <Moon size={18} className="text-gray-600 dark:text-gray-300" />
            </div>
            <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-100">
              حالت تاریک
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={isDark}
              onClick={toggleTheme}
              className="relative h-6 w-[42px] flex-shrink-0 rounded-full transition-colors"
              style={{ background: isDark ? "#2ECC71" : "#e0e0e0" }}
            >
              <span
                className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
                style={{
                  transform: isDark ? "translateX(-20px)" : "translateX(-2px)",
                  right: 0,
                }}
              />
            </button>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-right transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/30">
              <LogOut size={18} className="text-red-500" />
            </div>
            <span className="flex-1 text-sm font-medium text-red-500">
              خروج از حساب
            </span>
          </button>
        </nav>
      </aside>
    </div>,
    host,
  );
}
