import {
  ChevronRight,
  CheckCircle,
  Navigation,
  Thermometer,
  Wind,
} from "lucide-react";

export default function VehicleSetup({
  vehicles,
  selectedVehicle,
  onSelectVehicle,
  userRange,
  onRangeChange,
  currentBattery,
  onBatteryChange,
  weather,
  onWeatherChange,
  onBack,
  onContinue,
}) {
  return (
    <div
      className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900"
      style={{ paddingBottom: 80 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-100 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700"
          aria-label="بازگشت"
        >
          <ChevronRight
            size={20}
            className="text-gray-600 dark:text-white"
          />
        </button>

        <span className="text-sm font-bold text-gray-900 dark:text-white">
          اطلاعات خودرو و شارژ
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {/* انتخاب خودرو */}
        {vehicles.length > 0 && (
          <section className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <p className="mb-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
              انتخاب خودرو
            </p>

            <div className="space-y-2">
              {vehicles.map((v) => {
                const isSelected = selectedVehicle?.id === v.id;

                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => onSelectVehicle(v)}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-right transition-colors ${
                      isSelected
                        ? "bg-emerald-50 dark:bg-emerald-900/20"
                        : "bg-white dark:bg-gray-700"
                    }`}
                    style={{
                      borderColor: isSelected ? "#2ECC71" : "#e5e7eb",
                    }}
                  >
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/30">
                      <Navigation
                        size={16}
                        className="text-[#2ECC71]"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                        {v.name}
                      </p>

                      <p className="text-xs text-gray-400">
                        برد ثبت‌شده: {v.estimatedRange || "—"} km
                      </p>
                    </div>

                    {isSelected && (
                      <CheckCircle
                        size={16}
                        className="text-[#2ECC71]"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* برد و باتری */}
        <section className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          {/* برد تجربی */}
          <p className="mb-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
            برد تجربی خودرو (km)
          </p>

          <p className="mb-3 text-[11px] text-gray-400 dark:text-gray-500">
            برد واقعی‌ای که تجربه کرده‌اید، نه برد کارخانه
          </p>

          <input
            type="number"
            inputMode="decimal"
            value={userRange}
            onChange={(e) => onRangeChange(e.target.value)}
            placeholder="مثلاً ۳۵۰"
            min="0"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-emerald-400 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            style={{ fontFamily: "Vazirmatn" }}
          />

          {/* درصد باتری */}
          <div className="mt-5">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                درصد شارژ باتری در شروع سفر
              </p>

              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {currentBattery}٪
              </span>
            </div>

            <div
              className="mb-3 flex items-start gap-1.5 rounded-lg p-2"
              style={{
                background: "#fef9e7",
                border: "1px solid #fde68a",
              }}
            >
              <span style={{ fontSize: 13 }}>💡</span>

              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                برای سفر بهتر است شارژ خود را 80% تا 100% کنید تا الگوریتم
                بهترین مسیر را محاسبه کند.
              </p>
            </div>

            {/* Battery Slider */}
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={currentBattery}
              onChange={(e) =>
                onBatteryChange(Number(e.target.value))
              }
              className="w-full accent-emerald-500"
            />

            {/* محدوده درصد */}
            <div className="mt-1 flex justify-between text-[10px] text-gray-400 dark:text-gray-500">
              <span>۰٪</span>
              <span>۲۵٪</span>
              <span>۵۰٪</span>
              <span>۷۵٪</span>
              <span>۱۰۰٪</span>
            </div>
          </div>
        </section>

        {/* شرایط محیطی */}
        <section className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="mb-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
            شرایط محیطی (تأثیر بر برد)
          </p>

          <div className="space-y-3">
            {/* دما */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300">
                  <Thermometer
                    size={14}
                    className="text-[#E74C3C]"
                  />
                  دمای هوا
                </label>

                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {weather.temp}°C
                </span>
              </div>

              <input
                type="range"
                min="-10"
                max="45"
                value={weather.temp}
                onChange={(e) =>
                  onWeatherChange({
                    ...weather,
                    temp: parseInt(e.target.value, 10),
                  })
                }
                className="w-full accent-emerald-500"
              />

              <div className="mt-1 flex justify-between text-[10px] text-gray-400 dark:text-gray-500">
                <span>-۱۰°C</span>
                <span>۰°C</span>
                <span>۱۵°C</span>
                <span>۳۰°C</span>
                <span>۴۵°C</span>
              </div>
            </div>

            {/* کولر و بخاری */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() =>
                  onWeatherChange({
                    ...weather,
                    ac: !weather.ac,
                    heat: false,
                  })
                }
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm font-semibold dark:bg-gray-700"
                style={{
                  background: weather.ac
                    ? "#EBF5FB"
                    : "#f8f9fa",
                  borderColor: weather.ac
                    ? "#3498DB"
                    : "#e5e7eb",
                  color: weather.ac ? "#3498DB" : undefined,
                }}
              >
                <Wind size={14} />
                <span className="dark:text-white">
                  کولر {weather.ac ? "(فعال)" : ""}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onWeatherChange({
                    ...weather,
                    heat: !weather.heat,
                    ac: false,
                  })
                }
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm font-semibold dark:bg-gray-700"
                style={{
                  background: weather.heat
                    ? "#FEF3E2"
                    : "#f8f9fa",
                  borderColor: weather.heat
                    ? "#E67E22"
                    : "#e5e7eb",
                  color: weather.heat ? "#E67E22" : undefined,
                }}
              >
                <Thermometer size={14} />
                <span className="dark:text-white">
                  بخاری {weather.heat ? "(فعال)" : ""}
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* ادامه */}
        <button
          type="button"
          onClick={onContinue}
          disabled={!userRange || !currentBattery}
          className="w-full rounded-2xl py-3.5 text-sm font-bold text-white disabled:opacity-50"
          style={{
            background: "#2ECC71",
            fontFamily: "Vazirmatn",
          }}
        >
          ادامه — تعیین مبدا و مقصد
        </button>
      </div>
    </div>
  );
}