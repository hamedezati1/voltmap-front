import React from "react";
import { useNavigate } from "react-router-dom";
import { Bell, User, Zap } from "lucide-react";
import Logo from "../assets/svg/logo.png";

export default function Header({ onAdminClick, bellShaking = false, hasNewNews = false, onBellClick }) {
  const navigate = useNavigate();
  return (
    <div className="bg-white flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:bg-gray-800 dark:border-gray-700">
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => navigate("/")}
      >
        <div
          style={{

            borderRadius: 10,
            width: 34,
            height: 34,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img src={Logo} alt="ولت‌مپ" className="w-40 md:w-40 dark:brightness-0 dark:invert" />
        </div>
        <div>
          <div className="mt-2 dark:!text-white"
            style={{
              fontSize: 19,
              fontWeight: 700,
              color: "#1a1a1a",
              lineHeight: 1.2,
            }}
          >
            ولت<span style={{ color: "#2ECC71" }}>مپ</span>
          </div>
          <div className="dark:!text-gray-500" style={{ fontSize: 10, color: "#aaa", letterSpacing: 1 }}>
            VoltMap
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onAdminClick}
          className="text-xs px-3 py-1 rounded-full border border-gray-200 text-gray-500 dark:border-gray-600 dark:text-gray-400"
          style={{ fontFamily: "Vazirmatn" }}
        >
          ادمین
        </button>
        <button
          className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center relative dark:bg-gray-700"
          onClick={onBellClick}
        >
          <Bell
            size={18}
            color={hasNewNews ? "#2ECC71" : "#555"}
            className={`dark:opacity-80 ${bellShaking ? 'bell-shake' : ''}`}
          />
          {hasNewNews && (
            <span
              className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-gray-700"
              style={{ background: "#e74c3c" }}
            />
          )}
        </button>
        <button
          className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center dark:bg-gray-700"
          onClick={() => navigate("/profile")}
        >
          <User size={18} color="#555" className="dark:opacity-80" />
        </button>
      </div>
    </div>
  );
}
