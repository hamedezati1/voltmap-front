const USERS_KEY = 'voltmap_users'
const SESSION_KEY = 'voltmap_session'
const OTP_KEY = 'voltmap_otps'

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

function readOtps() {
  try {
    const raw = localStorage.getItem(OTP_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeOtps(otps) {
  localStorage.setItem(OTP_KEY, JSON.stringify(otps))
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
  return new Promise((r) => setTimeout(r, ms))
}

function toPublic(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email ?? null,
    phone: user.phone,
    role: user.role ?? 'user',
    membership: user.membership ?? 'رایگان',
  }
}

export const mockAuth = {
  async requestOtp({ phone, purpose }) {
    await delay()
    const users = readUsers()
    const exists = users.some((u) => u.phone === phone)

    if (purpose === 'login' && !exists) {
      const err = new Error('حسابی با این شماره یافت نشد. ابتدا ثبت‌نام کنید')
      err.status = 400
      throw err
    }
    if (purpose === 'register' && exists) {
      const err = new Error('این شماره قبلاً ثبت شده است. وارد شوید')
      err.status = 409
      throw err
    }

    const code = '12345'
    const otps = readOtps()
    otps[phone] = { code, purpose, expiresAt: Date.now() + 120000 }
    writeOtps(otps)
    console.info(`[MOCK SMS] OTP for ${phone}: ${code}`)
    return { ok: true, phone, expiresIn: 120, resendAfter: 60 }
  },

  async verifyOtp({ phone, code, purpose, name }) {
    await delay()
    const otps = readOtps()
    const otp = otps[phone]
    if (!otp || otp.purpose !== purpose || otp.expiresAt < Date.now()) {
      const err = new Error('کد منقضی شده یا یافت نشد')
      err.status = 401
      throw err
    }
    if (String(code) !== String(otp.code)) {
      const err = new Error('کد تأیید اشتباه است')
      err.status = 401
      throw err
    }

    delete otps[phone]
    writeOtps(otps)

    let users = readUsers()
    let user = users.find((u) => u.phone === phone)

    if (purpose === 'register') {
      if (user) {
        const err = new Error('این شماره قبلاً ثبت شده است')
        err.status = 409
        throw err
      }
      user = {
        id: Date.now(),
        name: name?.trim() || 'کاربر',
        phone,
        email: null,
        role: 'user',
        membership: 'رایگان',
        createdAt: new Date().toISOString(),
      }
      users = [...users, user]
      writeUsers(users)
    } else if (!user) {
      const err = new Error('حسابی با این شماره یافت نشد')
      err.status = 401
      throw err
    }

    const session = {
      token: `mock-token-${user.id}`,
      user: toPublic(user),
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

export function updateUserMembership(userId, membership) {
  const users = readUsers()
  const updated = users.map((u) =>
    u.id === userId ? { ...u, membership } : u,
  )
  writeUsers(updated)
  const session = getStoredSession()
  if (session?.user?.id === userId) {
    const newSession = { ...session, user: { ...session.user, membership } }
    saveSession(newSession)
  }
  return true
}
