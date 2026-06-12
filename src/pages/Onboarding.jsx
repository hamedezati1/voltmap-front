import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { ONBOARDING_SLIDES } from '../data/onboarding'
import { setOnboardingDone } from '../lib/storage'

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const slide = ONBOARDING_SLIDES[step]
  const isLast = step === ONBOARDING_SLIDES.length - 1
  const { Icon } = slide

  const handleNext = () => {
    if (isLast) {
      setOnboardingDone()
      navigate('/auth?tab=register', { replace: true })
      return
    }
    setStep(s => s + 1)
  }

  const handleSkip = () => {
    setOnboardingDone()
    navigate('/auth?tab=login', { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-5">
        <div className="flex gap-1.5">
          {ONBOARDING_SLIDES.map((_, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === step ? 28 : 8,
                background: i === step ? '#2ECC71' : i < step ? '#a8e6c1' : '#e8e8e8',
              }}
            />
          ))}
        </div>
        {!isLast && (
          <button
            onClick={handleSkip}
            className="text-sm text-gray-400 transition-colors hover:text-gray-600"
          >
            رد کردن
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <div
          className="mb-10 flex h-36 w-36 items-center justify-center rounded-[2rem] transition-all duration-500"
          style={{ background: slide.bg }}
        >
          <Icon size={64} color={slide.color} strokeWidth={1.5} />
        </div>
        <h2 className="mb-4 text-2xl font-bold text-gray-900">{slide.title}</h2>
        <p className="max-w-xs text-sm leading-7 text-gray-500">{slide.description}</p>
      </div>

      {/* Bottom */}
      <div className="px-6 pb-10 pt-4">
        <button
          onClick={handleNext}
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold text-white transition-opacity active:opacity-90"
          style={{ background: '#2ECC71', fontFamily: 'Vazirmatn' }}
        >
          {isLast ? 'ثبت‌نام' : 'بعدی'}
          {!isLast && <ChevronLeft size={20} />}
        </button>
        {isLast && (
          <button
            onClick={() => {
              setOnboardingDone()
              navigate('/auth?tab=login', { replace: true })
            }}
            className="mt-3 w-full py-3 text-sm text-gray-500 transition-colors hover:text-gray-700"
          >
            قبلاً حساب دارم — ورود
          </button>
        )}
      </div>
    </div>
  )
}
