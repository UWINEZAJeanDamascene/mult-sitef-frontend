import { useState, useRef, useEffect, useCallback } from 'react'
import { Check, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InlineEditCellProps {
  value: string | number
  onSave: (value: string) => void | Promise<void>
  type?: 'text' | 'number'
  className?: string
  disabled?: boolean
  isPending?: boolean
  formatter?: (value: string | number) => string
}

export function InlineEditCell({
  value,
  onSave,
  type = 'text',
  className,
  disabled,
  isPending,
  formatter,
}: InlineEditCellProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(String(value))
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = useCallback(async () => {
    if (editValue !== String(value)) {
      try {
        await onSave(editValue)
      } catch {
        setEditValue(String(value))
      }
    }
    setIsEditing(false)
  }, [editValue, value, onSave])

  const handleCancel = useCallback(() => {
    setEditValue(String(value))
    setIsEditing(false)
  }, [value])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  const handleBlur = () => {
    // Small delay to allow button clicks to register first
    setTimeout(() => {
      if (editValue !== String(value)) {
        handleSave()
      } else {
        setIsEditing(false)
      }
    }, 200)
  }

  const displayValue = formatter ? formatter(value) : value

  if (isEditing) {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        <input
          ref={inputRef}
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          disabled={isPending}
          className={cn(
            'px-2 py-1 text-sm border rounded w-24',
            'focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none',
            isPending && 'opacity-50'
          )}
          step={type === 'number' ? '0.01' : undefined}
        />
        <div className="flex items-center gap-0.5">
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleSave()
            }}
            disabled={isPending}
            className="p-1 text-green-600 hover:bg-green-50 rounded"
            title="Save"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleCancel()
            }}
            disabled={isPending}
            className="p-1 text-red-600 hover:bg-red-50 rounded"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => !disabled && setIsEditing(true)}
      disabled={disabled}
      className={cn(
        'text-left hover:bg-gray-50 px-2 py-1 -mx-2 -my-1 rounded transition-colors',
        disabled && 'cursor-default hover:bg-transparent',
        className
      )}
    >
      {displayValue}
    </button>
  )
}
