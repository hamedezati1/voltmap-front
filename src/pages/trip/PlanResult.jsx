import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  DollarSign,
  Info,
  Navigation,
  Star,
  TrendingUp,
} from 'lucide-react'
import { scoreColor } from './tripEngine'

export default function PlanResult({ result, currentBattery }) {
  const navigate = useNavigate()
  if (!result) return null

  return (
    <div className="space-y-3">
      {result.needsPreCharge && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-900/20">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle size={18} color="#F59E0B" />
            <span className="text-sm font-bold text-amber-700 dark:text-amber-400">قبل از حرکت شارژ کنید</span>
          </div>
          <p className="mb-3 text-xs leading-5 text-amber-700 dark:text-amber-300">
            با شارژ فعلی ({currentBattery}٪) به مقصد نمی‌رسید. اما با شارژ ۱۰۰٪ می‌توانید مستقیم برسید.
          </p>
          {result.preChargeStation && (
            <div className="rounded-xl bg-white p-2.5 dark:bg-gray-700">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                نزدیک‌ترین ایستگاه: {result.preChargeStation.name}
              </p>
              <button
                type="button"
                onClick={() =>
                  window.open(
                    `https://maps.google.com/?q=${result.preChargeStation.lat},${result.preChargeStation.lng}&navigate=yes`,
                  )
                }
                className="mt-2 w-full rounded-lg py-1.5 text-[11px] font-bold text-white"
                style={{ background: '#2ECC71' }}
              >
                مسیریابی
              </button>
            </div>
          )}
        </div>
      )}

      {!result.needsPreCharge && (
        <div
          className={`rounded-2xl border p-4 ${
            result.feasible
              ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20'
              : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
          }`}
        >
          <div className="mb-2 flex items-center gap-2">
            {result.feasible ? <CheckCircle size={18} color="#27AE60" /> : <AlertTriangle size={18} color="#E74C3C" />}
            <span className="text-sm font-bold" style={{ color: result.feasible ? '#27AE60' : '#E74C3C' }}>
              {result.message}
            </span>
          </div>
          <div className="flex gap-3 text-xs text-gray-600 dark:text-gray-300">
            <span>📏 فاصله کل: {result.totalDist} km</span>
            <span>🔋 شارژ در مقصد: ~{result.finalBattery}٪</span>
          </div>
        </div>
      )}

      {result.stops.some((stop) => !stop.disabled) && (
        <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-2">
              <DollarSign size={16} className="text-emerald-500" />
              <span className="text-sm font-bold text-gray-900 dark:text-white">هزینه کل سفر</span>
            </div>
            <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
              {(result.totalCost || 0).toLocaleString('fa-IR')} تومان
            </span>
          </div>
        </div>
      )}

      {!result.needsPreCharge &&
        result.warnings.map((w, i) => (
          <div
            key={i}
            className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20"
          >
            <Info size={15} color="#F59E0B" className="mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-300">{w}</p>
          </div>
        ))}

      {result.stops.map((stop, i) => (
        <div
          key={i}
          className={`rounded-2xl border p-4 ${
            stop.disabled
              ? 'border-gray-200 bg-gray-100 opacity-80 dark:border-gray-700 dark:bg-gray-800'
              : 'border-gray-100 bg-white dark:border-gray-600 dark:bg-gray-700'
          }`}
        >
          <div className="mb-2 flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ background: stop.disabled ? '#95a5a6' : scoreColor(stop.score) }}
              >
                {i + 1}
              </div>
              <div>
                <p className={`text-sm font-bold ${stop.disabled ? 'text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                  {stop.station.name}
                </p>
                <p className="text-xs text-gray-400">{stop.station.city}</p>
              </div>
            </div>
            {!stop.disabled && (
              <div className="text-right">
                <div className="flex items-center gap-1">
                  <Star size={11} color="#F39C12" fill="#F39C12" />
                  <span className="text-xs font-bold" style={{ color: scoreColor(stop.score) }}>
                    امتیاز {stop.score}
                  </span>
                </div>
              </div>
            )}
          </div>
          {stop.disabled ? (
            <p className="text-xs leading-5 text-gray-500 dark:text-gray-400">{stop.reason}</p>
          ) : (
            <>
              <p className="mb-2 text-xs text-gray-500">
                از {stop.chargeFrom}٪ به {stop.chargeTo}٪ · حدود {stop.chargeTimeMin} دقیقه
              </p>
              {stop.deviation > 5 && (
                <p className="mb-2 flex items-center gap-1 text-xs text-amber-600">
                  <TrendingUp size={11} /> انحراف از مسیر: {stop.deviation} کیلومتر
                </p>
              )}
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    window.open(`https://maps.google.com/?q=${stop.station.lat},${stop.station.lng}&navigate=yes`)
                  }
                  className="flex flex-1 items-center justify-center gap-1 rounded-xl py-2 text-xs font-bold text-white"
                  style={{ background: '#2ECC71' }}
                >
                  <Navigation size={12} /> مسیریابی
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/station/${stop.station.id}`)}
                  className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-emerald-50 py-2 text-xs font-semibold text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
                >
                  جزئیات <ChevronLeft size={12} />
                </button>
              </div>
            </>
          )}
        </div>
      ))}

      {result.feasible && result.stops.length === 0 && !result.needsPreCharge && (
        <div className="rounded-2xl border border-gray-100 bg-white p-4 text-center dark:border-gray-600 dark:bg-gray-700">
          <CheckCircle size={28} color="#27AE60" className="mx-auto mb-2" />
          <p className="text-sm font-bold text-gray-900 dark:text-white">بدون نیاز به توقف!</p>
          <p className="mt-1 text-xs text-gray-500">
            با شارژ {currentBattery}٪ مستقیم به مقصد می‌رسید و حدود {result.finalBattery}٪ باتری باقی می‌ماند.
          </p>
        </div>
      )}
    </div>
  )
}
