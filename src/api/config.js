/**
 * API configuration
 *
 * VITE_USE_MOCK=true  → داده از mock/localStorage (پیش‌فرض در dev)
 * VITE_USE_MOCK=false → درخواست به VITE_API_BASE_URL
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'
