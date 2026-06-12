import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const fallbackProfile = {
  name: "کاربر ولت",
  email: "user@example.com",
  phone: "0912-000-0000",
  membership: "طلایی",
  totalSessions: 24,
  totalKwh: 312,
  favoriteStations: [
    { id: 1, name: "ایستگاه ونک", city: "تهران", status: "available" },
    { id: 2, name: "ایستگاه شریعتی", city: "تهران", status: "busy" },
  ],
};

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(fallbackProfile);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch("/api/profile");
        if (!response.ok) {
          throw new Error("API unavailable");
        }
        const data = await response.json();
        setProfile({
          name: data.name,
          email: data.email,
          phone: data.phone,
          membership: data.membership,
          totalSessions: data.totalSessions,
          totalKwh: data.totalKwh,
          favoriteStations: data.favoriteStations || [],
        });
      } catch {
        setProfile(fallbackProfile);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white px-4 py-3 flex items-center gap-3 border-b border-gray-100">
        <button
          onClick={() => navigate(-1)}
          className="text-2xl transition-colors hover:text-gray-700"
        >
          ←
        </button>
        <span className="text-base font-semibold">پروفایل</span>
      </div>

      <main className="mx-auto max-w-3xl px-4 py-6">
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-500 text-4xl text-white">
                👤
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {profile.name}
                </h1>
                <p className="mt-1 text-sm text-gray-500">{profile.email}</p>
                <p className="text-sm text-gray-500">{profile.phone}</p>
              </div>
            </div>
            <div className="rounded-3xl bg-indigo-50 px-4 py-3 text-right">
              <p className="text-sm text-gray-500">سطح اشتراک</p>
              <p className="mt-1 text-lg font-semibold text-indigo-700">
                {profile.membership}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">جلسات شارژ</p>
            <p className="mt-3 text-3xl font-bold text-gray-900">
              {profile.totalSessions}
            </p>
          </div>
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">کل انرژی مصرف‌شده</p>
            <p className="mt-3 text-3xl font-bold text-gray-900">
              {profile.totalKwh} kWh
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">
              ایستگاه‌های مورد علاقه
            </h2>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm text-indigo-700">
              {profile.favoriteStations.length} مورد
            </span>
          </div>

          {loading ? (
            <div className="rounded-2xl bg-gray-50 p-6 text-center text-sm text-gray-500">
              در حال بارگذاری اطلاعات...
            </div>
          ) : (
            <div className="space-y-3">
              {profile.favoriteStations.map((station) => (
                <div
                  key={station.id}
                  className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-gray-900">{station.name}</p>
                    <p className="text-sm text-gray-500">{station.city}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      station.status === "available"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {station.status === "available" ? "آزاد" : "شلوغ"}
                  </span>
                </div>
              ))}
              {profile.favoriteStations.length === 0 && (
                <p className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-500">
                  هنوز ایستگاه مورد علاقه‌ای ثبت نشده است.
                </p>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
