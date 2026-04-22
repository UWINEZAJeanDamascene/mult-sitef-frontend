import { useState } from 'react'
import { X, AlertTriangle, WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ErrorBannerProps {
  message: string
  type?: 'error' | 'warning' | 'offline'
  onDismiss?: () => void
  className?: string
}

export function ErrorBanner({
  message,
  type = 'error',
  onDismiss,
  className,
}: ErrorBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false)

  if (isDismissed) return null

  const variants = {
    error: {
      bg: 'bg-red-50 dark:bg-red-950/20',
      border: 'border-red-200 dark:border-red-800',
      icon: 'text-red-600 dark:text-red-400',
      text: 'text-red-800 dark:text-red-200',
      iconComponent: AlertTriangle,
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-950/20',
      border: 'border-amber-200 dark:border-amber-800',
      icon: 'text-amber-600 dark:text-amber-400',
      text: 'text-amber-800 dark:text-amber-200',
      iconComponent: AlertTriangle,
    },
    offline: {
      bg: 'bg-gray-50 dark:bg-gray-900/50',
      border: 'border-gray-200 dark:border-gray-700',
      icon: 'text-gray-600 dark:text-gray-400',
      text: 'text-gray-800 dark:text-gray-200',
      iconComponent: WifiOff,
    },
  }

  const variant = variants[type]
  const Icon = variant.iconComponent

  const handleDismiss = () => {
    setIsDismissed(true)
    onDismiss?.()
  }

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-50 px-4 py-3 border-b',
        variant.bg,
        variant.border,
        className
      )}
      role="alert"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon className={cn('w-5 h-5 flex-shrink-0', variant.icon)} />
          <span className={cn('text-sm font-medium', variant.text)}>
            {message}
          </span>
        </div>
        <button
          onClick={handleDismiss}
          className={cn(
            'p-1 rounded hover:bg-white/50 transition-colors',
            variant.text
          )}
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// Network error detection hook
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useState(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  })

  return { isOnline }
}
