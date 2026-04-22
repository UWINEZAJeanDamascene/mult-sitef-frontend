import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  Package,
  TrendingUp,
  TrendingDown,
  Users,
  Archive,
  ArrowRight
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

interface DashboardCardProps {
  title: string
  description: string
  icon: React.ElementType
  href: string
  color: string
}

function DashboardCard({ title, description, icon: Icon, href, color }: DashboardCardProps) {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate(href)}
      className={cn(
        'group relative overflow-hidden rounded-xl bg-white p-6 text-left',
        'border border-gray-200 shadow-sm hover:shadow-md',
        'transition-all duration-300 hover:-translate-y-0.5'
      )}
    >
      <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center mb-4', color)}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-4">{description}</p>
      <div className="flex items-center text-sm font-medium text-indigo-600 group-hover:text-indigo-700">
        Access
        <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
      </div>
    </button>
  )
}

export function Dashboard() {
  const { user, isSiteManager } = useAuth()

  const siteManagerCards: DashboardCardProps[] = [
    {
      title: 'My Site Dashboard',
      description: 'View and manage your assigned site stock records',
      icon: LayoutDashboard,
      href: '/dashboard',
      color: 'bg-blue-600',
    },
    {
      title: 'Received Materials',
      description: 'Log materials received at your site',
      icon: Package,
      href: '/received',
      color: 'bg-green-600',
    },
    {
      title: 'Used Materials',
      description: 'Record materials consumed at your site',
      icon: TrendingDown,
      href: '/used',
      color: 'bg-orange-600',
    },
    {
      title: 'Record Material',
      description: 'Create new material entry for your site',
      icon: Archive,
      href: '/record',
      color: 'bg-purple-600',
    },
  ]

  const mainManagerCards: DashboardCardProps[] = [
    {
      title: 'Main Dashboard',
      description: 'Overview of all sites and stock levels',
      icon: LayoutDashboard,
      href: '/dashboard',
      color: 'bg-indigo-600',
    },
    {
      title: 'All Sites Overview',
      description: 'Manage and monitor all construction sites',
      icon: Building2,
      href: '/sites',
      color: 'bg-blue-600',
    },
    {
      title: 'Main Stock Records',
      description: 'Central inventory with pricing and valuation',
      icon: Package,
      href: '/main-stock',
      color: 'bg-green-600',
    },
    {
      title: 'Used Materials View',
      description: 'Aggregated consumption across all sites',
      icon: TrendingDown,
      href: '/used-materials',
      color: 'bg-orange-600',
    },
    {
      title: 'Remaining Materials',
      description: 'Current stock levels and valuations',
      icon: TrendingUp,
      href: '/remaining-materials',
      color: 'bg-teal-600',
    },
    {
      title: 'Sites Management',
      description: 'Create and manage construction sites',
      icon: Building2,
      href: '/sites-management',
      color: 'bg-cyan-600',
    },
    {
      title: 'Materials Catalog',
      description: 'Manage master material catalog',
      icon: Archive,
      href: '/materials',
      color: 'bg-violet-600',
    },
    {
      title: 'Users Management',
      description: 'Manage site managers and main managers',
      icon: Users,
      href: '/users',
      color: 'bg-pink-600',
    },
  ]

  const cards = isSiteManager() ? siteManagerCards : mainManagerCards

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-gray-500 mt-1">
            Here's what you can do today
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            'px-3 py-1 rounded-full text-sm font-medium capitalize',
            isSiteManager()
              ? 'bg-blue-100 text-blue-700'
              : 'bg-purple-100 text-purple-700'
          )}>
            {user?.role?.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {cards.map((card) => (
          <DashboardCard key={card.title} {...card} />
        ))}
      </div>

      {/* Quick Stats */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Total Sites</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">--</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Materials Tracked</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">--</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Records This Month</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">--</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Stock Value</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">--</p>
          </div>
        </div>
      </div>
    </div>
  )
}
