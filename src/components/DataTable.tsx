import { useState, useMemo, ReactNode } from 'react'
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Search, ArrowUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Column<T> {
  key: string
  header: string
  width?: string
  sortable?: boolean
  render?: (row: T, index: number) => ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (row: T) => string
  pagination?: {
    page: number
    pageSize: number
    total: number
    onPageChange: (page: number) => void
    onPageSizeChange?: (pageSize: number) => void
  }
  searchable?: boolean
  searchValue?: string
  onSearchChange?: (value: string) => void
  loading?: boolean
  skeletonRows?: number
  emptyState?: ReactNode
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  pagination,
  searchable,
  searchValue,
  onSearchChange,
  loading,
  skeletonRows = 5,
  emptyState,
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)

  const sortedData = useMemo(() => {
    if (!sortConfig) return data

    return [...data].sort((a, b) => {
      const aValue = (a as any)[sortConfig.key]
      const bValue = (b as any)[sortConfig.key]

      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1

      if (typeof aValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      return sortConfig.direction === 'asc'
        ? aValue - bValue
        : bValue - aValue
    })
  }, [data, sortConfig])

  const handleSort = (key: string) => {
    if (!columns.find(c => c.key === key)?.sortable) return

    setSortConfig(prev => {
      if (prev?.key === key) {
        return prev.direction === 'asc' ? { key, direction: 'desc' } : null
      }
      return { key, direction: 'asc' }
    })
  }

  const totalPages = pagination ? Math.ceil(pagination.total / pagination.pageSize) : 1

  const renderSkeleton = () => (
    <>
      {Array.from({ length: skeletonRows }).map((_, rowIdx) => (
        <tr key={rowIdx} className="border-b border-border">
          {columns.map((col, colIdx) => (
            <td key={colIdx} className="px-4 py-3">
              <div className={cn(
                'h-4 bg-muted rounded animate-pulse',
                colIdx === 0 ? 'w-3/4' : 'w-1/2'
              )} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )

  return (
    <div className="space-y-4">
      {/* Search and controls */}
      {(searchable || pagination) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {searchable && (
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 border border-input rounded-lg text-sm bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          )}
          {pagination?.onPageSizeChange && (
            <select
              value={pagination.pageSize}
              onChange={(e) => pagination.onPageSizeChange?.(parseInt(e.target.value))}
              className="px-3 py-2 border border-input rounded-lg text-sm bg-background text-foreground"
            >
              <option value={10}>10 rows</option>
              <option value={25}>25 rows</option>
              <option value={50}>50 rows</option>
              <option value={100}>100 rows</option>
            </select>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      'px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider',
                      column.sortable && 'cursor-pointer hover:bg-muted/80 select-none',
                      column.width
                    )}
                    style={{ width: column.width }}
                    onClick={() => handleSort(column.key)}
                  >
                    <div className="flex items-center gap-1">
                      {column.header}
                      {column.sortable && (
                        <span className="text-muted-foreground">
                          {sortConfig?.key === column.key ? (
                            sortConfig.direction === 'asc' ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                renderSkeleton()
              ) : sortedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center">
                    {emptyState || (
                      <div className="text-muted-foreground">
                        <p className="text-sm">No data available</p>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                sortedData.map((row, index) => (
                  <tr key={keyExtractor(row)} className="hover:bg-muted/50 transition-colors">
                    {columns.map((column) => (
                      <td key={column.key} className="px-4 py-3 text-sm text-foreground">
                        {column.render ? column.render(row, index) : (row as any)[column.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && totalPages > 1 && (
          <div className="px-4 py-3 border-t border-border flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(pagination.page - 1) * pagination.pageSize + 1} to{' '}
              {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
              {pagination.total} results
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => pagination.onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed text-foreground"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-foreground">
                Page {pagination.page} of {totalPages}
              </span>
              <button
                onClick={() => pagination.onPageChange(pagination.page + 1)}
                disabled={pagination.page === totalPages}
                className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed text-foreground"
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
