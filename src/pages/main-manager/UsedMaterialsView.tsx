import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  TrendingDown,
  Calendar,
  Download,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Building2,
} from 'lucide-react'
import { viewsApi, sitesManagerApi } from '@/api/mainManager'
import { cn, format } from '@/lib/utils'

interface ExpandedRow {
  [key: string]: boolean
}

export function UsedMaterialsView() {
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  })
  const [expandedRows, setExpandedRows] = useState<ExpandedRow>({})

  const { data, isLoading, error } = useQuery({
    queryKey: ['used-materials-view', dateRange],
    queryFn: () =>
      viewsApi.getUsedMaterials({
        startDate: dateRange.startDate || undefined,
        endDate: dateRange.endDate || undefined,
      }),
  })

  // Load all sites so we can show site names instead of IDs
  const { data: sites } = useQuery({
    queryKey: ['all-sites'],
    queryFn: () => sitesManagerApi.getAllSites(),
    staleTime: 1000 * 60 * 5,
  })

  const siteNameMap = new Map<string, string>()
  sites?.forEach((s) => siteNameMap.set(s._id, s.name))

  const toggleRow = (materialName: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [materialName]: !prev[materialName],
    }))
  }

  const handleExportCSV = () => {
    if (!data) return

    const headers = [
      'Material Name',
      'Total Quantity Used',
      'Average Price',
      'Total Value',
      'Record Count',
    ].join(',')

    const rows = data.map((item) =>
      [
        item.materialName,
        item.totalQuantityUsed,
        item.avgPrice,
        item.totalValue,
        item.recordCount,
      ].join(',')
    )

    const csv = [headers, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `used-materials-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

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

  const totalValue = data?.reduce((sum, item) => sum + item.totalValue, 0) || 0
  const totalQuantity = data?.reduce((sum, item) => sum + item.totalQuantityUsed, 0) || 0

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Used Materials View</h1>
          <p className="text-muted-foreground mt-1">
            Aggregated consumption across all sites
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Quantity Used</p>
          <p className="text-2xl font-bold text-foreground">
            {format.number(totalQuantity, 2)}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Value</p>
          <p className="text-2xl font-bold text-foreground">
            {format.currency(totalValue)}
          </p>
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
                  Total Used
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                  Avg Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                  Total Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                  Records
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                  Breakdown
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <TrendingDown className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No used materials data found</p>
                  </td>
                </tr>
              ) : (
                data?.map((item) => (
                  <>
                    <tr key={item.materialName} className="hover:bg-muted/50">
                      <td className="px-6 py-4 font-medium text-foreground">
                        {item.materialName}
                      </td>
                      <td className="px-6 py-4 text-orange-600 dark:text-orange-400 font-medium">
                        {format.number(item.totalQuantityUsed, 2)}
                      </td>
                      <td className="px-6 py-4 text-foreground">
                        {format.currency(item.avgPrice)}
                      </td>
                      <td className="px-6 py-4 text-foreground">
                        {format.currency(item.totalValue)}
                      </td>
                      <td className="px-6 py-4 text-foreground">
                        {item.recordCount}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleRow(item.materialName)}
                          className="flex items-center gap-1 text-primary hover:text-primary/80"
                        >
                          {expandedRows[item.materialName] ? (
                            <>
                              <ChevronUp className="w-4 h-4" />
                              Hide
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4" />
                              Show ({item.siteBreakdown.length} sites)
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                    {expandedRows[item.materialName] && (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 bg-muted">
                          <div className="space-y-2">
                            {item.siteBreakdown.map((site) => (
                              <div
                                key={site.site_id}
                                className="flex items-center justify-between py-2 px-4 bg-background rounded-lg border border-border"
                              >
                                <div className="flex items-center gap-2">
                                  <Building2 className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-sm text-foreground">
                                    Site: {siteNameMap.get(site.site_id) ?? site.site_id}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    ({site.source})
                                  </span>
                                </div>
                                <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                                  {format.number(site.quantityUsed, 2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
