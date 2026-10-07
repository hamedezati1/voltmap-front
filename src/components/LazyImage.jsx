/**
 * عکس‌های استوریج فقط وقتی نزدیک صفحه باشند دانلود می‌شوند.
 * آدرس فایل ثابت است، پس مرورگر همان فایل را از کش خودش برمی‌گرداند و دوباره از سرور نمی‌گیرد.
 */
export default function LazyImage({
  src,
  alt = '',
  eager = false,
  style,
  className,
  ...rest
}) {
  if (!src) return null
  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={eager ? 'high' : 'low'}
      className={className}
      style={style}
      {...rest}
    />
  )
}
