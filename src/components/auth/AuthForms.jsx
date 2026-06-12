import { useState } from 'react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition-colors focus:border-emerald-400 focus:bg-white'

const labelClass = 'mb-1.5 block text-xs font-medium text-gray-500'

export function LoginForm({ onSubmit, loading, error }) {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = e => {
    e.preventDefault()
    onSubmit({ identifier: identifier.trim(), password })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelClass}>ایمیل یا شماره موبایل</label>
        <input
          type="text"
          value={identifier}
          onChange={e => setIdentifier(e.target.value)}
          placeholder="user@example.com یا 0912..."
          className={inputClass}
          style={{ fontFamily: 'Vazirmatn' }}
          required
          dir="ltr"
        />
      </div>
      <div>
        <label className={labelClass}>رمز عبور</label>
        <div className="relative">
          <input
            type={showPass ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="رمز عبور"
            className={inputClass}
            style={{ fontFamily: 'Vazirmatn', paddingLeft: 44 }}
            required
            minLength={6}
            dir="ltr"
          />
          <button
            type="button"
            onClick={() => setShowPass(v => !v)}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          >
            {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>
      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white disabled:opacity-60"
        style={{ background: '#2ECC71', fontFamily: 'Vazirmatn' }}
      >
        {loading && <Loader2 size={18} className="animate-spin" />}
        ورود
      </button>
    </form>
  )
}

export function RegisterForm({ onSubmit, loading, error }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [localError, setLocalError] = useState('')

  const handleSubmit = e => {
    e.preventDefault()
    setLocalError('')
    if (password !== confirm) {
      setLocalError('رمز عبور و تکرار آن یکسان نیست')
      return
    }
    if (password.length < 6) {
      setLocalError('رمز عبور باید حداقل ۶ کاراکتر باشد')
      return
    }
    onSubmit({ name: name.trim(), email: email.trim(), phone: phone.trim(), password })
  }

  const displayError = localError || error

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      <div>
        <label className={labelClass}>نام و نام خانوادگی</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="علی محمدی"
          className={inputClass}
          style={{ fontFamily: 'Vazirmatn' }}
          required
        />
      </div>
      <div>
        <label className={labelClass}>ایمیل</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="user@example.com"
          className={inputClass}
          style={{ fontFamily: 'Vazirmatn' }}
          required
          dir="ltr"
        />
      </div>
      <div>
        <label className={labelClass}>شماره موبایل</label>
        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="09123456789"
          className={inputClass}
          style={{ fontFamily: 'Vazirmatn' }}
          required
          dir="ltr"
          pattern="09[0-9]{9}"
        />
      </div>
      <div>
        <label className={labelClass}>رمز عبور</label>
        <div className="relative">
          <input
            type={showPass ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="حداقل ۶ کاراکتر"
            className={inputClass}
            style={{ fontFamily: 'Vazirmatn', paddingLeft: 44 }}
            required
            minLength={6}
            dir="ltr"
          />
          <button
            type="button"
            onClick={() => setShowPass(v => !v)}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          >
            {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>
      <div>
        <label className={labelClass}>تکرار رمز عبور</label>
        <input
          type="password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          placeholder="رمز عبور را دوباره وارد کنید"
          className={inputClass}
          style={{ fontFamily: 'Vazirmatn' }}
          required
          dir="ltr"
        />
      </div>
      {displayError && (
        <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{displayError}</p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white disabled:opacity-60"
        style={{ background: '#2ECC71', fontFamily: 'Vazirmatn' }}
      >
        {loading && <Loader2 size={18} className="animate-spin" />}
        ثبت‌نام
      </button>
    </form>
  )
}
