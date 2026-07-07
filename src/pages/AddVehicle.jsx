import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Car, Plus, Loader2, Plug } from "lucide-react";
import { addVehicle } from "../api";

export default function AddVehicle() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    year: "",
    batteryLevel: "",
    estimatedRange: "",
    connector: "CCS2",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError("نام خودرو را وارد کنید");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await addVehicle({
        name: form.name.trim(),
        year: form.year ? Number(form.year) : null,
        batteryLevel: form.batteryLevel ? Number(form.batteryLevel) : 100,
        estimatedRange: form.estimatedRange ? Number(form.estimatedRange) : 0,
        connector: form.connector || "CCS2",
      });
      navigate("/vehicles", { replace: true });
    } catch (err) {
      setError(err.message || "خطا در ثبت خودرو");
    } finally {
      setSaving(false);
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
          <span className="text-base font-semibold text-white">افزودن خودرو</span>
        </div>
      </div>

      <main className="relative -mt-10 px-4 pb-6">
        <section className="rounded-3xl bg-white p-5 shadow-md dark:bg-gray-800">
          <div className="mb-5 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-900/30">
              <Car size={30} className="text-emerald-500" />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
                نام و مدل خودرو
              </label>
              <input
                type="text"
                value={form.name}
                onChange={handleChange("name")}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-emerald-400 focus:bg-white dark:border-gray-700 dark:bg-gray-700/50 dark:text-white dark:focus:bg-gray-700"
                placeholder="مثلاً Tesla Model 3 Long Range"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
                سال ساخت
              </label>
              <input
                type="number"
                value={form.year}
                onChange={handleChange("year")}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-emerald-400 focus:bg-white dark:border-gray-700 dark:bg-gray-700/50 dark:text-white dark:focus:bg-gray-700"
                placeholder="1402"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
                  درصد باتری فعلی
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.batteryLevel}
                  onChange={handleChange("batteryLevel")}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-emerald-400 focus:bg-white dark:border-gray-700 dark:bg-gray-700/50 dark:text-white dark:focus:bg-gray-700"
                  placeholder="75"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
                  برد تقریبی (km)
                </label>
                <input
                  type="number"
                  value={form.estimatedRange}
                  onChange={handleChange("estimatedRange")}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-emerald-400 focus:bg-white dark:border-gray-700 dark:bg-gray-700/50 dark:text-white dark:focus:bg-gray-700"
                  placeholder="450"
                />
              </div>
            </div>
          </div>

          {/* فیلد نازل خودرو */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
              نازل شارژ خودرو
            </label>
            <p className="mb-2 text-[11px] text-gray-400 dark:text-gray-500">
              نوع کانکتوری که خودرو شما پشتیبانی می‌کند
            </p>
            <div className="grid grid-cols-3 gap-2">
              {["CCS2","GB/T","Type2"].map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, connector: c }))}
                  className="py-2.5 rounded-xl text-xs font-semibold border transition-colors flex items-center justify-center gap-1"
                  style={{
                    borderColor: form.connector === c ? "#2ECC71" : "#e5e7eb",
                    background:  form.connector === c ? "#f0faf5" : "#f8f9fa",
                    color:       form.connector === c ? "#16a34a" : "#555",
                  }}>
                  <Plug size={12} />
                  {c}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="mt-3 text-xs font-medium text-red-500">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white transition-opacity active:opacity-90 disabled:opacity-60"
            style={{ background: "#2ECC71" }}
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            {saving ? "در حال ثبت..." : "افزودن خودرو"}
          </button>
        </section>
      </main>
    </div>
  );
}
