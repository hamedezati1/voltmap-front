import { Loader2, MapPin, Navigation } from 'lucide-react'

export default function LocationPicker({
  label,
  query,
  onQueryChange,
  onSearch,
  searching,
  results,
  onSelectResult,
  selected,
  selectedColor = 'emerald',
  onUseMyLocation,
  onPickOnMap,
  placeholder,
}) {
  const selectedClass =
    selectedColor === 'red'
      ? 'text-red-500 dark:text-red-400'
      : 'text-emerald-600 dark:text-emerald-400'

  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-gray-500 dark:text-gray-400">{label}</label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            placeholder={placeholder}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-emerald-400 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            style={{ fontFamily: 'Vazirmatn' }}
          />
          {searching && (
            <Loader2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 animate-spin text-emerald-500" />
          )}
        </div>
        {onUseMyLocation && (
          <button
            type="button"
            onClick={onUseMyLocation}
            title="موقعیت فعلی"
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30"
          >
            <MapPin size={16} color="#2ECC71" />
          </button>
        )}
        <button
          type="button"
          onClick={onPickOnMap}
          title="انتخاب از نقشه"
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30"
        >
          <Navigation size={16} color="#3498DB" />
        </button>
        <button
          type="button"
          onClick={onSearch}
          className="h-10 flex-shrink-0 rounded-xl bg-gray-100 px-3 text-xs font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300"
        >
          جستجو
        </button>
      </div>
      <p className="mt-1 text-[10px] text-gray-400">می‌توانید lat,lng هم بنویسید؛ مثلاً 35.6892, 51.3890</p>
      {results.length > 0 && (
        <div className="mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-800">
          {results.slice(0, 4).map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSelectResult(r)}
              className="w-full border-b border-gray-100 px-3 py-2.5 text-right text-sm text-gray-700 last:border-0 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
              style={{ fontFamily: 'Vazirmatn' }}
            >
              <MapPin size={12} className="ml-1.5 inline text-emerald-500" />
              {r.name}
            </button>
          ))}
        </div>
      )}
      {selected && <p className={`mt-1 text-[11px] ${selectedClass}`}>✓ {selected.name}</p>}
    </div>
  )
}
