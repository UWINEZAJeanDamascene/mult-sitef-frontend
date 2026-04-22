import { Calendar, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DateRange {
  startDate: string
  endDate: string
}

interface DateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
  onClear?: () => void
  startLabel?: string
  endLabel?: string
  className?: string
}

export function DateRangePicker({
  value,
  onChange,
  onClear,
  startLabel = 'From',
  endLabel = 'To',
  className,
}: DateRangePickerProps) {
  const hasValue = value.startDate || value.endDate

  return (
    <div className={cn('flex flex-col sm:flex-row gap-2 items-end', className)}>
      <div className="flex-1 w-full">
        {startLabel && (
          <label className="block text-sm font-medium text-gray-700 mb-1">{startLabel}</label>
        )}
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="date"
            value={value.startDate}
            onChange={(e) => onChange({ ...value, startDate: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="flex-1 w-full">
        {endLabel && (
          <label className="block text-sm font-medium text-gray-700 mb-1">{endLabel}</label>
        )}
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="date"
            value={value.endDate}
            onChange={(e) => onChange({ ...value, endDate: e.target.value })}
            min={value.startDate}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {hasValue && onClear && (
        <button
          onClick={onClear}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Clear dates"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}
