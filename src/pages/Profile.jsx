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
} from "lucide-react";
import { fetchProfile } from "../api";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfile()
      .then(setProfile)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const displayName = user?.name || profile?.name;
  const displayEmail = user?.email || profile?.email;
  const displayPhone = user?.phone || profile?.phone;

  const handleLogout = async () => {
    await logout();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50" style={{ paddingBottom: 80 }}>
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
          <div className="flex flex-col items-center gap-3 rounded-3xl bg-white py-12 shadow-sm">
            <Loader2 size={28} className="animate-spin text-emerald-500" />
            <p className="text-sm text-gray-500">در حال بارگذاری...</p>
          </div>
        )}

        {(user || profile) && (
          <>
            {/* Profile card */}
            <section className="rounded-3xl bg-white p-5 shadow-md">
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
                  <h1 className="text-lg font-bold text-gray-900">{displayName}</h1>
                  <div className="mt-2 space-y-1.5">
                    <p className="flex items-center gap-2 text-sm text-gray-500">
                      <Mail size={14} className="flex-shrink-0 text-gray-400" />
                      {displayEmail}
                    </p>
                    <p className="flex items-center gap-2 text-sm text-gray-500">
                      <Phone size={14} className="flex-shrink-0 text-gray-400" />
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
                  <p className="text-xs text-gray-500">سطح اشتراک</p>
                  <p className="text-base font-bold text-emerald-700">{profile?.membership || 'رایگان'}</p>
                </div>
              </div>
            </section>

            {/* Stats */}
            <section className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
                  <Zap size={18} className="text-emerald-600" />
                </div>
                <p className="text-xs text-gray-500">جلسات شارژ</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{profile?.totalSessions ?? 0}</p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                  <BatteryCharging size={18} className="text-blue-600" />
                </div>
                <p className="text-xs text-gray-500">کل انرژی مصرف‌شده</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {profile?.totalKwh ?? 0}
                  <span className="mr-1 text-sm font-normal text-gray-400">kWh</span>
                </p>
              </div>
            </section>

            {/* Favorites */}
            <section className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart size={18} className="text-red-400" fill="#f87171" />
                  <h2 className="text-sm font-bold text-gray-900">ایستگاه‌های مورد علاقه</h2>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                  {(profile?.favoriteStations ?? []).length} مورد
                </span>
              </div>

              <div className="space-y-2">
                {(profile?.favoriteStations ?? []).map((station) => (
                  <button
                    key={station.id}
                    onClick={() => navigate(`/station/${station.id}`)}
                    className="flex w-full items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-3 py-3 text-right transition-colors hover:bg-emerald-50 active:bg-emerald-100"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white">
                        <MapPin size={16} className="text-emerald-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {station.name}
                        </p>
                        <p className="text-xs text-gray-500">{station.city}</p>
                      </div>
                    </div>
                    <div className="mr-2 flex flex-shrink-0 items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          station.status === "available"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {station.status === "available" ? "آزاد" : "شلوغ"}
                      </span>
                      <ChevronLeft size={16} className="text-gray-300" />
                    </div>
                  </button>
                ))}
                {(profile?.favoriteStations ?? []).length === 0 && (
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <Heart size={32} className="text-gray-200" />
                    <p className="text-sm text-gray-400">
                      هنوز ایستگاه مورد علاقه‌ای ثبت نشده
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Quick actions */}
            <section className="mt-4 overflow-hidden rounded-2xl bg-white shadow-sm">
              {[
                { Icon: Settings, label: "تنظیمات حساب", color: "#555", action: null },
                { Icon: HelpCircle, label: "راهنما و پشتیبانی", color: "#555", action: null },
                { Icon: LogOut, label: "خروج از حساب", color: "#e74c3c", action: handleLogout },
              ].map(({ Icon, label, color, action }, i, arr) => (
                <button
                  key={label}
                  onClick={action || undefined}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-right transition-colors hover:bg-gray-50"
                  style={{
                    borderBottom: i < arr.length - 1 ? "1px solid #f5f5f5" : "none",
                  }}
                >
                  <Icon size={18} color={color} />
                  <span className="flex-1 text-sm font-medium" style={{ color }}>
                    {label}
                  </span>
                  <ChevronLeft size={16} className="text-gray-300" />
                </button>
              ))}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
