import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import {
  Truck,
  Search,
  Plus,
  Loader2,
  AlertCircle,
  FileText,
  Calendar,
  Package,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Building2,
  Eye,
  Trash2,
} from 'lucide-react'
import { deliveryNoteApi } from '@/api/mainManager'
import { format, cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { DeliveryNote } from '@/types'

const ITEMS_PER_PAGE = 10

const conditionConfig = {
  good: { label: 'Good', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  damaged: { label: 'Damaged', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
  partial: { label: 'Partial', color: 'bg-amber-100 text-amber-800', icon: XCircle },
}

export function DeliveryNotes() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['delivery-notes', page, searchQuery],
    queryFn: () =>
      deliveryNoteApi.getAll({
        page,
        limit: ITEMS_PER_PAGE,
        search: searchQuery || undefined,
      }),
  })

  const deleteMutation = useMutation({
    mutationFn: deliveryNoteApi.delete,
    onSuccess: () => {
      toast.success('Delivery note deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['delivery-notes'] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete delivery note')
    },
  })

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this delivery note?')) {
      deleteMutation.mutate(id)
    }
  }

  const records = data?.records || []
  const totalPages = data?.totalPages || 1
  const total = data?.total || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Delivery Notes</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage purchase order deliveries
          </p>
        </div>
        <Link
          to="/purchase-orders"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create from PO
        </Link>
      </div>

      {/* Search */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setPage(1)
            }}
            placeholder="Search by DN number, PO number, or supplier..."
            className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  DN Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  PO Reference
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Site
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Delivery Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Condition
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
                    <h3 className="text-lg font-medium text-foreground">Failed to load delivery notes</h3>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-foreground">No delivery notes found</h3>
                    <p className="text-muted-foreground mt-1">
                      {searchQuery ? 'Try adjusting your search' : 'Create delivery notes from purchase orders'}
                    </p>
                    <Link
                      to="/purchase-orders"
                      className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      Go to Purchase Orders
                    </Link>
                  </td>
                </tr>
              ) : (
                records.map((dn) => {
                  const conditionInfo = conditionConfig[dn.condition]
                  const ConditionIcon = conditionInfo.icon

                  return (
                    <tr key={dn.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Truck className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{dn.dnNumber}</div>
                            {dn.carrier && (
                              <div className="text-xs text-muted-foreground">{dn.carrier}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          to={`/purchase-orders/${dn.poId}`}
                          className="font-medium text-foreground hover:text-primary hover:underline"
                        >
                          {dn.poNumber}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-foreground">{dn.supplier.name}</div>
                        {dn.receivedByName && (
                          <div className="text-xs text-muted-foreground">
                            Received by: {dn.receivedByName}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-foreground">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          {dn.site.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-foreground">
                          <Package className="w-4 h-4 text-muted-foreground" />
                          {dn.items.length} items
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {format.date(dn.deliveryDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                            conditionInfo.color
                          )}
                        >
                          <ConditionIcon className="w-3 h-3" />
                          {conditionInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <Link
                            to={`/delivery-notes/${dn.id}`}
                            className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                            title="View details"
                          >
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          </Link>
                          <button
                            onClick={() => handleDelete(dn.id)}
                            className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
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
              {Math.min(page * ITEMS_PER_PAGE, total)} of {total} records
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
