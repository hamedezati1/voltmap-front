import { config } from '../../../config/index.js'

const REFRESH_COOKIE = 'voltmap_refresh'

/** همان واحدهای JWT_REFRESH_TTL (مثلاً 30d) تا کوکی با توکن هم‌عمر بماند. */
function ttlToMs(ttl) {
  const match = /^(\d+)\s*([smhd])$/i.exec(String(ttl ?? '').trim())
  if (!match) return 30 * 24 * 60 * 60 * 1000
  const amount = Number(match[1])
  const unitMs = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[match[2].toLowerCase()]
  return amount * unitMs
}

function refreshCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.isProd,
    path: '/api/auth',
    // بدون maxAge کوکی نشست است و با بستن مرورگر/اپ گوشی پاک می‌شود.
    maxAge: ttlToMs(config.jwt.refreshTtl),
  }
}

function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE, token, refreshCookieOptions())
}

function clearRefreshCookie(res) {
  const { maxAge: _maxAge, ...options } = refreshCookieOptions()
  res.clearCookie(REFRESH_COOKIE, options)
}

export function createAuthController(authService) {
  return {
    async requestOtp(req, res, next) {
      try {
        const result = await authService.requestOtp(req.body)
        res.json(result)
      } catch (err) { next(err) }
    },

    async verifyOtp(req, res, next) {
      try {
        const { accessToken, refreshToken, user } = await authService.verifyOtp(req.body)
        setRefreshCookie(res, refreshToken)
        const status = req.body.purpose === 'register' ? 201 : 200
        res.status(status).json({ token: accessToken, user })
      } catch (err) { next(err) }
    },

    async refresh(req, res, next) {
      try {
        const oldToken = req.cookies?.[REFRESH_COOKIE]
        const { accessToken, refreshToken, user } = await authService.refresh(oldToken)
        setRefreshCookie(res, refreshToken)
        res.json({ token: accessToken, user })
      } catch (err) { next(err) }
    },

    async logout(req, res, next) {
      try {
        const token = req.cookies?.[REFRESH_COOKIE]
        await authService.logout(token)
        clearRefreshCookie(res)
        res.status(204).send()
      } catch (err) { next(err) }
    },

    async me(req, res, next) {
      try {
        const user = await authService.getSession(req.auth.userId)
        res.json({ user })
      } catch (err) { next(err) }
    },
  }
}
