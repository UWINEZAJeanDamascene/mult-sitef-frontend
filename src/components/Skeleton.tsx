import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  width?: string | number
  height?: string | number
  animate?: boolean
}

export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
  animate = true,
}: SkeletonProps) {
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg',
  }

  return (
    <div
      className={cn(
        'bg-muted',
        variantClasses[variant],
        animate && 'animate-pulse',
        className
      )}
      style={{
        width: width,
        height: height,
      }}
    />
  )
}

// Pre-built skeleton patterns
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-card rounded-xl border border-border p-6', className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <Skeleton width="40%" height={16} />
          <Skeleton width="60%" height={32} />
          <Skeleton width="30%" height={14} />
        </div>
        <Skeleton variant="rounded" width={48} height={48} />
      </div>
    </div>
  )
}

export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <tr className="border-b border-border">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton width={i === 0 ? '75%' : '50%'} height={16} />
        </td>
      ))}
    </tr>
  )
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-4 py-3">
                <Skeleton width={60} height={14} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function FormFieldSkeleton({ label = true }: { label?: boolean }) {
  return (
    <div className="space-y-2">
      {label && <Skeleton width="30%" height={14} />}
      <Skeleton variant="rounded" height={40} />
    </div>
  )
}

export function PageHeaderSkeleton() {
  return (
    <div className="space-y-2 mb-6">
      <Skeleton width={200} height={28} />
      <Skeleton width={300} height={16} />
    </div>
  )
}

export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-card rounded-xl border border-border p-6', className)}>
      <Skeleton width={150} height={20} className="mb-4" />
      <div className="flex items-end gap-2 h-48">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton
            key={i}
            width="100%"
            height={`${Math.random() * 60 + 20}%`}
            variant="rounded"
          />
        ))}
      </div>
    </div>
  )
}
