import { API_BASE_URL, USE_MOCK } from './config'

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

/**
 * HTTP client — در حالت mock استفاده نمی‌شود؛ سرویس‌ها مستقیم mock را صدا می‌زنند.
 * وقتی backend آماده شد، USE_MOCK=false کافی است.
 */
export async function apiClient(path, options = {}) {
  const { method = 'GET', body, headers = {} } = options

  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  }

  if (body !== undefined) {
    config.body = JSON.stringify(body)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, config)

  if (!response.ok) {
    let data
    try {
      data = await response.json()
    } catch {
      data = null
    }
    throw new ApiError(
      data?.message || `Request failed: ${response.status}`,
      response.status,
      data
    )
  }

  if (response.status === 204) return null
  return response.json()
}

export { USE_MOCK }
