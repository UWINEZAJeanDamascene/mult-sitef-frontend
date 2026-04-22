import { useQuery } from '@tanstack/react-query'
import {
  Package,
  TrendingDown,
  Clock,
  History,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { siteRecordsApi } from '@/api/sites'
import { format } from '@/lib/utils'

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendUp,
  color,
}: {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  trend?: string
  trendUp?: boolean
  color: string
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-2xl font-bold text-foreground mt-2">{value}</h3>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      {trend && (
        <div className="flex items-center gap-1 mt-4">
          {trendUp ? (
            <ArrowUpRight className="w-4 h-4 text-green-600 dark:text-green-400" />
          ) : (
            <ArrowDownRight className="w-4 h-4 text-red-600 dark:text-red-400" />
          )}
          <span className={`text-sm ${trendUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {trend}
          </span>
          <span className="text-sm text-muted-foreground">vs last month</span>
        </div>
      )}
    </div>
  )
}

function ActivityItem({ record }: { record: any }) {
  const isPending = !record.syncedToMainStock
  
  return (
    <div className="flex items-start gap-4 p-4 hover:bg-muted rounded-lg transition-colors">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
        record.quantityUsed > 0 ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-green-100 dark:bg-green-900/30'
      }`}>
        {record.quantityUsed > 0 ? (
          <TrendingDown className="w-5 h-5 text-orange-600 dark:text-orange-400" />
        ) : (
          <Package className="w-5 h-5 text-green-600 dark:text-green-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">
          {record.materialName}
        </p>
        <p className="text-sm text-muted-foreground mt-0.5">
          Received: {record.quantityReceived} | 
          Used: {record.quantityUsed} | 
          Date: {format.date(record.date)}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1">
        {isPending ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
            <ArrowUpRight className="w-3 h-3" />
            Synced
          </span>
        )}
      </div>
    </div>
  )
}

export function SiteManagerDashboard() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['site-dashboard-stats'],
    queryFn: siteRecordsApi.getDashboardStats,
    refetchInterval: 30000, // 30 seconds
    staleTime: 10000, // 10 seconds
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
          <h3 className="text-lg font-medium text-foreground">Failed to load dashboard</h3>
          <p className="text-muted-foreground mt-1">Please try again later</p>
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Received This Month',
      value: stats?.totalReceivedThisMonth || 0,
      subtitle: 'Materials received',
      icon: Package,
      color: 'bg-green-600',
    },
    {
      title: 'Total Used This Month',
      value: stats?.totalUsedThisMonth || 0,
      subtitle: 'Materials consumed',
      icon: TrendingDown,
      color: 'bg-orange-600',
    },
    {
      title: 'Pending Records',
      value: stats?.pendingRecords || 0,
      subtitle: 'Awaiting pricing',
      icon: Clock,
      color: 'bg-yellow-600',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Site Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your site activity and pending records
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-card rounded-xl border border-border shadow-sm">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Last 10 records from your assigned sites
          </p>
        </div>
        
        <div className="divide-y divide-border">
          {stats?.recentActivity && stats.recentActivity.length > 0 ? (
            stats.recentActivity.map((record) => (
              <ActivityItem key={record._id} record={record} />
            ))
          ) : (
            <div className="p-8 text-center">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-medium text-foreground">No records yet</h3>
              <p className="text-muted-foreground mt-1">
                Start by recording materials received at your site
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
