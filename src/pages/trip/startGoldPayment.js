export function startGoldPayment({ navigate, returnTo = '/trip' } = {}) {
  if (typeof navigate === 'function') {
    navigate('/plans', { state: { returnTo } })
    return
  }
  window.location.assign('/plans')
}
