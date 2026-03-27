const fallbackApiBaseUrl = 'http://localhost:3001'

export const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || fallbackApiBaseUrl).replace(/\/$/, '')
