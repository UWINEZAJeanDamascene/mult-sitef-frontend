// Simple className merge utility
type ClassValue = string | number | boolean | undefined | null | { [key: string]: boolean } | ClassValue[]

export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = []
  
  for (const input of inputs) {
    if (!input) continue
    
    if (typeof input === 'string' || typeof input === 'number') {
      classes.push(String(input))
    } else if (typeof input === 'object') {
      if (Array.isArray(input)) {
        classes.push(cn(...input))
      } else {
        for (const [key, value] of Object.entries(input)) {
          if (value) classes.push(key)
        }
      }
    }
  }
  
  // Simple deduplication (not as sophisticated as tailwind-merge but works for basic cases)
  return [...new Set(classes.join(' ').split(' '))].join(' ')
}

// Simple utility for conditional classes
export function cx(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

// Format utilities
export const format = {
  date: (dateString: string | Date): string => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  },
  
  datetime: (dateString: string | Date): string => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  },
  
  number: (value: number, decimals = 0): string => {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  },
  
  currency: (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value)
  },
}
