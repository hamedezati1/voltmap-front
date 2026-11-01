import { apiClient, USE_MOCK } from './client'

export async function checkoutDonation(amountToman) {
  if (USE_MOCK) throw new Error('حمایت مالی فقط با اتصال به سرور واقعی انجام می‌شود')
  return apiClient('/donations/checkout', {
    method: 'POST',
    body: { amountToman },
  })
}

export async function fetchAdminDonations(params = {}) {
  if (USE_MOCK) {
    return { items: [], page: 1, pageSize: 20, total: 0, totalPages: 0, summary: { count: 0, paidCount: 0, paidAmountToman: 0 } }
  }
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value))
  }
  const suffix = query.toString() ? `?${query}` : ''
  return apiClient(`/admin/donations${suffix}`)
}
