import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Car, Loader2, BatteryMedium, Gauge, Calendar, Star, Trash2, Plug } from "lucide-react";
import { fetchVehicleById, deleteVehicle } from "../api";

export default function VehicleDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchVehicleById(id)
      .then(setVehicle)
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteVehicle(id);
      navigate("/vehicles", { replace: true });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" style={{ paddingBottom: 80 }}>
      {/* Header */}
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
            onClick={() => navigate("/vehicles")}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm transition-colors hover:bg-white/30"
          >
            <ArrowRight size={20} color="#fff" />
          </button>
          <span className="text-base font-semibold text-white">جزئیات خودرو</span>
        </div>
      </div>

      <main className="relative -mt-10 px-4 pb-6">
        {loading && (
          <div className="flex flex-col items-center gap-3 rounded-3xl bg-white py-12 shadow-sm dark:bg-gray-800">
            <Loader2 size={28} className="animate-spin text-emerald-500" />
            <p className="text-sm text-gray-500 dark:text-gray-400">در حال بارگذاری...</p>
          </div>
        )}

        {!loading && vehicle && (
          <>
            <section className="rounded-3xl bg-white p-5 text-center shadow-md dark:bg-gray-800">
              <div className="mb-3 flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-emerald-50 dark:bg-emerald-900/30">
                  {vehicle.image ? (
                    <img src={vehicle.image} alt={vehicle.name} className="h-full w-full object-cover" />
                  ) : (
                    <Car size={36} className="text-emerald-500" />
                  )}
                </div>
              </div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">{vehicle.name}</h1>
              {vehicle.isDefault && (
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <Star size={11} />
                  خودروی پیش‌فرض
                </span>
              )}
            </section>

            <section className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30">
                  <BatteryMedium size={18} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">درصد باتری</p>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{vehicle.batteryLevel}%</p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30">
                  <Gauge size={18} className="text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">برد تقریبی</p>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                  {vehicle.estimatedRange}
                  <span className="mr-1 text-sm font-normal text-gray-400">km</span>
                </p>
              </div>
            </section>

            {vehicle.year && (
              <section className="mt-4 flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-700/50">
                  <Calendar size={18} className="text-gray-500 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">سال ساخت</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{vehicle.year}</p>
                </div>
              </section>
            )}

            {vehicle.connector && (
              <section className="mt-4 flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30">
                  <Plug size={18} className="text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">نازل شارژ</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{vehicle.connector}</p>
                </div>
              </section>
            )}

            <button
              onClick={handleDelete}
              disabled={deleting}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 py-3.5 text-sm font-bold text-red-500 transition-colors hover:bg-red-50 disabled:opacity-60 dark:border-red-900/40 dark:hover:bg-red-900/20"
            >
              {deleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
              {deleting ? "در حال حذف..." : "حذف خودرو"}
            </button>
          </>
        )}

        {!loading && !vehicle && (
          <div className="flex flex-col items-center gap-2 rounded-3xl bg-white py-12 shadow-sm dark:bg-gray-800">
            <Car size={32} className="text-gray-200 dark:text-gray-700" />
            <p className="text-sm text-gray-400 dark:text-gray-500">خودرو پیدا نشد</p>
          </div>
        )}
      </main>
    </div>
  );
}
