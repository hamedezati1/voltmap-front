import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap } from 'lucide-react'

export default function Splash() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => navigate('/onboarding', { replace: true }), 2500)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center"
      style={{ background: 'linear-gradient(160deg, #2ECC71 0%, #1a8a40 100%)' }}
      onClick={() => navigate('/onboarding', { replace: true })}
    >
      <div className="splash-logo flex flex-col items-center animate-in">
        <div
          className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl shadow-2xl"
          style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}
        >
          <Zap size={52} color="#fff" fill="#fff" strokeWidth={1.5} />
        </div>
        <h1 className="text-4xl font-bold text-white">
          ولت<span style={{ opacity: 0.85 }}>مپ</span>
        </h1>
        <p className="mt-2 text-sm tracking-widest text-white/70">VoltMap</p>
        <p className="mt-8 text-sm text-white/60">شارژ هوشمند، سفر آسان</p>
      </div>

      <div className="absolute bottom-12 flex flex-col items-center gap-3">
        <div className="splash-dots flex gap-1.5">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="splash-dot h-1.5 rounded-full bg-white/40"
              style={{ width: i === 0 ? 24 : 6, animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
        <p className="text-xs text-white/50">برای ادامه لمس کنید</p>
      </div>
    </div>
  )
}
