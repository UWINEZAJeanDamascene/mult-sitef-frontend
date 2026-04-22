import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Layout } from '@/components/Layout'
import { Login } from '@/pages/Login'
import { Unauthorized } from '@/pages/Unauthorized'
import { Profile } from '@/pages/Profile'
import CompanyProfile from '@/pages/CompanyProfile'
import { Notifications } from '@/pages/Notifications'
import LandingPage from '@/pages/LandingPage'
import { useAuth } from '@/context/AuthContext'
import { UserRole } from '@/types'

// Site Manager Pages
import { SiteManagerDashboard } from '@/pages/site-manager/Dashboard'
import { RecordMaterial } from '@/pages/site-manager/RecordMaterial'
import { ReceivedMaterials } from '@/pages/site-manager/ReceivedMaterials'
import { UsedMaterials } from '@/pages/site-manager/UsedMaterials'

// Main Manager Pages
import {
  MainManagerDashboard,
  SitesOverview,
  SiteDetails,
  MainStockRecords,
  UsedMaterialsView,
  RemainingMaterialsView,
  SitesManagement,
  MaterialsCatalog,
  UsersManagement,
  ActionLogs,
} from '@/pages/main-manager'

// Role-based dashboard redirect
function RoleBasedDashboard() {
  const { isSiteManager } = useAuth()
  
  if (isSiteManager()) {
    return <SiteManagerDashboard />
  }
  
  return <MainManagerDashboard />
}

function App() {
  return (
    <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Routes */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard - accessible to both roles */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <RoleBasedDashboard />
                </ProtectedRoute>
              }
            />

            {/* Site Manager Routes */}
            <Route
              path="/site-dashboard"
              element={
                <ProtectedRoute requiredRole={UserRole.SITE_MANAGER}>
                  <SiteManagerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/received"
              element={
                <ProtectedRoute requiredRole={UserRole.SITE_MANAGER}>
                  <ReceivedMaterials />
                </ProtectedRoute>
              }
            />
            <Route
              path="/used"
              element={
                <ProtectedRoute requiredRole={UserRole.SITE_MANAGER}>
                  <UsedMaterials />
                </ProtectedRoute>
              }
            />
            <Route
              path="/record"
              element={
                <ProtectedRoute requiredRole={UserRole.SITE_MANAGER}>
                  <RecordMaterial />
                </ProtectedRoute>
              }
            />

            {/* Profile Route - accessible to all authenticated users */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Company Profile Route - accessible to managers */}
            <Route
              path="/company-profile"
              element={
                <ProtectedRoute requiredRole={UserRole.MAIN_MANAGER}>
                  <CompanyProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              }
            />

            {/* Main Manager Routes */}
            <Route
              path="/sites"
              element={
                <ProtectedRoute requiredRole={UserRole.MAIN_MANAGER}>
                  <SitesOverview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sites/:id"
              element={
                <ProtectedRoute requiredRole={UserRole.MAIN_MANAGER}>
                  <SiteDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/main-stock"
              element={
                <ProtectedRoute requiredRole={UserRole.MAIN_MANAGER}>
                  <MainStockRecords />
                </ProtectedRoute>
              }
            />
            <Route
              path="/used-materials"
              element={
                <ProtectedRoute requiredRole={UserRole.MAIN_MANAGER}>
                  <UsedMaterialsView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/remaining-materials"
              element={
                <ProtectedRoute requiredRole={UserRole.MAIN_MANAGER}>
                  <RemainingMaterialsView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sites-management"
              element={
                <ProtectedRoute requiredRole={UserRole.MAIN_MANAGER}>
                  <SitesManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/materials"
              element={
                <ProtectedRoute requiredRole={UserRole.MAIN_MANAGER}>
                  <MaterialsCatalog />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute requiredRole={UserRole.MAIN_MANAGER}>
                  <UsersManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/action-logs"
              element={
                <ProtectedRoute requiredRole={UserRole.MAIN_MANAGER}>
                  <ActionLogs />
                </ProtectedRoute>
              }
            />

          </Route>
        </Routes>
      </AuthProvider>
  )
}

export default App
