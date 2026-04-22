import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Search,
  Calendar,
  User,
  Activity,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Database,
  ArrowLeft,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { actionLogsApi } from '@/api/actionLogs'
import { ActionLog, ActionType, ResourceType, ActionLogStats } from '@/types/index'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

// Helper function to format date
function formatDate(date: string): string {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Helper function to get action color
function getActionColor(action: ActionType): string {
  const colors: Record<ActionType, string> = {
    [ActionType.CREATE]: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    [ActionType.UPDATE]: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    [ActionType.DELETE]: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    [ActionType.LOGIN]: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    [ActionType.LOGOUT]: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    [ActionType.ASSIGN]: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    [ActionType.UNASSIGN]: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    [ActionType.PRICE_UPDATE]: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
    [ActionType.SYNC]: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    [ActionType.EXPORT]: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
    [ActionType.IMPORT]: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
    [ActionType.VIEW]: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    [ActionType.OTHER]: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  }
  return colors[action] || colors[ActionType.OTHER]
}

// Helper function to get resource icon
function getResourceIcon(resource: ResourceType) {
  switch (resource) {
    case ResourceType.SITE:
      return <Database className="w-4 h-4" />
    case ResourceType.USER:
      return <User className="w-4 h-4" />
    default:
      return <Activity className="w-4 h-4" />
  }
}

export function ActionLogs() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState<ActionType | 'all'>('all')
  const [resourceFilter, setResourceFilter] = useState<ResourceType | 'all'>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const { data, isLoading, error, refetch } = useQuery<{
    logs: ActionLog[]
    total: number
    page: number
    totalPages: number
  }>({
    queryKey: ['action-logs', page, search, actionFilter, resourceFilter, startDate, endDate],
    queryFn: () =>
      actionLogsApi.getLogs({
        page,
        limit: 20,
        search: search || undefined,
        action: actionFilter === 'all' ? undefined : actionFilter,
        resource: resourceFilter === 'all' ? undefined : resourceFilter,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
  })

  const { data: stats } = useQuery<ActionLogStats>({
    queryKey: ['action-logs-stats'],
    queryFn: actionLogsApi.getStats,
  })

  if (error) {
    toast.error('Failed to load action logs')
  }

  const logs = data?.logs || []
  const totalPages = data?.totalPages || 1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Action Logs</h1>
            <p className="text-muted-foreground">Monitor all system activities and user actions</p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-sm text-muted-foreground">Total Actions</p>
            <p className="text-2xl font-bold text-foreground">{stats.totalActions}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-sm text-muted-foreground">Most Common Action</p>
            <p className="text-2xl font-bold text-foreground">
              {stats.actionStats?.[0]?.action || 'N/A'}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-sm text-muted-foreground">Most Active User</p>
            <p className="text-lg font-bold text-foreground truncate">
              {stats.topUsers?.[0]?.userName || 'N/A'}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-sm text-muted-foreground">Top Resource</p>
            <p className="text-2xl font-bold text-foreground">
              {stats.resourceStats?.[0]?.resource || 'N/A'}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by user, action, or resource..."
              className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-background text-foreground"
            />
          </div>

          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value as ActionType | 'all')}
            className="px-4 py-2 border border-input rounded-lg bg-background text-foreground"
          >
            <option value="all">All Actions</option>
            {Object.values(ActionType).map((action) => (
              <option key={action} value={action}>
                {action.replace('_', ' ').toUpperCase()}
              </option>
            ))}
          </select>

          {/* Resource Filter */}
          <select
            value={resourceFilter}
            onChange={(e) => setResourceFilter(e.target.value as ResourceType | 'all')}
            className="px-4 py-2 border border-input rounded-lg bg-background text-foreground"
          >
            <option value="all">All Resources</option>
            {Object.values(ResourceType).map((resource) => (
              <option key={resource} value={resource}>
                {resource.replace('_', ' ').toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range */}
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 border border-input rounded-lg bg-background text-foreground text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 border border-input rounded-lg bg-background text-foreground text-sm"
            />
          </div>
          {(search || actionFilter !== 'all' || resourceFilter !== 'all' || startDate || endDate) && (
            <button
              onClick={() => {
                setSearch('')
                setActionFilter('all')
                setResourceFilter('all')
                setStartDate('')
                setEndDate('')
              }}
              className="text-sm text-primary hover:underline ml-auto"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading action logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center">
            <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No action logs found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                      Timestamp
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                      Action
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                      Resource
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logs.map((log: ActionLog) => (
                    <tr key={log.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {log.userName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{log.userName}</p>
                            <p className="text-xs text-muted-foreground">{log.userEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                            getActionColor(log.action)
                          )}
                        >
                          {log.action.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {getResourceIcon(log.resource)}
                          <span>{log.resource.replace('_', ' ').toUpperCase()}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">{log.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-4 py-3 border-t border-border flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {logs.length} of {data?.total || 0} logs
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
                  className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
