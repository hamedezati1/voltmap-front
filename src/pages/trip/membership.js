const GOLD_LEVELS = new Set(['طلایی', 'ویژه', 'حرفه‌ای', 'gold', 'plus', 'pro'])

export function isGoldMember(user) {
  return GOLD_LEVELS.has(user?.membership)
}
