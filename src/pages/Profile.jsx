import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  User,
  Mail,
  Phone,
  Crown,
  Zap,
  BatteryCharging,
  Heart,
  MapPin,
  ChevronLeft,
  Loader2,
  AlertCircle,
  Settings,
  HelpCircle,
  LogOut,
  Car,
  Plus,
  CircleUserRound,
  Moon,
  BatteryMedium,
  Gauge,
} from "lucide-react";
import { fetchProfile, fetchVehicles, fetchFavoriteStations } from "../api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [vehicles, setVehicles] = useState([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);

  const [favoriteStations, setFavoriteStations] = useState([]);
  const [favoritesLoading, setFavoritesLoading] = useState(true);

  useEffect(() => {
    fetchProfile()
      .then(setProfile)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchVehicles()
      .then(setVehicles)
      .catch(() => setVehicles([]))
      .finally(() => setVehiclesLoading(false));
  }, []);

  useEffect(() => {
    fetchFavoriteStations()
      .then(setFavoriteStations)
      .catch(() => setFavoriteStations([]))
      .finally(() => setFavoritesLoading(false));
  }, []);

  const displayName = user?.name || profile?.name;
  const displayEmail = user?.email || profile?.email;
  const displayPhone = user?.phone || profile?.phone;

  const handleLogout = async () => {
    await logout();
    navigate("/auth", { replace: true });
  };

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-900"
      style={{ paddingBottom: 80, overflowY: "auto" }}
    >
      {/* Header */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(135deg, #2ECC71 0%, #1a8a40 100%)",
            height: 140,
          }}
        />
        <div className="relative flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm transition-colors hover:bg-white/30"
          >
            <ArrowRight size={20} color="#fff" />
          </button>
          <span className="text-base font-semibold text-white">پروفایل</span>
        </div>
      </div>

      <main className="relative -mt-16 px-4 pb-6">
        {loading && !user && (
          <div className="flex flex-col items-center gap-3 rounded-3xl bg-white py-12 shadow-sm dark:bg-gray-800">
            <Loader2 size={28} className="animate-spin text-emerald-500" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              در حال بارگذاری...
            </p>
          </div>
        )}

        {(user || profile) && (
          <>
            {/* Profile card */}
            <section className="rounded-3xl bg-white p-5 mt-20 shadow-md dark:bg-gray-800">
              <div className="flex items-start gap-4">
                <div
                  className="flex h-[72px] w-[72px] flex-shrink-0 items-center justify-center rounded-2xl"
                  style={{
                    background: "linear-gradient(135deg, #2ECC71, #1a8a40)",
                  }}
                >
                  <User size={36} color="#fff" strokeWidth={1.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                    {displayName}
                  </h1>
                  <div className="mt-2 space-y-1.5">
                    <p className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Mail size={14} className="flex-shrink-0 text-gray-400" />
                      {displayEmail}
                    </p>
                    <p className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Phone
                        size={14}
                        className="flex-shrink-0 text-gray-400"
                      />
                      {displayPhone}
                    </p>
                  </div>
                </div>
              </div>

              <div
                className="mt-4 flex items-center gap-3 rounded-2xl px-4 py-3"
                style={{ background: "#f0faf5", border: "1px solid #d0f0e0" }}
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: "#2ECC71" }}
                >
                  <Crown size={20} color="#fff" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    سطح اشتراک
                  </p>
                  <p className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                    {profile?.membership || "رایگان"}
                  </p>
                </div>
              </div>
            </section>

            {/* Stats */}
            <section className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30">
                  <Zap
                    size={18}
                    className="text-emerald-600 dark:text-emerald-400"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  جلسات شارژ
                </p>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                  {profile?.totalSessions ?? 0}
                </p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30">
                  <BatteryCharging
                    size={18}
                    className="text-blue-600 dark:text-blue-400"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  کل انرژی مصرف‌شده
                </p>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                  {profile?.totalKwh ?? 0}
                  <span className="mr-1 text-sm font-normal text-gray-400">
                    kWh
                  </span>
                </p>
              </div>
            </section>

            {/* Favorites */}
            <section className="mt-4 rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart size={18} className="text-red-400" fill="#f87171" />
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                    ایستگاه‌های مورد علاقه
                  </h2>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  {favoriteStations.length} مورد
                </span>
              </div>

              <div className="space-y-2">
                {favoritesLoading && (
                  <div className="flex items-center justify-center py-6">
                    <Loader2
                      size={20}
                      className="animate-spin text-emerald-500"
                    />
                  </div>
                )}
                {!favoritesLoading &&
                  favoriteStations.map((station) => (
                    <button
                      key={station.id}
                      onClick={() => navigate(`/station/${station.id}`)}
                      className="flex w-full items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-3 py-3 text-right transition-colors hover:bg-emerald-50 active:bg-emerald-100 dark:border-gray-700 dark:bg-gray-700/50 dark:hover:bg-gray-700"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white dark:bg-gray-800">
                          <MapPin size={16} className="text-emerald-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                            {station.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {station.city}
                          </p>
                        </div>
                      </div>
                      <div className="mr-2 flex flex-shrink-0 items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            station.status === "available"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                          }`}
                        >
                          {station.status === "available" ? "آزاد" : "شلوغ"}
                        </span>
                        <ChevronLeft size={16} className="text-gray-300" />
                      </div>
                    </button>
                  ))}
                {!favoritesLoading && favoriteStations.length === 0 && (
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <Heart
                      size={32}
                      className="text-gray-200 dark:text-gray-700"
                    />
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      هنوز ایستگاه مورد علاقه‌ای ثبت نشده
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* My vehicles */}
            <section className="mt-4 rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Car size={18} className="text-emerald-500" />
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                    خودروهای من
                  </h2>
                </div>
                {!vehiclesLoading && vehicles.length > 0 && (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    {vehicles.length} مورد
                  </span>
                )}
              </div>

              {vehiclesLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2
                    size={22}
                    className="animate-spin text-emerald-500"
                  />
                </div>
              )}

              {!vehiclesLoading && vehicles.length > 0 && (
                <>
                  <div className="space-y-2">
                    {vehicles.map((vehicle) => (
                      <button
                        key={vehicle.id}
                        onClick={() => navigate(`/vehicle/${vehicle.id}`)}
                        className="flex w-full items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-3 text-right transition-colors hover:bg-emerald-50 active:bg-emerald-100 dark:border-gray-700 dark:bg-gray-700/50 dark:hover:bg-gray-700"
                      >
                        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white dark:bg-gray-800">
                          {vehicle.image ? (
                            <img
                              src={vehicle.image}
                              alt={vehicle.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Car size={20} className="text-emerald-500" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                              {vehicle.name}
                            </p>
                            {vehicle.isDefault && (
                              <span className="flex-shrink-0 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                پیش‌فرض
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <BatteryMedium size={12} />
                              {vehicle.batteryLevel}%
                            </span>
                            <span className="flex items-center gap-1">
                              <Gauge size={12} />
                              {vehicle.estimatedRange} km
                            </span>
                          </div>
                        </div>
                        <ChevronLeft
                          size={16}
                          className="flex-shrink-0 text-gray-300"
                        />
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => navigate("/vehicles")}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-100 py-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700/50"
                  >
                    <Settings size={16} />
                    مدیریت خودروها
                  </button>
                </>
              )}

              {!vehiclesLoading && vehicles.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 dark:bg-gray-700/50">
                    <Car
                      size={26}
                      className="text-gray-300 dark:text-gray-500"
                    />
                  </div>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    هنوز خودرویی ثبت نکرده‌اید
                  </p>
                  <button
                    onClick={() => navigate("/vehicles/add")}
                    className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-opacity active:opacity-90"
                    style={{ background: "#2ECC71" }}
                  >
                    <Plus size={16} />
                    افزودن خودرو
                  </button>
                </div>
              )}
            </section>

            {/* Quick actions */}
            <section className="mt-4 rounded-2xl bg-white shadow-sm dark:bg-gray-800 overflow-visible">
              {[
                {
                  Icon: CircleUserRound,
                  label: "اطلاعات شخصی",
                  color: "#555",
                  action: () => navigate("/profile/personal-info"),
                },
                {
                  Icon: Settings,
                  label: "تنظیمات حساب",
                  color: "#555",
                  action: null,
                },
                {
                  Icon: HelpCircle,
                  label: "راهنما و پشتیبانی",
                  color: "#555",
                  action: () => navigate("/help"),
                },
                {
                  Icon: LogOut,
                  label: "خروج از حساب",
                  color: "#e74c3c",
                  action: handleLogout,
                },
              ].map(({ Icon, label, color, action }, i, arr) => (
                <button
                  key={label}
                  onClick={action || undefined}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-right transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  style={{
                    borderBottom:
                      i < arr.length - 1 ? "1px solid #f5f5f5" : "none",
                  }}
                >
                  <Icon size={18} color={color} />
                  <span
                    className="flex-1 text-sm font-medium"
                    style={{ color }}
                  >
                    {label}
                  </span>
                  <ChevronLeft size={16} className="text-gray-300" />
                </button>
              ))}

              {/* Dark mode toggle */}
              <div
                className="flex w-full items-center gap-3 px-4 py-3.5"
                style={{ borderTop: "1px solid #f5f5f5" }}
              >
                <Moon size={18} color="#555" />
                <span className="flex-1 text-right text-sm font-medium text-gray-700 dark:text-gray-200">
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
                      transform: isDark
                        ? "translateX(-20px)"
                        : "translateX(-2px)",
                      right: 0,
                    }}
                  />
                </button>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
