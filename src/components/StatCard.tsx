import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'indigo'
  trend?: {
    value: number
    label: string
    positive?: boolean
  }
  loading?: boolean
  className?: string
}

const colorVariants = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
  amber: 'bg-amber-100 text-amber-600',
  red: 'bg-red-100 text-red-600',
  purple: 'bg-purple-100 text-purple-600',
  indigo: 'bg-indigo-100 text-indigo-600',
}

export function StatCard({
  title,
  value,
  icon: Icon,
  color = 'blue',
  trend,
  loading,
  className,
}: StatCardProps) {
  return (
    <div className={cn('bg-card rounded-xl border border-border p-4 md:p-6 shadow-sm', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {loading ? (
            <div className="mt-2 h-8 w-24 bg-muted rounded animate-pulse" />
          ) : (
            <h3 className="text-2xl font-bold text-foreground mt-1 truncate">{value}</h3>
          )}
          {trend && !loading && (
            <div className="flex items-center gap-1 mt-2">
              {trend.positive !== false ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span
                className={cn(
                  'text-sm font-medium',
                  trend.positive !== false ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                )}
              >
                {trend.value > 0 && '+'}{trend.value}%
              </span>
              <span className="text-sm text-muted-foreground">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={cn('p-3 rounded-lg flex-shrink-0', colorVariants[color])}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}

export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-card rounded-xl border border-border p-4 md:p-6 shadow-sm', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-4 w-20 bg-muted rounded animate-pulse" />
          <div className="mt-2 h-8 w-24 bg-muted rounded animate-pulse" />
          <div className="mt-2 h-4 w-32 bg-muted rounded animate-pulse" />
        </div>
        <div className="w-12 h-12 bg-muted rounded-lg animate-pulse" />
      </div>
    </div>
  )
}
