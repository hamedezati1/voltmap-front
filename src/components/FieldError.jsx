/** نمایش خطای فیلد زیر اینپوت */
export function FieldError({ message }) {
  if (!message) return null
  return (
    <p className="mt-1.5 text-xs font-medium text-red-500" style={{ fontFamily: 'Vazirmatn' }}>
      {message}
    </p>
  )
}
