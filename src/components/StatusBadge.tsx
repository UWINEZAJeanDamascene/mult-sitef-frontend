import { cn } from '@/lib/utils'

const statusVariants: Record<string, { bg: string; text: string; label: string }> = {
  'pending_price': { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-800 dark:text-amber-400', label: 'Pending Price' },
  'priced': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-400', label: 'Priced' },
  'direct': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-400', label: 'Direct' },
  'active': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-400', label: 'Active' },
  'inactive': { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-800 dark:text-gray-300', label: 'Inactive' },
  'pending': { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-800 dark:text-amber-400', label: 'Pending' },
  'approved': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-400', label: 'Approved' },
  'rejected': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-400', label: 'Rejected' },
  'completed': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-400', label: 'Completed' },
  'in_progress': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-400', label: 'In Progress' },
  'draft': { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-800 dark:text-gray-300', label: 'Draft' },
  'archived': { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-800 dark:text-gray-300', label: 'Archived' },
  'site_manager': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-400', label: 'Site Manager' },
  'main_manager': { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-800 dark:text-purple-400', label: 'Main Manager' },
  'accountant': { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-800 dark:text-emerald-400', label: 'Accountant' },
  'manager': { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-400', label: 'Manager' },
}

interface StatusBadgeProps {
  status: string
  customLabel?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function StatusBadge({ status, customLabel, size = 'sm', className }: StatusBadgeProps) {
  const variant = statusVariants[status.toLowerCase()] || {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    label: status.replace(/_/g, ' '),
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full capitalize',
        variant.bg,
        variant.text,
        sizeClasses[size],
        className
      )}
    >
      {customLabel || variant.label}
    </span>
  )
}
