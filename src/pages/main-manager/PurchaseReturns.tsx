import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import {
  Receipt,
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
import { purchaseReturnApi } from '@/api/mainManager'
import { format, cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { PurchaseReturn } from '@/types'

const ITEMS_PER_PAGE = 10

const conditionConfig = {
  good: { label: 'Good', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  damaged: { label: 'Damaged', color: 'bg-red-100 text-red-800', icon: XCircle },
  partial: { label: 'Partial', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
}

const refundStatusConfig = {
  pending: { label: 'Pending', color: 'bg-gray-100 text-gray-800' },
  processed: { label: 'Processed', color: 'bg-blue-100 text-blue-800' },
  refunded: { label: 'Refunded', color: 'bg-green-100 text-green-800' },
}

const returnReasonLabels: Record<string, string> = {
  defective: 'Defective',
  wrong_item: 'Wrong Item',
  overage: 'Overage',
  other: 'Other',
}

export function PurchaseReturns() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['purchase-returns', page, searchQuery],
    queryFn: () =>
      purchaseReturnApi.getAll({
        page,
        limit: ITEMS_PER_PAGE,
        search: searchQuery || undefined,
      }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => purchaseReturnApi.delete(id),
    onSuccess: () => {
      toast.success('Purchase return deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['purchase-returns'] })
      setDeleteId(null)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete purchase return')
    },
  })

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId)
    }
  }

  const totalPages = data?.totalPages || 0
  const total = data?.total || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Purchase Returns</h1>
          <p className="text-muted-foreground mt-1">
            Manage returns to suppliers
          </p>
        </div>
        <Link
          to="/purchase-orders"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          title="Go to Purchase Orders, select a received PO, then click 'Create Return'"
        >
          <Plus className="w-4 h-4" />
          Create Return from PO
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
            placeholder="Search by return number, PO number, or supplier..."
            className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
          />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <p className="text-destructive">
            Failed to load purchase returns. Please try again.
          </p>
        </div>
      )}

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Return Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  PO Reference
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Supplier & Site
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Return Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Condition
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Refund Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Refund Amount
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                    <p className="mt-2 text-muted-foreground">
                      Loading purchase returns...
                    </p>
                  </td>
                </tr>
              ) : data?.records.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <Receipt className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-1">
                      No purchase returns found
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {searchQuery
                        ? 'Try adjusting your search terms'
                        : 'Go to Purchase Orders, select a received PO, then click "Create Return"'}
                    </p>
                    <Link
                      to="/purchase-orders"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Create from PO
                    </Link>
                  </td>
                </tr>
              ) : (
                data?.records.map((ret: PurchaseReturn) => (
                  <tr
                    key={ret.id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                          <Receipt className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {ret.returnNumber}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format.date(ret.createdAt)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-foreground">
                          {ret.poNumber}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium text-foreground">
                            {ret.supplier.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{ret.site.name}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground">
                          {format.date(ret.returnDate)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground">
                          {ret.items.length} items
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {ret.items
                          .map((item) => returnReasonLabels[item.reason])
                          .join(', ')}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                          conditionConfig[ret.condition].color
                        )}
                      >
                        {(() => {
                          const Icon = conditionConfig[ret.condition].icon
                          return <Icon className="w-3.5 h-3.5" />
                        })()}
                        {conditionConfig[ret.condition].label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                          refundStatusConfig[ret.refundStatus].color
                        )}
                      >
                        {refundStatusConfig[ret.refundStatus].label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {ret.refundAmount ? (
                        <span className="font-medium text-foreground">
                          ${ret.refundAmount.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/purchase-returns/${ret.id}`)}
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => setDeleteId(ret.id)}
                          className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                          title="Delete return"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * ITEMS_PER_PAGE + 1} to{' '}
              {Math.min(page * ITEMS_PER_PAGE, total)} of {total} returns
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-4 py-2 text-sm font-medium">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border border-border shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Delete Purchase Return?
            </h3>
            <p className="text-muted-foreground mb-6">
              This action cannot be undone. This will permanently delete the
              purchase return and update the associated PO quantities.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deleteMutation.isPending && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
