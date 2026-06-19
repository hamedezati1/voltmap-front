import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Zap } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { LoginForm, RegisterForm } from "../components/auth/AuthForms";
import VoltMap from "../assets/svg/volt-map.png";

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab =
    searchParams.get("tab") === "register" ? "register" : "login";
  const [tab, setTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login, register } = useAuth();

  const handleLogin = async (credentials) => {
    setLoading(true);
    setError("");
    try {
      await login(credentials);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "خطا در ورود");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (data) => {
    setLoading(true);
    setError("");
    try {
      await register(data);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "خطا در ثبت‌نام");
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (next) => {
    setTab(next);
    setError("");
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <div
        className="flex flex-col items-center px-6 pb-8 pt-12"
        style={{
          background: "linear-gradient(160deg, #2ECC71 0%, #1a8a40 100%)",
        }}
      >
        <div className="flex flex-col items-center px-6 pt-6 pb-6">
          <img src={VoltMap} alt="ولت‌مپ" className="w-48 md:w-40" />

          <p className="mt-2 text-white/80">به حساب خود وارد شوید</p>
        </div>
      </div>

      {/* Form card */}
      <div className="relative -mt-5 flex-1 px-5 pb-8">
        <div className="rounded-3xl bg-white p-5 shadow-lg">
          {/* Tabs */}
          <div className="mb-6 flex rounded-xl bg-gray-100 p-1">
            {[
              { key: "login", label: "ورود" },
              { key: "register", label: "ثبت‌نام" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => switchTab(key)}
                className="flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all"
                style={{
                  fontFamily: "Vazirmatn",
                  background: tab === key ? "#fff" : "transparent",
                  color: tab === key ? "#2ECC71" : "#888",
                  boxShadow:
                    tab === key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "login" ? (
            <LoginForm onSubmit={handleLogin} loading={loading} error={error} />
          ) : (
            <RegisterForm
              onSubmit={handleRegister}
              loading={loading}
              error={error}
            />
          )}
        </div>

        <p className="mt-6 text-center text-xs leading-6 text-gray-400">
          با ثبت‌نام، شرایط استفاده و حریم خصوصی ولت‌مپ را می‌پذیرید.
        </p>
      </div>
    </div>
  );
}
