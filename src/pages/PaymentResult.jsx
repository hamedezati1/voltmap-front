import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle, XCircle } from 'lucide-react'
import { fetchCurrentUser } from '../api'
import { useAuth } from '../context/AuthContext'

const RETURN_KEY = 'voltmap_payment_return'

const COPY = {
  success: {
    title: 'پرداخت تأیید شد',
    text: 'اشتراک پرو شما فعال شد. اگر هنوز پرو بودید، مدت جدید به انتهای اشتراک فعلی اضافه شده است.',
  },
  cancelled: {
    title: 'پرداخت لغو شد',
    text: 'مبلغی از حساب شما کم نشده و اشتراک تغییری نکرده است.',
  },
  failed: {
    title: 'پرداخت تکمیل نشد',
    text: 'اگر مبلغی کسر شده باشد، تا تأیید نشدن درگاه اشتراک فعال نمی‌شود. می‌توانید دوباره از صفحهٔ پلن‌ها اقدام کنید.',
  },
}

export default function PaymentResult() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { setUser } = useAuth()
  const status = params.get('status') === 'success' || params.get('status') === 'cancelled'
    ? params.get('status')
    : 'failed'
  const copy = COPY[status]
  const [returnTo, setReturnTo] = useState('/profile')

  useEffect(() => {
    setReturnTo(sessionStorage.getItem(RETURN_KEY) || '/profile')
    fetchCurrentUser({ showToast: false })
      .then((user) => { if (user) setUser(user) })
      .catch(() => {})
  }, [setUser])

  const ok = status === 'success'

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-50 px-5 py-16 text-center dark:bg-gray-900" style={{ paddingBottom: 96 }}>
      <div className={`mb-5 flex h-20 w-20 items-center justify-center rounded-3xl ${ok ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-red-50 dark:bg-red-900/20'}`}>
        {ok ? <CheckCircle size={36} className="text-emerald-500" /> : <XCircle size={36} className="text-red-500" />}
      </div>
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">{copy.title}</h1>
      <p className="mt-3 max-w-xs text-sm leading-7 text-gray-500 dark:text-gray-400">{copy.text}</p>
      <button
        type="button"
        onClick={() => navigate(ok ? returnTo : '/plans', { replace: true })}
        className="mt-8 w-full rounded-2xl py-3.5 text-sm font-bold text-white"
        style={{ background: '#2ECC71' }}
      >
        {ok ? 'ادامه' : 'بازگشت به پلن‌ها'}
      </button>
      <button
        type="button"
        onClick={() => navigate('/profile', { replace: true })}
        className="mt-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400"
      >
        پروفایل
      </button>
    </div>
  )
}
