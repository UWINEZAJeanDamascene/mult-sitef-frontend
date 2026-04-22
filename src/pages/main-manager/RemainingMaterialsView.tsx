import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Package,
  Calendar,
  Download,
  Loader2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from 'lucide-react'
import { viewsApi } from '@/api/mainManager'
import { format, cn } from '@/lib/utils'

export function RemainingMaterialsView() {
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  })

  const { data, isLoading, error } = useQuery({
    queryKey: ['remaining-materials-view', dateRange],
    queryFn: () =>
      viewsApi.getRemainingMaterials({
        startDate: dateRange.startDate || undefined,
        endDate: dateRange.endDate || undefined,
      }),
  })

  const handleExportCSV = () => {
    if (!data) return

    const headers = [
      'Material Name',
      'Total Received',
      'Total Used',
      'Remaining',
      'Avg Price',
      'Remaining Value',
    ].join(',')

    const rows = data.map((item) =>
      [
        item.materialName,
        item.totalReceived,
        item.totalUsed,
        item.remainingQuantity,
        item.avgPrice,
        item.remainingValue,
      ].join(',')
    )

    const csv = [headers, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `remaining-materials-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getRowClass = (remaining: number) => {
    if (remaining === 0) return 'bg-red-950/20 border-l-4 border-l-red-500 dark:border-l-red-800'
    if (remaining < 10) return 'bg-amber-950/20 border-l-4 border-l-amber-500 dark:border-l-amber-800'
    return ''
  }

  const totalRemainingValue = data?.reduce((sum, item) => sum + item.remainingValue, 0) || 0
  const totalRemainingQty = data?.reduce((sum, item) => sum + item.remainingQuantity, 0) || 0
  const lowStockCount = data?.filter((item) => item.remainingQuantity < 10 && item.remainingQuantity > 0).length || 0
  const outOfStockCount = data?.filter((item) => item.remainingQuantity === 0).length || 0

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
          <h3 className="text-lg font-medium text-foreground">Failed to load data</h3>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Remaining Materials View</h1>
          <p className="text-muted-foreground mt-1">
            Current stock levels and valuations
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={!data || data.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Remaining Value</p>
          <p className="text-2xl font-bold text-foreground">
            {format.currency(totalRemainingValue)}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Remaining Qty</p>
          <p className="text-2xl font-bold text-foreground">
            {format.number(totalRemainingQty, 2)}
          </p>
        </div>
        <div className="bg-amber-950/30 rounded-xl border border-amber-800 p-4 shadow-sm">
          <p className="text-sm text-amber-400">Low Stock Items</p>
          <p className="text-2xl font-bold text-amber-300">
            {lowStockCount}
          </p>
          <p className="text-xs text-amber-400 mt-1">Below 10 units</p>
        </div>
        <div className="bg-red-950/20 rounded-xl border border-red-800 p-4 shadow-sm">
          <p className="text-sm text-red-400">Out of Stock</p>
          <p className="text-2xl font-bold text-red-300">
            {outOfStockCount}
          </p>
          <p className="text-xs text-red-400 mt-1">Zero remaining</p>
        </div>
      </div>

      {/* Date Filter */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-foreground mb-1">
              From Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, startDate: e.target.value })
                }
                className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-background"
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-foreground mb-1">
              To Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, endDate: e.target.value })
                }
                className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-background"
              />
            </div>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setDateRange({ startDate: '', endDate: '' })}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                  Material
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Received
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                  <div className="flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" />
                    Used
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                  <div className="flex items-center gap-1">
                    <Package className="w-3 h-3" />
                    Remaining
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                  Avg Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                  Remaining Value
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No materials data found</p>
                  </td>
                </tr>
              ) : (
                data?.map((item) => (
                  <tr
                    key={item.materialName}
                    className={cn('hover:bg-muted/50', getRowClass(item.remainingQuantity))}
                  >
                    <td className="px-6 py-4 font-medium text-foreground">
                      {item.materialName}
                      {item.remainingQuantity === 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-xs rounded-full">
                          Out of stock
                        </span>
                      )}
                      {item.remainingQuantity > 0 && item.remainingQuantity < 10 && (
                        <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 text-xs rounded-full">
                          Low stock
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-foreground">
                      {format.number(item.totalReceived, 2)}
                    </td>
                    <td className="px-6 py-4 text-foreground">
                      {format.number(item.totalUsed, 2)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          'font-medium',
                          item.remainingQuantity === 0
                            ? 'text-red-600 dark:text-red-400'
                            : item.remainingQuantity < 10
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-green-600 dark:text-green-400'
                        )}
                      >
                        {format.number(item.remainingQuantity, 2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-foreground">
                      {format.currency(item.avgPrice)}
                    </td>
                    <td className="px-6 py-4 text-foreground">
                      {format.currency(item.remainingValue)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-950/20 border-l-2 border-l-red-500 dark:border-l-red-800" />
          <span className="text-muted-foreground">Out of stock (0 remaining)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-amber-950/20 border-l-2 border-l-amber-500 dark:border-l-amber-800" />
          <span className="text-muted-foreground">Low stock (&lt; 10 remaining)</span>
        </div>
      </div>
    </div>
  )
}
