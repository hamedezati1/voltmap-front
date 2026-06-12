export default function StatusDonutChart({ total, available, busy, waiting }) {
  if (total === 0) {
    return (
      <div style={{ position: 'relative', width: 140, height: 140 }}>
        <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f0f0f0" strokeWidth="3.5" />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#1a1a1a' }}>0</div>
          <div style={{ fontSize: 11, color: '#aaa' }}>جمع کل</div>
        </div>
      </div>
    )
  }

  const availablePct = (available / total) * 100
  const busyPct = (busy / total) * 100
  const waitingPct = (waiting / total) * 100

  return (
    <div style={{ position: 'relative', width: 140, height: 140 }}>
      <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f0f0f0" strokeWidth="3.5" />
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#2ECC71" strokeWidth="3.5"
          strokeDasharray={`${availablePct} 100`} strokeLinecap="round" />
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#F39C12" strokeWidth="3.5"
          strokeDasharray={`${busyPct} 100`}
          strokeDashoffset={`${-availablePct}`} strokeLinecap="round" />
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#3498DB" strokeWidth="3.5"
          strokeDasharray={`${waitingPct} 100`}
          strokeDashoffset={`${-(availablePct + busyPct)}`} strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#1a1a1a' }}>{total}</div>
        <div style={{ fontSize: 11, color: '#aaa' }}>جمع کل</div>
      </div>
    </div>
  )
}
