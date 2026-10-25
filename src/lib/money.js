export function formatToman(value) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return '—'
  return `${Math.round(amount).toLocaleString('fa-IR')} تومان`
}

export function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('fa-IR')
}

export function formatDate(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('fa-IR')
}
