import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Car,
  Plus,
  ChevronLeft,
  Loader2,
  BatteryMedium,
  Gauge,
  Trash2,
} from "lucide-react";
import { fetchVehicles, deleteVehicle } from "../api";

export default function Vehicles() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchVehicles()
      .then(setVehicles)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await deleteVehicle(id);
      setVehicles((prev) => prev.filter((v) => v.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-900"
      style={{ paddingBottom: 80 }}
    >
      {/* Header */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(135deg, #2ECC71 0%, #1a8a40 100%)",
            height: 110,
          }}
        />
        <div className="relative flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/profile")}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm transition-colors hover:bg-white/30"
            >
              <ArrowRight size={20} color="#fff" />
            </button>
            <span className="text-base font-semibold text-white">
              خودروهای من
            </span>
          </div>
          <button
            onClick={() => navigate("/vehicles/add")}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm transition-colors hover:bg-white/30"
          >
            <Plus size={20} color="#fff" />
          </button>
        </div>
      </div>

      <main className="relative -mt-10 px-4 pb-6">
        {loading && (
          <div className="flex flex-col items-center gap-3 rounded-3xl bg-white py-12 shadow-sm dark:bg-gray-800">
            <Loader2 size={28} className="animate-spin text-emerald-500" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              در حال بارگذاری...
            </p>
          </div>
        )}

        {!loading && vehicles.length > 0 && (
          <div className="space-y-3">
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="group flex items-center gap-3 mt-20 rounded-2xl border border-transparent bg-white p-4 shadow-sm transition-all hover:border-emerald-100 hover:shadow-md dark:bg-gray-800 dark:hover:border-emerald-900/40"
              >
                <button
                  onClick={() => navigate(`/vehicle/${vehicle.id}`)}
                  className="flex flex-1 items-center gap-3 text-right"
                >
                  <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/40 dark:to-emerald-950/40">
                    {vehicle.image ? (
                      <img
                        src={vehicle.image}
                        alt={vehicle.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Car size={22} className="text-emerald-500" />
                    )}
                    {vehicle.isDefault && (
                      <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-gray-800" />
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
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      {vehicle.batteryLevel != null && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-gray-50 px-2 py-0.5 dark:bg-gray-700/50">
                          <BatteryMedium
                            size={12}
                            className="text-emerald-500"
                          />
                          {vehicle.batteryLevel}%
                        </span>
                      )}
                      {vehicle.estimatedRange != null && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-gray-50 px-2 py-0.5 dark:bg-gray-700/50">
                          <Gauge size={12} className="text-blue-500" />
                          {vehicle.estimatedRange} km
                        </span>
                      )}
                      {vehicle.connector && (
                        <span className="rounded-lg bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          {vehicle.connector}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronLeft
                    size={16}
                    className="flex-shrink-0 text-gray-300 transition-transform group-hover:-translate-x-0.5"
                  />
                </button>
                <button
                  onClick={() => handleDelete(vehicle.id)}
                  disabled={deletingId === vehicle.id}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-red-400 transition-colors hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-900/20"
                >
                  {deletingId === vehicle.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {!loading && vehicles.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-3xl bg-white py-12 shadow-sm dark:bg-gray-800">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 dark:bg-gray-700/50">
              <Car size={26} className="text-gray-300 dark:text-gray-500" />
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

        {!loading && vehicles.length > 0 && (
          <button
            onClick={() => navigate("/vehicles/add")}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 py-3.5 text-sm font-semibold text-gray-500 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <Plus size={16} />
            افزودن خودروی جدید
          </button>
        )}
      </main>
    </div>
  );
}
