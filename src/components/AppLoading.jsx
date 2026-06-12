import { Loader2 } from 'lucide-react'

export default function AppLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={32} className="animate-spin text-emerald-500" />
        <p className="text-sm text-gray-400">در حال بارگذاری...</p>
      </div>
    </div>
  )
}
