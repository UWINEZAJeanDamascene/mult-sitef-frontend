import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '@/api/auth'
import type { Company } from '@/api/companies'
import type { User, LoginCredentials } from '@/types'
import { UserRole } from '@/types'
import { queryErrorHandler } from '@/main'

interface AuthContextType {
  user: User | null
  company: Company | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  checkAuth: () => boolean
  isAdmin: () => boolean
  isAccountant: () => boolean
  isManager: () => boolean
  canEdit: () => boolean
  isSiteManager: () => boolean
  canAccessSite: (siteId: string) => boolean
  updateUser: (updates: Partial<User>) => void
  updateCompany: (updates: Partial<Company>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const navigate = useNavigate()

  const checkAuth = useCallback((): boolean => {
    // With cookie-based sessions we cannot synchronously validate a token here.
    // Return true optimistically; `initAuth` will call `authApi.getMe` to verify.
    return true
  }, [])

  // Restore company from localStorage (optimistic UI on refresh)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('company')
      if (stored) {
        setCompany(JSON.parse(stored))
      }
    } catch (err) {
      // ignore parse errors
    }
  }, [])

  // Check auth on mount and when checkAuth changes
  useEffect(() => {
    const initAuth = async () => {
      // Check if user manually logged out - prevents auto-login on refresh
      const loggedOut = sessionStorage.getItem('logged_out')
      if (loggedOut) {
        sessionStorage.removeItem('logged_out')
        setUser(null)
        setCompany(null)
        setIsAuthenticated(false)
        setIsLoading(false)
        return
      }

      try {
        const userData = await authApi.getMe()
        console.debug('[AuthContext] getMe response:', userData)
        // Map assignedSites (from API) to assignedSiteIds (expected by User type)
        const mappedUser = {
          ...userData,
          assignedSiteIds: (userData as any).assignedSites?.map((s: any) => s.id || s) || [],
        }
        setUser(mappedUser)
        setIsAuthenticated(true)
        console.debug('[AuthContext] Setting company:', userData.company)
        if (userData.company) {
          setCompany(userData.company)
          try {
            localStorage.setItem('company', JSON.stringify(userData.company))
          } catch (err) {
            // ignore storage errors
          }
        } else {
          setCompany(null)
          try {
            localStorage.removeItem('company')
          } catch (err) {
            // ignore
          }
        }
      } catch (err) {
        // Not authenticated
        setUser(null)
        setCompany(null)
        setIsAuthenticated(false)
        try {
          localStorage.removeItem('company')
        } catch (err) {
          // ignore
        }
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true)
    try {
      // Perform login; backend sets httpOnly cookie on success
      const userData = await authApi.login(credentials)
      setUser(userData.user)
      setIsAuthenticated(true)
      // Clear logout flag on successful login
      sessionStorage.removeItem('logged_out')
      if (userData.user.company) {
        setCompany(userData.user.company)
        try {
          localStorage.setItem('company', JSON.stringify(userData.user.company))
        } catch (err) {
          // ignore storage errors
        }
      }
    } catch (error) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      // Wait for logout to complete to ensure cookie is cleared
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch {
      // Ignore errors - we'll clear local state anyway
    }

    // Mark that user manually logged out - prevents auto-login on refresh
    sessionStorage.setItem('logged_out', 'true')

    // Clear all auth-related storage
    setUser(null)
    setCompany(null)
    localStorage.removeItem('company')
    localStorage.removeItem('auth_user')
    localStorage.removeItem('auth_token')
    sessionStorage.removeItem('auth_user')
    setIsAuthenticated(false)
    navigate('/')
  }, [navigate])

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => prev ? { ...prev, ...updates } : null)
  }, [])

  const updateCompany = useCallback((updates: Partial<Company>) => {
    console.debug('[AuthContext] updateCompany:', { updates })
    setCompany((prev) => {
      const merged = prev ? { ...prev, ...updates } : updates
      console.debug('[AuthContext] updateCompany setState:', { prev, merged })
      try {
        localStorage.setItem('company', JSON.stringify(merged))
      } catch (err) {
        // ignore
      }
      return merged
    })
  }, [])

  // Register logout function with queryErrorHandler for 401 handling
  useEffect(() => {
    queryErrorHandler.setLogoutFn(logout)
  }, [logout])

  const isAdmin = useCallback(() => {
    return user?.role === UserRole.MAIN_MANAGER
  }, [user])

  const isAccountant = useCallback(() => {
    return user?.role === UserRole.ACCOUNTANT
  }, [user])

  const isManager = useCallback(() => {
    return user?.role === UserRole.MANAGER
  }, [user])

  const canEdit = useCallback(() => {
    // Only MAIN_MANAGER and ACCOUNTANT have edit permissions
    return user?.role === UserRole.MAIN_MANAGER || user?.role === UserRole.ACCOUNTANT
  }, [user])

  const isSiteManager = useCallback(() => {
    return user?.role === UserRole.SITE_MANAGER
  }, [user])

  const canAccessSite = useCallback((siteId: string) => {
    if (isAdmin()) return true
    return user?.assignedSiteIds?.includes(siteId) || false
  }, [user, isAdmin])

  const value: AuthContextType = {
    user,
    company,
    isLoading,
    isAuthenticated,
    login,
    logout,
    checkAuth,
    isAdmin,
    isAccountant,
    isManager,
    canEdit,
    isSiteManager,
    canAccessSite,
    updateUser,
    updateCompany,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
