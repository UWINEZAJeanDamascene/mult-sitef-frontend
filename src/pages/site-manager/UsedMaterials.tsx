import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  TrendingDown,
  Search,
  Calendar,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Filter,
  Calculator,
} from 'lucide-react'
import { siteRecordsApi } from '@/api/sites'
import { useAuth } from '@/context/AuthContext'
import { cn, format } from '@/lib/utils'

const ITEMS_PER_PAGE = 10

export function UsedMaterials() {
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  })
  const [showFilters, setShowFilters] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['site-records', 'used', page, searchQuery, dateRange],
    queryFn: () =>
      siteRecordsApi.getMySiteRecords({
        page,
        limit: ITEMS_PER_PAGE,
        materialName: searchQuery || undefined,
        startDate: dateRange.startDate || undefined,
        endDate: dateRange.endDate || undefined,
        quantityUsed: true, // Filter to only show records with quantityUsed > 0
      }),
    refetchInterval: 30000,
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
  }

  const handleDateFilter = () => {
    setPage(1)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setDateRange({ startDate: '', endDate: '' })
    setPage(1)
  }

  // Calculate running total of visible records
  const runningTotal = data?.records?.reduce(
    (sum, record) => sum + (record.quantityUsed || 0),
    0
  ) || 0

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
          <h3 className="text-lg font-medium text-foreground">Failed to load records</h3>
          <p className="text-muted-foreground mt-1">Please try again later</p>
        </div>
      </div>
    )
  }

  const records = data?.records || []
  const totalPages = data?.totalPages || 1
  const total = data?.total || 0

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Used Materials</h1>
          <p className="text-muted-foreground mt-1">
            All materials consumed at your assigned sites
          </p>
        </div>

        {/* Running Total Card */}
        <div className="bg-orange-950/30 border border-orange-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-900/50 rounded-lg flex items-center justify-center">
              <Calculator className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-orange-400">
                Running Total (Visible Page)
              </p>
              <p className="text-2xl font-bold text-orange-300">
                {format.number(runningTotal, 2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by material name..."
                className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
              />
            </div>
          </form>

          {/* Date Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors',
              showFilters
                ? 'bg-primary/10 border-primary/50 text-primary'
                : 'border-input hover:bg-muted text-foreground'
            )}
          >
            <Filter className="w-4 h-4" />
            Date Filter
          </button>

          {/* Clear Filters */}
          {(searchQuery || dateRange.startDate || dateRange.endDate) && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Date Range Inputs */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-border flex flex-col sm:flex-row gap-4">
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
                  className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background"
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
                  className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background"
                />
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleDateFilter}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Material
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Quantity Used
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Quantity Received
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Notes
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Sync Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Recorded By
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <TrendingDown className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-foreground">
                      No used materials found
                    </h3>
                    <p className="text-muted-foreground mt-1">
                      Try adjusting your filters or record materials usage
                    </p>
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record._id} className="hover:bg-muted/50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">
                        {record.materialName}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-orange-600 dark:text-orange-400">
                        {format.number(record.quantityUsed, 2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-foreground">
                      {format.number(record.quantityReceived, 2)}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {format.date(record.date)}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground max-w-xs truncate">
                      {record.notes || '-'}
                    </td>
                    <td className="px-6 py-4">
                      {record.syncedToMainStock ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                          <ArrowUpRight className="w-3 h-3" />
                          Priced
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Pending Price
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-foreground">
                      {record.recordedByName || record.recordedBy}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {records.length > 0 && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-between">
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * ITEMS_PER_PAGE + 1} to{' '}
                {Math.min(page * ITEMS_PER_PAGE, total)} of {total} records
              </p>
              {/* Running Total at bottom too */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-orange-950/30 border border-orange-800 rounded-lg">
                <Calculator className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-medium text-orange-400">
                  Page Total: {format.number(runningTotal, 2)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-foreground">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
