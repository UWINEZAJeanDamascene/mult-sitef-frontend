import axios from 'axios'
import { jwtDecode } from 'jwt-decode'
import type { JwtPayload } from '@/types'

// Note: authentication is cookie-based (httpOnly cookie set by backend)
// Axios should send cookies with requests
export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
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

// Request interceptor - attach token
// No request interceptor needed — auth handled with httpOnly cookie

// Response interceptor - let components handle 401s
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 errors are handled by AuthContext and ProtectedRoute components
    // Don't auto-redirect here to allow landing page to work for guests
    return Promise.reject(error)
  }
)
