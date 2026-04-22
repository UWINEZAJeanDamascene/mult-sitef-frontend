import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { 
  Menu, 
  Bell, 
  LogOut, 
  User,
  ChevronDown,
  Building
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { ThemeToggle } from '@/components/ThemeToggle'
import { notificationsApi } from '@/api/notifications'
import { cn } from '@/lib/utils'

interface TopBarProps {
  onMenuClick: () => void
  sidebarCollapsed: boolean
}

export function TopBar({ onMenuClick, sidebarCollapsed }: TopBarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Fetch unread notification count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: notificationsApi.getUnreadCount,
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  const handleLogout = () => {
    logout()
  }

  const handleNotificationsClick = () => {
    navigate('/notifications')
  }

  const getRoleBadgeConfig = (role: string) => {
    switch (role) {
      case 'main_manager':
        return {
          bg: 'bg-purple-100 dark:bg-purple-900/30',
          text: 'text-purple-700 dark:text-purple-300',
          border: 'border-purple-200 dark:border-purple-800',
          label: 'Main Manager',
        }
      case 'site_manager':
        return {
          bg: 'bg-blue-100 dark:bg-blue-900/30',
          text: 'text-blue-700 dark:text-blue-300',
          border: 'border-blue-200 dark:border-blue-800',
          label: 'Site Manager',
        }
      case 'accountant':
        return {
          bg: 'bg-emerald-100 dark:bg-emerald-900/30',
          text: 'text-emerald-700 dark:text-emerald-300',
          border: 'border-emerald-200 dark:border-emerald-800',
          label: 'Accountant',
        }
      case 'manager':
        return {
          bg: 'bg-orange-100 dark:bg-orange-900/30',
          text: 'text-orange-700 dark:text-orange-300',
          border: 'border-orange-200 dark:border-orange-800',
          label: 'Manager',
        }
      default:
        return {
          bg: 'bg-gray-100 dark:bg-gray-800',
          text: 'text-gray-700 dark:text-gray-300',
          border: 'border-gray-200 dark:border-gray-700',
          label: role.replace('_', ' '),
        }
    }
  }

  return (
    <header className={cn(
      'fixed top-0 right-0 z-30 h-16 bg-background border-b border-border',
      'flex items-center justify-between px-4 transition-all duration-300',
      sidebarCollapsed ? 'left-16' : 'left-64'
    )}>
      {/* Left side - Mobile menu + Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-muted text-foreground"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <div className="hidden sm:flex items-center gap-2 text-muted-foreground">
          <Building className="w-4 h-4" />
          <span className="text-sm font-medium">{user?.company_id}</span>
        </div>
      </div>

      {/* Right side - Notifications + Theme Toggle + User */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button 
          onClick={handleNotificationsClick}
          className="relative p-2 rounded-lg hover:bg-muted text-foreground"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Theme Toggle */}
        <ThemeToggle />

         {/* User Dropdown */}
         <div className="relative">
           <button
             onClick={() => setIsDropdownOpen(!isDropdownOpen)}
             className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
           >
             {/* Avatar */}
             {user?.profilePicture ? (
               <img
                 src={user.profilePicture}
                 alt={user.name}
                 className="w-8 h-8 rounded-full object-cover border-2 border-border"
                 onError={(e) => {
                   // Fallback to initials if image fails to load
                   const target = e.target as HTMLImageElement;
                   target.style.display = 'none';
                   target.nextElementSibling?.classList.remove('hidden');
                 }}
               />
             ) : null}
             <div
               className={cn(
                 'w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-medium text-sm',
                 user?.profilePicture && 'hidden'
               )}
             >
               {user?.name?.charAt(0).toUpperCase() || 'U'}
             </div>

            {/* User Info - Hidden on small screens */}
            <div className="hidden md:flex flex-col items-start">
              <span className="text-sm font-medium text-foreground">{user?.name}</span>
              <span className={cn(
                'text-xs px-1.5 py-0.5 rounded border',
                getRoleBadgeConfig(user?.role || '').border
              )}>
                {user?.role === 'main_manager' ? 'Main Manager' : 'Site Manager'}
              </span>
            </div>

            <ChevronDown className={cn(
              'w-4 h-4 text-muted-foreground transition-transform',
              isDropdownOpen && 'rotate-180'
            )} />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-40"
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-56 bg-card rounded-xl shadow-lg border border-border py-2 z-50">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-medium text-card-foreground">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>

                <button
                  onClick={() => {
                    setIsDropdownOpen(false)
                    navigate('/profile')
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted"
                >
                  <User className="w-4 h-4" />
                  Profile
                </button>

                <div className="border-t border-border mt-2 pt-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}