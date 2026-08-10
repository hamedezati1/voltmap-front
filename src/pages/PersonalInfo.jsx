import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, User, Mail, Phone, Save, Loader2, Check } from "lucide-react";
import { updateProfile } from "../api";
import { useAuth } from "../context/AuthContext";
import { FieldError } from "../components/FieldError";
import { validateProfile, inputErrorClass } from "../lib/validation";

const inputBase =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-emerald-400 focus:bg-white dark:border-gray-700 dark:bg-gray-700/50 dark:text-white dark:focus:bg-gray-700";

export default function PersonalInfo() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSave = async () => {
    const result = validateProfile(form);
    setErrors(result.errors);
    if (!result.ok) return;

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim() || undefined,
      };
      const updated = await updateProfile(payload);
      if (updated && setUser) {
        setUser((prev) => ({ ...prev, ...updated }));
      }
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" style={{ paddingBottom: 80 }}>
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
            onClick={() => navigate("/profile")}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm transition-colors hover:bg-white/30"
          >
            <ArrowRight size={20} color="#fff" />
          </button>
          <span className="text-base font-semibold text-white">اطلاعات شخصی</span>
        </div>
      </div>

      <main className="relative -mt-10 px-4 pb-6">
        <section className="rounded-3xl bg-white p-5 shadow-md dark:bg-gray-800">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                <User size={13} />
                نام و نام خانوادگی
              </label>
              <input
                type="text"
                value={form.name}
                onChange={handleChange("name")}
                className={`${inputBase} ${inputErrorClass(!!errors.name)}`}
                placeholder="نام شما"
                maxLength={100}
              />
              <FieldError message={errors.name} />
              <p className="mt-1 text-[11px] text-gray-400">بین ۲ تا ۱۰۰ کاراکتر</p>
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                <Mail size={13} />
                ایمیل
              </label>
              <input
                type="email"
                value={form.email}
                onChange={handleChange("email")}
                className={`${inputBase} ${inputErrorClass(!!errors.email)}`}
                placeholder="email@example.com"
                dir="ltr"
              />
              <FieldError message={errors.email} />
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                <Phone size={13} />
                شماره موبایل
              </label>
              <input
                type="tel"
                value={user?.phone || ""}
                readOnly
                disabled
                className={`${inputBase} cursor-not-allowed opacity-70`}
                dir="ltr"
              />
              <p className="mt-1 text-[11px] text-gray-400">
                شماره موبایل همان هویت ورود شماست و قابل تغییر نیست
              </p>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white transition-opacity active:opacity-90 disabled:opacity-60"
            style={{ background: "#2ECC71" }}
          >
            {saving ? (
              <Loader2 size={18} className="animate-spin" />
            ) : saved ? (
              <Check size={18} />
            ) : (
              <Save size={18} />
            )}
            {saving ? "در حال ذخیره..." : saved ? "ذخیره شد" : "ذخیره تغییرات"}
          </button>
        </section>
      </main>
    </div>
  );
}
