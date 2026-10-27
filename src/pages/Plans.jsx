import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Check, Crown, Loader2 } from 'lucide-react'
import { checkoutPlan, fetchPlans, fetchCurrentUser } from '../api'
import { useAuth } from '../context/AuthContext'
import { membershipLabel, isPaidMember } from '../lib/membership'
import { formatDate, formatToman } from '../lib/money'

const RETURN_KEY = 'voltmap_payment_return'

function durationLabel(months) {
  if (Number(months) === 12) return 'یک‌ساله'
  if (Number(months) === 6) return 'شش‌ماهه'
  if (Number(months) === 1) return 'یک‌ماهه'
  return `${Number(months).toLocaleString('fa-IR')} ماهه`
}

export default function Plans() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, setUser } = useAuth()
  const returnTo = location.state?.returnTo || '/profile'
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [buyingId, setBuyingId] = useState(null)

  useEffect(() => {
    fetchPlans()
      .then(setPlans)
      .catch((err) => setError(err.message || 'خواندن پلن‌ها ناموفق بود'))
      .finally(() => setLoading(false))
    fetchCurrentUser({ showToast: false })
      .then((fresh) => { if (fresh) setUser(fresh) })
      .catch(() => {})
  }, [setUser])

  const bestId = useMemo(() => {
    if (plans.length === 0) return null
    return plans.reduce((best, plan) => {
      const monthly = plan.amountToman / plan.durationMonths
      const bestMonthly = best.amountToman / best.durationMonths
      return monthly < bestMonthly ? plan : best
    }).id
  }, [plans])

  const buy = async (plan) => {
    setBuyingId(plan.id)
    setError('')
    try {
      const result = await checkoutPlan(plan.id)
      sessionStorage.setItem(RETURN_KEY, returnTo)
      window.location.assign(result.paymentUrl)
    } catch (err) {
      setError(err.message || 'اتصال به درگاه ناموفق بود')
      setBuyingId(null)
    }
  }

  const expiry = formatDate(user?.membershipExpiresAt)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" style={{ paddingBottom: 96 }}>
      <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(returnTo)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700"
            aria-label="بازگشت"
          >
            <ArrowRight size={16} className="text-gray-600 dark:text-gray-200" />
          </button>
          <Crown size={18} className="text-emerald-500" />
          <span className="text-base font-bold text-gray-900 dark:text-white">خرید اشتراک پرو</span>
        </div>
      </div>

      <div className="px-4 py-5">
        <div className="rounded-2xl bg-white p-4 dark:bg-gray-800">
          <p className="text-sm font-bold text-gray-900 dark:text-white">اشتراک فعلی: {membershipLabel(user?.membership)}</p>
          <p className="mt-1 text-xs leading-6 text-gray-500 dark:text-gray-400">
            {isPaidMember(user) && user?.role !== 'admin' && expiry
              ? `تا ${expiry} فعال است. خرید دوباره از همین تاریخ تمدید می‌شود.`
              : 'با پرو می‌توانید سفر را برنامه‌ریزی کنید و ایستگاه جدید ثبت کنید.'}
          </p>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 size={26} className="animate-spin text-emerald-500" />
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-xs leading-6 text-red-600 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </p>
        )}

        <div className="mt-4 space-y-3">
          {plans.map((plan) => {
            const monthly = Math.round(plan.amountToman / plan.durationMonths)
            const highlighted = plan.id === bestId && plans.length > 1
            return (
              <article
                key={plan.id}
                className="rounded-2xl bg-white p-4 dark:bg-gray-800"
                style={{ border: highlighted ? '1.5px solid #2ECC71' : '1px solid transparent' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white">{plan.title}</h2>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{durationLabel(plan.durationMonths)}</p>
                  </div>
                  {highlighted && (
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                      به‌صرفه‌ترین
                    </span>
                  )}
                </div>
                <p className="mt-3 text-lg font-bold text-gray-900 dark:text-white">{formatToman(plan.amountToman)}</p>
                <p className="text-[11px] text-gray-400">ماهی {formatToman(monthly)}</p>
                <ul className="mt-3 space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
                  <li className="flex items-center gap-1.5"><Check size={14} className="text-emerald-500" /> برنامه‌ریزی سفر</li>
                  <li className="flex items-center gap-1.5"><Check size={14} className="text-emerald-500" /> ثبت ایستگاه جدید</li>
                </ul>
                <button
                  type="button"
                  disabled={buyingId === plan.id}
                  onClick={() => buy(plan)}
                  className="mt-4 flex w-full items-center justify-center rounded-xl py-3 text-sm font-bold text-white disabled:opacity-60"
                  style={{ background: '#2ECC71' }}
                >
                  {buyingId === plan.id ? 'در حال اتصال به درگاه...' : 'پرداخت و فعال‌سازی'}
                </button>
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}
