import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function Routes() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" style={{ paddingBottom: 80 }}>
      <div className="bg-white px-4 py-3 flex items-center gap-3 border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="text-2xl">←</button>
        <span style={{ fontSize: 16, fontWeight: 600 }}>مسیر هوشمند</span>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <div style={{ fontSize: 60 }}>🗺️</div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginTop: 16, marginBottom: 8 }}>
          مسیریابی هوشمند
        </h2>
        <p style={{ fontSize: 14, color: '#888', lineHeight: 1.7 }}>
          این بخش به زودی اضافه می‌شود.<br />
          بهترین مسیر با توقف‌های شارژ بهینه.
        </p>
      </div>
    </div>
  )
}
