/**
 * API configuration
 *
 * VITE_USE_MOCK=true  → داده از mock/localStorage
 * VITE_USE_MOCK=false → درخواست به VITE_API_BASE_URL (بک‌اند واقعی)
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'
