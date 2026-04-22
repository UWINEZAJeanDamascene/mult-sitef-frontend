import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  Search,
  Filter,
  Plus,
  Loader2,
  AlertCircle,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  XCircle,
  Send,
  Package,
  Eye,
  Trash2,
  MoreVertical,
  Copy,
  Download,
  Printer,
  BarChart3,
} from 'lucide-react'
import { purchaseOrderApi } from '@/api/mainManager'
import { useAuth } from '@/context/AuthContext'
import { format, cn } from '@/lib/utils'
import type { PurchaseOrder } from '@/types'

const ITEMS_PER_PAGE = 10

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: Clock },
  sent: { label: 'Sent', color: 'bg-blue-100 text-blue-800', icon: Send },
  partial: { label: 'Partial', color: 'bg-amber-100 text-amber-800', icon: Package },
  received: { label: 'Received', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  completed: { label: 'Completed', color: 'bg-purple-100 text-purple-800', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle },
}

export function PurchaseOrders() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['purchase-orders', page, searchQuery, statusFilter],
    queryFn: () =>
      purchaseOrderApi.getAll({
        page,
        limit: ITEMS_PER_PAGE,
        supplier: searchQuery || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      }),
  })

  const { data: stats } = useQuery({
    queryKey: ['purchase-orders-stats'],
    queryFn: purchaseOrderApi.getStats,
  })

  const deleteMutation = useMutation({
    mutationFn: purchaseOrderApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-orders-stats'] })
    },
  })

  const sendMutation = useMutation({
    mutationFn: purchaseOrderApi.send,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-orders-stats'] })
    },
  })

  const cancelMutation = useMutation({
    mutationFn: purchaseOrderApi.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-orders-stats'] })
    },
  })

  const duplicateMutation = useMutation({
    mutationFn: purchaseOrderApi.duplicate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-orders-stats'] })
    },
  })

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this purchase order?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleSend = (id: string) => {
    if (confirm('Mark this PO as sent to supplier?')) {
      sendMutation.mutate(id)
    }
  }

  const handleCancel = (id: string) => {
    if (confirm('Cancel this purchase order?')) {
      cancelMutation.mutate(id)
    }
  }

  const handleDuplicate = (id: string) => {
    if (confirm('Duplicate this purchase order?')) {
      duplicateMutation.mutate(id)
    }
  }

  const handleExportExcel = async () => {
    try {
      const blob = await purchaseOrderApi.exportToExcel({
        status: statusFilter !== 'all' ? statusFilter : undefined,
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `purchase-orders-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      alert('Failed to export purchase orders')
    }
  }

  const records = data?.records || []
  const totalPages = data?.totalPages || 1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Purchase Orders</h1>
          <p className="text-muted-foreground mt-1">
            Manage purchase orders and track deliveries
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/purchase-orders/reports')}
            className="flex items-center gap-2 px-4 py-2 border border-input rounded-lg hover:bg-muted transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            Reports
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 border border-input rounded-lg hover:bg-muted transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => navigate('/purchase-orders/new')}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create PO
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <div className="text-muted-foreground text-sm">Total POs</div>
          <div className="text-2xl font-bold text-foreground mt-1">{stats?.total || 0}</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <div className="text-muted-foreground text-sm">Total Value</div>
          <div className="text-2xl font-bold text-foreground mt-1">
            {format.currency(stats?.totalValue || 0)}
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <div className="text-muted-foreground text-sm">Pending Delivery</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {(stats?.byStatus?.sent?.count || 0) + (stats?.byStatus?.partial?.count || 0)}
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <div className="text-muted-foreground text-sm">Completed</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {stats?.byStatus?.completed?.count || 0}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by supplier name..."
              className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="partial">Partial</option>
            <option value="received">Received</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Clear Filters */}
          {(searchQuery || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('all')
                setPage(1)
              }}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  PO Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Site
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-foreground">Failed to load POs</h3>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-foreground">No purchase orders</h3>
                    <p className="text-muted-foreground mt-1">Create your first purchase order</p>
                  </td>
                </tr>
              ) : (
                records.map((po) => {
                  const statusInfo = statusConfig[po.status]
                  const StatusIcon = statusInfo.icon

                  return (
                    <tr key={po.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{po.poNumber}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{po.supplier.name}</div>
                        {po.supplier.contactPerson && (
                          <div className="text-sm text-muted-foreground">
                            {po.supplier.contactPerson}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-foreground">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          {(po.site as any)?.name || 'Unknown'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                            statusInfo.color
                          )}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-foreground">{po.items.length}</td>
                      <td className="px-6 py-4 font-medium text-foreground">
                        {format.currency(po.totalAmount)}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format.date(po.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => navigate(`/purchase-orders/${po.id}`)}
                            className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                            title="View details"
                          >
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          </button>

                          {po.status === 'draft' && (
                            <>
                              <button
                                onClick={() => navigate(`/purchase-orders/${po.id}/edit`)}
                                className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                                title="Edit"
                              >
                                <FileText className="w-4 h-4 text-muted-foreground" />
                              </button>
                              <button
                                onClick={() => handleSend(po.id)}
                                className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                                title="Mark as sent"
                              >
                                <Send className="w-4 h-4 text-blue-500" />
                              </button>
                              <button
                                onClick={() => handleDelete(po.id)}
                                className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </button>
                            </>
                          )}

                          {['sent', 'partial', 'received'].includes(po.status) && (
                            <button
                              onClick={() => handleCancel(po.id)}
                              className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                              title="Cancel"
                            >
                              <XCircle className="w-4 h-4 text-red-500" />
                            </button>
                          )}

                          {/* Duplicate button - available for all POs */}
                          <button
                            onClick={() => handleDuplicate(po.id)}
                            className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                            title="Duplicate PO"
                          >
                            <Copy className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {records.length > 0 && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * ITEMS_PER_PAGE + 1} to{' '}
              {Math.min(page * ITEMS_PER_PAGE, data?.total || 0)} of {data?.total || 0} records
            </p>
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
