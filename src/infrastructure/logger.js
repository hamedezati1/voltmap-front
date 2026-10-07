/**
 * Logger ساده و بدون وابستگی خارجی.
 * در پروداکشن می‌تونی به‌راحتی این فایل رو با pino یا winston عوض کنی
 * بدون این‌که بقیه‌ی پروژه تغییری کنه (چون همه از همین یک ماژول import می‌کنن).
 */
function ts() {
  return new Date().toISOString()
}

function print(level, message, meta) {
  const line = { level, time: ts(), message, ...(meta ? { meta } : {}) }
  const out = level === 'error' ? console.error : console.log
  out(JSON.stringify(line))
}

export const logger = {
  info: (message, meta) => print('info', message, meta),
  warn: (message, meta) => print('warn', message, meta),
  error: (message, meta) => print('error', message, meta),
  debug: (message, meta) => {
    if (process.env.NODE_ENV !== 'production') print('debug', message, meta)
  },
}
