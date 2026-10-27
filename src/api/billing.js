import { apiClient, USE_MOCK } from './client'

const MOCK_PLANS = [
  { id: '11111111-1111-4111-8111-111111111101', code: 'pro_1m', membership: 'pro', title: 'پرو یک‌ماهه', durationMonths: 1, amountToman: 199000, amountRials: 1990000, isActive: true },
  { id: '11111111-1111-4111-8111-111111111106', code: 'pro_6m', membership: 'pro', title: 'پرو شش‌ماهه', durationMonths: 6, amountToman: 999000, amountRials: 9990000, isActive: true },
  { id: '11111111-1111-4111-8111-111111111112', code: 'pro_12m', membership: 'pro', title: 'پرو یک‌ساله', durationMonths: 12, amountToman: 1788000, amountRials: 17880000, isActive: true },
]

export async function fetchPlans() {
  if (USE_MOCK) return MOCK_PLANS
  const list = await apiClient('/billing/plans')
  return Array.isArray(list) ? list : []
}

export async function checkoutPlan(planId) {
  if (USE_MOCK) throw new Error('پرداخت فقط با اتصال به سرور واقعی انجام می‌شود')
  return apiClient('/billing/checkout', { method: 'POST', body: { planId } })
}

export async function fetchAdminPlans() {
  if (USE_MOCK) return MOCK_PLANS
  const list = await apiClient('/admin/plans')
  return Array.isArray(list) ? list : []
}

export async function updateAdminPlan(planId, body) {
  if (USE_MOCK) throw new Error('ویرایش قیمت فقط روی سرور واقعی ذخیره می‌شود')
  return apiClient(`/admin/plans/${planId}`, { method: 'PATCH', body })
}

export async function fetchAdminPayments(params = {}) {
  if (USE_MOCK) {
    return { items: [], page: 1, pageSize: 20, total: 0, totalPages: 0, summary: { count: 0, paidCount: 0, paidAmountToman: 0 } }
  }
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value))
  }
  const suffix = query.toString() ? `?${query}` : ''
  return apiClient(`/admin/payments${suffix}`)
}

export async function deleteAdminPayment(id) {
  if (USE_MOCK) throw new Error('حذف پرداخت فقط روی سرور واقعی انجام می‌شود')
  await apiClient(`/admin/payments/${id}`, { method: 'DELETE' })
}
