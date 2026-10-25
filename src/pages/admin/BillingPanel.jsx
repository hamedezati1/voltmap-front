import { useEffect, useState } from 'react'
import { CreditCard, Loader2, Trash2 } from 'lucide-react'
import { deleteAdminPayment, fetchAdminPayments, fetchAdminPlans, updateAdminPlan } from '../../api'
import { formatDateTime, formatToman } from '../../lib/money'
import StatCard from './StatCard'
import useIsMobile from './useIsMobile'

const STATUS_LABEL = {
  pending: 'در انتظار',
  paid: 'پرداخت‌شده',
  failed: 'ناموفق',
  cancelled: 'لغو شده',
}

const GATEWAY_LABEL = {
  zibal: 'زیبال',
}

const PAGE_SIZE = 20

export default function BillingPanel() {
  const isMobile = useIsMobile()
  const [plans, setPlans] = useState([])
  const [drafts, setDrafts] = useState({})
  const [savingId, setSavingId] = useState(null)
  const [payments, setPayments] = useState({ items: [], page: 1, total: 0, totalPages: 0, summary: { count: 0, paidCount: 0, paidAmountToman: 0 } })
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  const loadPayments = async (nextPage, filters) => {
    const data = await fetchAdminPayments({
      status: filters.status,
      from: filters.from,
      to: filters.to,
      page: nextPage,
      pageSize: PAGE_SIZE,
    })
    setPayments(data)
    setPage(data.page || nextPage)
    return data
  }

  useEffect(() => {
    Promise.all([fetchAdminPlans(), fetchAdminPayments({ page: 1, pageSize: PAGE_SIZE })])
      .then(([planList, paymentList]) => {
        setPlans(planList)
        setDrafts(Object.fromEntries(planList.map((plan) => [plan.id, String(plan.amountToman)])))
        setPayments(paymentList)
      })
      .catch((err) => setMessage(err.message || 'خواندن اطلاعات ناموفق بود'))
      .finally(() => setLoading(false))
  }, [])

  const savePlan = async (plan) => {
    const amountToman = Number(String(drafts[plan.id]).replace(/,/g, ''))
    if (!Number.isInteger(amountToman) || amountToman < 100) {
      setMessage('مبلغ باید عدد صحیح و حداقل ۱۰۰ تومان باشد')
      return
    }
    setSavingId(plan.id)
    setMessage('')
    try {
      const updated = await updateAdminPlan(plan.id, { amountToman, isActive: plan.isActive })
      setPlans((prev) => prev.map((item) => (item.id === plan.id ? updated : item)))
      setDrafts((prev) => ({ ...prev, [plan.id]: String(updated.amountToman) }))
      setMessage('قیمت ذخیره شد. خریدهای بعدی همین مبلغ را به درگاه می‌فرستند.')
    } catch (err) {
      setMessage(err.message || 'ذخیره قیمت ناموفق بود')
    } finally {
      setSavingId(null)
    }
  }

  const togglePlan = async (plan) => {
    setSavingId(plan.id)
    try {
      const updated = await updateAdminPlan(plan.id, { isActive: !plan.isActive })
      setPlans((prev) => prev.map((item) => (item.id === plan.id ? updated : item)))
    } catch (err) {
      setMessage(err.message || 'تغییر وضعیت پلن ناموفق بود')
    } finally {
      setSavingId(null)
    }
  }

  const applyFilters = async () => {
    setMessage('')
    try {
      await loadPayments(1, { status, from, to })
    } catch (err) {
      setMessage(err.message || 'خواندن پرداخت‌ها ناموفق بود')
    }
  }

  const changePage = async (nextPage) => {
    setMessage('')
    try {
      await loadPayments(nextPage, { status, from, to })
    } catch (err) {
      setMessage(err.message || 'خواندن پرداخت‌ها ناموفق بود')
    }
  }

  const removePayment = async (item) => {
    const confirmed = window.confirm('این ردیف پرداخت حذف شود؟ اشتراک فعلی کاربر تغییر نمی‌کند.')
    if (!confirmed) return
    setDeletingId(item.id)
    setMessage('')
    try {
      await deleteAdminPayment(item.id)
      const currentCount = (payments.items || []).length
      const nextPage = currentCount === 1 && page > 1 ? page - 1 : page
      await loadPayments(nextPage, { status, from, to })
    } catch (err) {
      setMessage(err.message || 'حذف پرداخت ناموفق بود')
    } finally {
      setDeletingId(null)
    }
  }

  const summary = payments.summary || { count: 0, paidCount: 0, paidAmountToman: 0 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <StatCard label="همهٔ سفارش‌ها" value={summary.count ?? 0} sub="در فیلتر فعلی" subUp Icon={CreditCard} color="#3498DB" bg="#EBF5FB" />
        <StatCard label="پرداخت موفق" value={summary.paidCount ?? 0} sub="در فیلتر فعلی" subUp Icon={CreditCard} color="#27AE60" bg="#e8faf0" />
        <StatCard label="جمع مبلغ موفق" value={formatToman(summary.paidAmountToman || 0)} sub="در فیلتر فعلی" subUp Icon={CreditCard} color="#1a7a40" bg="#e8faf0" />
      </div>

      {message && (
        <div style={{ background: '#fff', border: '1px solid #eef0f3', borderRadius: 12, padding: '10px 14px', fontSize: 13, color: '#444' }}>
          {message}
        </div>
      )}

      <section style={{ background: '#fff', borderRadius: 16, border: '1px solid #eef0f3', padding: isMobile ? 12 : 20 }}>
        <h2 style={{ margin: '0 0 6px', fontSize: 16 }}>قیمت پلن‌ها</h2>
        <p style={{ margin: '0 0 14px', fontSize: 12, color: '#888', lineHeight: 1.7 }}>
          مبلغ به تومان است. با ذخیره، درگاه از همین لحظه قیمت جدید را می‌فرستد. سفارش‌های قبلی با مبلغ همان لحظهٔ خرید باقی می‌مانند.
        </p>
        {loading ? <Loader2 className="animate-spin" size={20} /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {plans.map((plan) => (
              <div key={plan.id} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', border: '1px solid #f0f0f0', borderRadius: 12, padding: 10 }}>
                <div style={{ minWidth: 140, flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{plan.title}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{plan.membership} · {plan.durationMonths} ماه</div>
                </div>
                <input
                  value={drafts[plan.id] ?? ''}
                  onChange={(e) => setDrafts((prev) => ({ ...prev, [plan.id]: e.target.value }))}
                  inputMode="numeric"
                  style={{ width: 140, border: '1px solid #e5e7eb', borderRadius: 10, padding: '8px 10px', fontFamily: 'Vazirmatn' }}
                />
                <span style={{ fontSize: 12, color: '#888' }}>تومان</span>
                <button type="button" onClick={() => savePlan(plan)} disabled={savingId === plan.id} style={buttonStyle}>
                  ذخیره
                </button>
                <button type="button" onClick={() => togglePlan(plan)} disabled={savingId === plan.id} style={{ ...buttonStyle, background: plan.isActive ? '#f3f4f6' : '#2ECC71', color: plan.isActive ? '#333' : '#fff' }}>
                  {plan.isActive ? 'فعال' : 'غیرفعال'}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={{ background: '#fff', borderRadius: 16, border: '1px solid #eef0f3', padding: isMobile ? 12 : 20 }}>
        <h2 style={{ margin: '0 0 12px', fontSize: 16 }}>پرداخت‌ها</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={inputStyle}>
            <option value="">همهٔ وضعیت‌ها</option>
            <option value="paid">پرداخت‌شده</option>
            <option value="pending">در انتظار</option>
            <option value="failed">ناموفق</option>
            <option value="cancelled">لغو شده</option>
          </select>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={inputStyle} />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={inputStyle} />
          <button type="button" onClick={applyFilters} style={buttonStyle}>محاسبه</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 760 }}>
            <thead>
              <tr style={{ textAlign: 'right', color: '#888' }}>
                {['کاربر', 'موبایل', 'پلن', 'مبلغ', 'درگاه', 'وضعیت', 'پیگیری', 'تاریخ', ''].map((head) => (
                  <th key={head} style={{ padding: '8px 6px', fontWeight: 600 }}>{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(payments.items || []).map((item) => (
                <tr key={item.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                  <td style={cell}>{item.userName || '—'}</td>
                  <td style={cell}>{item.userPhone || '—'}</td>
                  <td style={cell}>{item.planTitle || item.membership}</td>
                  <td style={cell}>{formatToman(item.amountToman)}</td>
                  <td style={cell}>{GATEWAY_LABEL[item.gateway] || item.gateway}</td>
                  <td style={cell}>{STATUS_LABEL[item.status] || item.status}</td>
                  <td style={cell}>{item.refNumber || item.trackId || '—'}</td>
                  <td style={cell}>{formatDateTime(item.paidAt || item.createdAt)}</td>
                  <td style={cell}>
                    <button
                      type="button"
                      onClick={() => removePayment(item)}
                      disabled={deletingId === item.id}
                      aria-label="حذف پرداخت"
                      style={{ ...buttonStyle, background: '#e74c3c', padding: '6px 10px' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {(payments.items || []).length === 0 && (
                <tr>
                  <td colSpan={9} style={{ padding: 20, textAlign: 'center', color: '#999' }}>پرداختی در این بازه نیست</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: '#888' }}>
            {payments.total ? `${payments.total.toLocaleString('fa-IR')} ردیف` : '۰ ردیف'}
            {payments.totalPages > 0 ? ` · صفحه ${page.toLocaleString('fa-IR')} از ${payments.totalPages.toLocaleString('fa-IR')}` : ''}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => changePage(page - 1)} disabled={page <= 1} style={{ ...buttonStyle, background: page <= 1 ? '#e5e7eb' : '#0f1923', color: page <= 1 ? '#9ca3af' : '#fff', cursor: page <= 1 ? 'default' : 'pointer' }}>
              قبلی
            </button>
            <button type="button" onClick={() => changePage(page + 1)} disabled={page >= (payments.totalPages || 0)} style={{ ...buttonStyle, background: page >= (payments.totalPages || 0) ? '#e5e7eb' : '#0f1923', color: page >= (payments.totalPages || 0) ? '#9ca3af' : '#fff', cursor: page >= (payments.totalPages || 0) ? 'default' : 'pointer' }}>
              بعدی
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

const buttonStyle = {
  border: 'none',
  background: '#2ECC71',
  color: '#fff',
  borderRadius: 10,
  padding: '8px 12px',
  cursor: 'pointer',
  fontFamily: 'Vazirmatn',
  fontWeight: 700,
  fontSize: 13,
}

const inputStyle = {
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  padding: '8px 10px',
  fontFamily: 'Vazirmatn',
  background: '#fff',
}

const cell = { padding: '10px 6px', whiteSpace: 'nowrap' }
