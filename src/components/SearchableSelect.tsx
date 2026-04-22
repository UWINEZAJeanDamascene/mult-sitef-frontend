import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, ChevronDown, Loader2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Option {
  value: string
  label: string
  subtitle?: string
}

interface SearchableSelectProps {
  value?: string
  onChange: (value: string, option: Option) => void
  onSearch: (query: string) => Promise<Option[]> | Option[]
  placeholder?: string
  disabled?: boolean
  className?: string
  minSearchLength?: number
  debounceMs?: number
  emptyMessage?: string
  label?: string
}

export function SearchableSelect({
  value,
  onChange,
  onSearch,
  placeholder = 'Search...',
  disabled,
  className,
  minSearchLength = 2,
  debounceMs = 300,
  emptyMessage = 'No results found',
  label,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [options, setOptions] = useState<Option[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedOption, setSelectedOption] = useState<Option | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Search function with debounce
  const performSearch = useCallback(async (query: string) => {
    if (query.length < minSearchLength) {
      setOptions([])
      return
    }

    setIsLoading(true)
    try {
      const results = await onSearch(query)
      setOptions(results)
    } finally {
      setIsLoading(false)
    }
  }, [onSearch, minSearchLength])

  // Debounced search
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (isOpen && searchQuery.length >= minSearchLength) {
      debounceTimerRef.current = setTimeout(() => {
        performSearch(searchQuery)
      }, debounceMs)
    } else {
      setOptions([])
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [searchQuery, isOpen, minSearchLength, debounceMs, performSearch])

  const handleSelect = (option: Option) => {
    setSelectedOption(option)
    setIsOpen(false)
    setSearchQuery('')
    onChange(option.value, option)
  }

  const handleClear = () => {
    setSelectedOption(null)
    setSearchQuery('')
    onChange('', { value: '', label: '' })
  }

  const displayValue = selectedOption?.label || value || ''

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      )}

      <button
        type="button"
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen)
            setTimeout(() => inputRef.current?.focus(), 0)
          }
        }}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between px-4 py-2 border rounded-lg text-left',
          'focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'bg-white',
          isOpen && 'ring-2 ring-indigo-500 border-indigo-500'
        )}
      >
        <span className={cn(!displayValue && 'text-gray-400')}>
          {displayValue || placeholder}
        </span>
        <ChevronDown
          className={cn(
            'w-5 h-5 text-gray-400 transition-transform',
            isOpen && 'transform rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-auto">
          {/* Search input */}
          <div className="sticky top-0 bg-white border-b border-gray-100 p-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Type ${minSearchLength}+ characters...`}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {isLoading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
              )}
            </div>
          </div>

          {/* Options list */}
          <div className="py-1">
            {options.length === 0 && !isLoading && searchQuery.length >= minSearchLength && (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                {emptyMessage}
              </div>
            )}

            {options.length === 0 && searchQuery.length < minSearchLength && !isLoading && (
              <div className="px-4 py-3 text-sm text-gray-400 text-center">
                Type at least {minSearchLength} characters to search
              </div>
            )}

            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option)}
                className={cn(
                  'w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between',
                  selectedOption?.value === option.value && 'bg-indigo-50'
                )}
              >
                <div>
                  <div className="font-medium text-gray-900">{option.label}</div>
                  {option.subtitle && (
                    <div className="text-sm text-gray-500">{option.subtitle}</div>
                  )}
                </div>
                {selectedOption?.value === option.value && (
                  <Check className="w-5 h-5 text-indigo-600" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
