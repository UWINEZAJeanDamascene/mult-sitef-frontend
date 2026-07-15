import axios from 'axios'
import { jwtDecode } from 'jwt-decode'
import type { JwtPayload } from '@/types'

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.MODE === 'development' ? '/api' : '')

if (!API_URL && import.meta.env.MODE !== 'development') {
  console.error(
    '[axios] Missing VITE_API_URL in production. API requests will default to same-origin / and may return 404.'
  )
}

// Note: authentication is cookie-based (httpOnly cookie set by backend)
// In production, set VITE_API_URL to your backend base URL in Vercel environment vars.
// Axios should send cookies with requests
export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10s timeout to avoid hanging requests during dev when backend is unreachable
})

export const isTokenValid = (token: string | null): boolean => {
  if (!token) return false
  try {
    const decoded = jwtDecode<JwtPayload>(token)
    const now = Date.now() / 1000
    return decoded.exp > now
  } catch {
    return false
  }
}

export const getTokenPayload = (token: string | null): JwtPayload | null => {
  if (!token) return null
  try {
    return jwtDecode<JwtPayload>(token)
  } catch {
    return null
  }
}

// Request interceptor - attach valid token for protected APIs only
api.interceptors.request.use((config) => {
  const url = config.url || ''
  const isPublicAuthRoute =
    url.includes('/auth/login') ||
    url.includes('/auth/setup-status') ||
    url.includes('/auth/setup-admin')

  if (isPublicAuthRoute) {
    return config
  }

  const token = localStorage.getItem('auth_token')
  if (!token) {
    return config
  }

  if (!isTokenValid(token)) {
    localStorage.removeItem('auth_token')
    return config
  }

  config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response interceptor - let components handle 401s
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log CORS and network errors for debugging
    if (error.code === 'ERR_NETWORK' || error.message?.includes('CORS')) {
      console.error('Network/CORS Error:', {
        message: error.message,
        code: error.code,
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL
      });
    }

    // 401 errors are handled by AuthContext and ProtectedRoute components
    // Don't auto-redirect here to allow landing page to work for guests
    return Promise.reject(error)
  }
)
