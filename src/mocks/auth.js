const USERS_KEY = 'voltmap_users'
const SESSION_KEY = 'voltmap_session'

function readUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function getStoredSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearStoredSession() {
  localStorage.removeItem(SESSION_KEY)
}

function delay(ms = 400) {
  return new Promise(r => setTimeout(r, ms))
}

export const mockAuth = {
  async login({ identifier, password }) {
    await delay()
    const users = readUsers()
    const user = users.find(
      u => (u.email === identifier || u.phone === identifier) && u.password === password
    )
    if (!user) {
      const err = new Error('ایمیل/موبایل یا رمز عبور اشتباه است')
      err.status = 401
      throw err
    }
    const session = {
      token: `mock-token-${user.id}`,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, membership: user.membership ?? 'رایگان' },
    }
    saveSession(session)
    return session
  },

  async register({ name, email, phone, password }) {
    await delay()
    const users = readUsers()
    if (users.some(u => u.email === email)) {
      const err = new Error('این ایمیل قبلاً ثبت شده است')
      err.status = 409
      throw err
    }
    if (users.some(u => u.phone === phone)) {
      const err = new Error('این شماره موبایل قبلاً ثبت شده است')
      err.status = 409
      throw err
    }
    const newUser = {
      id: Date.now(),
      name,
      email,
      phone,
      password,
      membership: 'رایگان', // TODO: وقتی به دیتابیس وصل شد از payment سرویس بگیر
      createdAt: new Date().toISOString(),
    }
    writeUsers([...users, newUser])
    const session = {
      token: `mock-token-${newUser.id}`,
      user: { id: newUser.id, name: newUser.name, email: newUser.email, phone: newUser.phone, membership: newUser.membership },
    }
    saveSession(session)
    return session
  },

  async logout() {
    await delay(200)
    clearStoredSession()
  },

  async getSession() {
    await delay(200)
    return getStoredSession()
  },
}

// تغییر membership کاربر (برای ادمین)
// TODO: PATCH /admin/users/:id/membership
export function updateUserMembership(userId, membership) {
  const users = readUsers()
  const updated = users.map(u => u.id === userId ? { ...u, membership } : u)
  writeUsers(updated)
  // آپدیت session هم بشه
  const session = getStoredSession()
  if (session?.user?.id === userId) {
    const newSession = { ...session, user: { ...session.user, membership } }
    saveSession(newSession)
  }
  return true
}
