import { NavLink, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Building2, 
  Package, 
  TrendingUp, 
  TrendingDown, 
  Users,
  ChevronLeft,
  ChevronRight,
  Archive,
  Box,
  Activity,
  Bell,
  FileText
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
  isMobileOpen: boolean
  onMobileClose: () => void
}

const siteManagerNavItems = [
  { path: '/dashboard', label: 'My Site Dashboard', icon: LayoutDashboard },
  { path: '/received', label: 'Received Materials', icon: Package },
  { path: '/used', label: 'Used Materials', icon: TrendingDown },
  { path: '/record', label: 'Record Material', icon: Archive },
  { path: '/notifications', label: 'Notifications', icon: Bell },
]

const mainManagerNavItems = [
  { path: '/dashboard', label: 'Main Dashboard', icon: LayoutDashboard },
  { path: '/sites', label: 'All Sites Overview', icon: Building2 },
  { path: '/main-stock', label: 'Main Stock Records', icon: Box },
  { path: '/purchase-orders', label: 'Purchase Orders', icon: FileText },
  { path: '/used-materials', label: 'Used Materials View', icon: TrendingDown },
  { path: '/remaining-materials', label: 'Remaining Materials View', icon: TrendingUp },
  { path: '/sites-management', label: 'Sites Management', icon: Building2 },
  { path: '/materials', label: 'Materials Catalog', icon: Package },
  { path: '/users', label: 'Users Management', icon: Users },
  { path: '/notifications', label: 'Notifications', icon: Bell },
  { path: '/company-profile', label: 'Company Profile', icon: Building2 },
  { path: '/action-logs', label: 'Action Logs', icon: Activity },
]

export function Sidebar({ isCollapsed, onToggle, isMobileOpen, onMobileClose }: SidebarProps) {
  const { user, company, logout, isAdmin } = useAuth()
  const location = useLocation()
  const navItems = isAdmin() ? mainManagerNavItems : siteManagerNavItems

  const NavItem = ({ item }: { item: typeof navItems[0] }) => {
    const Icon = item.icon
    const isActive = location.pathname === item.path

    return (
      <NavLink
        to={item.path}
        onClick={onMobileClose}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
          'hover:bg-muted active:bg-muted/80',
          isActive && 'bg-primary/10 text-primary font-medium',
          !isActive && 'text-muted-foreground hover:text-foreground'
        )}
      >
        <Icon className={cn(
          'w-5 h-5 transition-colors',
          isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
        )} />
        {!isCollapsed && (
          <span className="text-sm truncate">{item.label}</span>
        )}
        {isCollapsed && (
          <span className="absolute left-14 bg-popover text-popover-foreground text-xs px-2 py-1 rounded 
                         opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border border-border">
            {item.label}
          </span>
        )}
      </NavLink>
    )
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed left-0 top-0 z-50 h-screen bg-background border-r border-border',
        'transition-all duration-300 ease-in-out flex flex-col',
        isCollapsed ? 'w-16' : 'w-64',
        isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Logo */}
        <div className={cn(
          'p-4 border-b border-border/50 flex items-center gap-3',
          isCollapsed && 'justify-center p-2'
        )}>
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
            {company?.logo ? (
              <img src={company.logo} alt="Company Logo" className="w-full h-full object-cover" />
            ) : (
              <Box className="w-5 h-5 text-primary" />
            )}
          </div>
          {!isCollapsed && (
            <span className="font-semibold text-lg truncate">
              {company?.name || 'Lilstock'}
            </span>
          )}
          
          {/* Desktop Toggle */}
          <button
            onClick={onToggle}
            className="hidden lg:flex p-1 rounded hover:bg-muted text-muted-foreground"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {navItems.map((item) => (
            <NavItem key={item.path} item={item} />
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          {!isCollapsed && (
            <div className="text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Lilstock v1.0</p>
              <p>Multi-site stock management</p>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}