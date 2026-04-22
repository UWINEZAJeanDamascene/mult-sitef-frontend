import { Download, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface CSVExportButtonProps {
  data: Record<string, any>[]
  filename: string
  headers?: { key: string; label: string }[]
  className?: string
  buttonText?: string
  disabled?: boolean
}

function escapeCSVValue(value: any): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  // Escape quotes and wrap in quotes if contains comma, newline, or quote
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function CSVExportButton({
  data,
  filename,
  headers,
  className,
  buttonText = 'Export CSV',
  disabled,
}: CSVExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    if (!data || data.length === 0) return

    setIsExporting(true)

    // Small delay to show loading state
    await new Promise(resolve => setTimeout(resolve, 100))

    try {
      // Determine headers
      const csvHeaders = headers || Object.keys(data[0]).map(key => ({ key, label: key }))

      // Build CSV
      const headerRow = csvHeaders.map(h => escapeCSVValue(h.label)).join(',')
      const rows = data.map(row =>
        csvHeaders.map(h => escapeCSVValue(row[h.key])).join(',')
      )
      const csv = [headerRow, ...rows].join('\n')

      // Create and trigger download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={disabled || !data || data.length === 0 || isExporting}
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors',
        'bg-green-600 text-white hover:bg-green-700',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      {isExporting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      {buttonText}
    </button>
  )
}
