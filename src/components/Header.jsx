import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, User, Menu } from "lucide-react";
import Logo from "../assets/svg/logo.png";
import { useAuth } from "../context/AuthContext";
import SideMenu from "./SideMenu";

export default function Header({
  onAdminClick,
  bellShaking = false,
  hasNewNews = false,
  onBellClick,
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
      {/* سمت راست / لوگو و منو */}
      <div className="flex items-center gap-2">
        {/* دکمه منو */}
        <button
          type="button"
          aria-label="باز کردن منو"
          onClick={() => setMenuOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700"
        >
          <Menu
            size={18}
            className="text-gray-500 dark:text-white"
          />
        </button>

        {/* لوگو */}
        <div
          className="flex cursor-pointer items-center gap-2"
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
            <img
              src={Logo}
              alt="ولت‌مپ"
              className="w-40 md:w-40"
            />
          </div>

          <div>
            <div
              className="mt-2 dark:!text-white"
              style={{
                fontSize: 19,
                fontWeight: 700,
                color: "#1a1a1a",
                lineHeight: 1.2,
              }}
            >
              ولت
              <span style={{ color: "#2ECC71" }}>مپ</span>
            </div>

            <div
              className="dark:!text-gray-500"
              style={{
                fontSize: 10,
                color: "#aaa",
                letterSpacing: 1,
              }}
            >
              VoltMap
            </div>
          </div>
        </div>
      </div>

      {/* سمت چپ / ادمین، اعلان و پروفایل */}
      <div className="flex items-center gap-3">
        {/* دکمه ادمین */}
        {isAdmin && (
          <button
            type="button"
            onClick={onAdminClick}
            className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-500 dark:border-gray-600 dark:text-gray-400"
            style={{ fontFamily: "Vazirmatn" }}
          >
            ادمین
          </button>
        )}

        {/* اعلان */}
        <button
          type="button"
          aria-label="اعلان‌ها"
          className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700"
          onClick={onBellClick}
        >
          <Bell
            size={18}
            className={`
              ${hasNewNews ? "text-[#2ECC71]" : "text-gray-500"}
              dark:text-white
              ${bellShaking ? "bell-shake" : ""}
            `}
          />

          {/* نقطه اعلان جدید */}
          {hasNewNews && (
            <span
              className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-gray-700"
              style={{ background: "#e74c3c" }}
            />
          )}
        </button>

        {/* پروفایل */}
        <button
          type="button"
          aria-label="پروفایل"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700"
          onClick={() => navigate("/profile")}
        >
          <User
            size={18}
            className="text-gray-500 dark:text-white"
          />
        </button>
      </div>

      {/* ساید منو */}
      <SideMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
    </div>
  );
}