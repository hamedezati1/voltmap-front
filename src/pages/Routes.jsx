import { useNavigate } from 'react-router-dom'
import { ArrowRight, Map, Route } from 'lucide-react'

export default function Routes() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" style={{ paddingBottom: 80 }}>
      <div className="bg-white px-4 py-3 flex items-center gap-3 border-b border-gray-100">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 transition-colors hover:bg-gray-200"
        >
          <ArrowRight size={20} color="#333" />
        </button>
        <span style={{ fontSize: 16, fontWeight: 600 }}>مسیر هوشمند</span>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <div
          className="flex h-24 w-24 items-center justify-center rounded-3xl"
          style={{ background: '#f0faf5' }}
        >
          <Map size={48} className="text-emerald-400" strokeWidth={1.5} />
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginTop: 16, marginBottom: 8 }}>
          مسیریابی هوشمند
        </h2>
        <p style={{ fontSize: 14, color: '#888', lineHeight: 1.7, marginBottom: 24 }}>
          این بخش به زودی اضافه می‌شود.<br />
          بهترین مسیر با توقف‌های شارژ بهینه.
        </p>
        <div className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm text-emerald-600" style={{ background: '#f0faf5' }}>
          <Route size={16} />
          <span>در حال توسعه</span>
        </div>
      </div>
    </div>
  )
}
