import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Loader2 } from 'lucide-react'
import { UserRole } from '@/types'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: UserRole
  requiredSiteId?: string
}

export function ProtectedRoute({ children, requiredRole, requiredSiteId }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, isSiteManager, canAccessSite, user } = useAuth()

  console.log('[DEBUG ProtectedRoute] Rendering:', { isAuthenticated, isLoading, user: user?.email })

  // Show loading state while checking auth
  if (isLoading) {
    console.log('[DEBUG ProtectedRoute] Showing loading spinner')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <div className="ml-4 text-lg">Loading authentication...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    console.log('[DEBUG ProtectedRoute] Not authenticated, redirecting to login')
    return <Navigate to="/login" replace />
  }

  console.log('[DEBUG ProtectedRoute] Authenticated, checking permissions...')

  // Check role requirement
  if (requiredRole) {
    // MAIN_MANAGER role now includes accountant and manager (non-site-manager)
    const hasRole = requiredRole === UserRole.MAIN_MANAGER ? !isSiteManager() : isSiteManager()
    console.log('[DEBUG ProtectedRoute] Role check:', { requiredRole, hasRole, userRole: user?.role })
    if (!hasRole) {
      console.log('[DEBUG ProtectedRoute] Access denied, redirecting to unauthorized')
      return <Navigate to="/unauthorized" replace />
    }
  }

  // Check site access for site managers
  if (requiredSiteId && !canAccessSite(requiredSiteId)) {
    console.log('[DEBUG ProtectedRoute] Site access denied:', { requiredSiteId, assignedSites: user?.assignedSiteIds })
    return <Navigate to="/unauthorized" replace />
  }

  console.log('[DEBUG ProtectedRoute] Access granted, rendering children')
  return <>{children}</>
}
