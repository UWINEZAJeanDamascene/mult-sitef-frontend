import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  Receipt,
  ArrowLeft,
  FileText,
  Building2,
  MapPin,
  Calendar,
  Package,
  User,
  Truck,
  DollarSign,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Edit3,
  Trash2,
} from 'lucide-react'
import { purchaseReturnApi, purchaseOrderApi } from '@/api/mainManager'
import { format, cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { PurchaseReturn } from '@/types'

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

export function PurchaseReturnDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [refundStatus, setRefundStatus] = useState<string>('')
  const [refundAmount, setRefundAmount] = useState<string>('')
  const [showRefundEdit, setShowRefundEdit] = useState(false)

  const { data: ret, isLoading, error } = useQuery({
    queryKey: ['purchase-return', id],
    queryFn: () => purchaseReturnApi.getById(id!),
    enabled: !!id,
  })

  const { data: po } = useQuery({
    queryKey: ['purchase-order', ret?.poId],
    queryFn: () => purchaseOrderApi.getById(ret!.poId),
    enabled: !!ret?.poId,
  })

  const deleteMutation = useMutation({
    mutationFn: () => purchaseReturnApi.delete(id!),
    onSuccess: () => {
      toast.success('Purchase return deleted successfully')
      navigate('/purchase-returns')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete purchase return')
    },
  })

  const updateRefundMutation = useMutation({
    mutationFn: () =>
      purchaseReturnApi.updateRefundStatus(
        id!,
        refundStatus,
        refundAmount ? parseFloat(refundAmount) : undefined
      ),
    onSuccess: () => {
      toast.success('Refund status updated successfully')
      queryClient.invalidateQueries({ queryKey: ['purchase-return', id] })
      setShowRefundEdit(false)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update refund status')
    },
  })

  const handleDelete = () => {
    deleteMutation.mutate()
  }

  const handleRefundUpdate = () => {
    updateRefundMutation.mutate()
  }

  const startRefundEdit = () => {
    if (ret) {
      setRefundStatus(ret.refundStatus)
      setRefundAmount(ret.refundAmount?.toString() || '')
      setShowRefundEdit(true)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !ret) {
    return (
      <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
        <p className="text-destructive">
          Failed to load purchase return. Please try again.
        </p>
        <button
          onClick={() => navigate('/purchase-returns')}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
        >
          Back to Returns
        </button>
      </div>
    )
  }

  const ConditionIcon = conditionConfig[ret.condition].icon
  const calculatedRefund = ret.items.reduce(
    (sum, item) => sum + item.quantityReturned * item.unitPrice,
    0
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/purchase-returns')}
            className="p-2 border border-border rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">
                {ret.returnNumber}
              </h1>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium',
                  conditionConfig[ret.condition].color
                )}
              >
                <ConditionIcon className="w-4 h-4" />
                {conditionConfig[ret.condition].label}
              </span>
            </div>
            <p className="text-muted-foreground mt-1">
              Created on {format.date(ret.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-destructive text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* PO Reference */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-muted-foreground" />
              Purchase Order Reference
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">PO Number</p>
                <Link
                  to={`/purchase-orders/${ret.poId}`}
                  className="font-medium text-foreground hover:text-primary hover:underline"
                >
                  {ret.poNumber}
                </Link>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Return Date</p>
                <p className="font-medium text-foreground">
                  {format.date(ret.returnDate)}
                </p>
              </div>
            </div>
          </div>

          {/* Return Items */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-muted-foreground" />
              Returned Items ({ret.items.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                      Material
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                      Reason
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {ret.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">
                          {item.materialName}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-foreground">
                          {item.quantityReturned} {item.unit}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-foreground">
                          ${item.unitPrice.toFixed(2)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          {returnReasonLabels[item.reason]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="font-medium text-foreground">
                          ${(item.quantityReturned * item.unitPrice).toFixed(2)}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/50">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-right font-semibold">
                      Calculated Refund:
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-foreground">
                      ${calculatedRefund.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Notes */}
          {ret.notes && (
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Notes
              </h2>
              <p className="text-muted-foreground">{ret.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Supplier Info */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-muted-foreground" />
              Supplier
            </h2>
            <div className="space-y-3">
              <div>
                <p className="font-medium text-foreground">
                  {ret.supplier.name}
                </p>
                {ret.supplier.contactPerson && (
                  <p className="text-sm text-muted-foreground">
                    Contact: {ret.supplier.contactPerson}
                  </p>
                )}
              </div>
              {ret.supplier.email && (
                <p className="text-sm text-muted-foreground">
                  {ret.supplier.email}
                </p>
              )}
              {ret.supplier.phone && (
                <p className="text-sm text-muted-foreground">
                  {ret.supplier.phone}
                </p>
              )}
            </div>
          </div>

          {/* Site Info */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-muted-foreground" />
              Site
            </h2>
            <div className="space-y-2">
              <p className="font-medium text-foreground">{ret.site.name}</p>
              {ret.site.location && (
                <p className="text-sm text-muted-foreground">
                  {ret.site.location}
                </p>
              )}
            </div>
          </div>

          {/* Return Info */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5 text-muted-foreground" />
              Return Details
            </h2>
            <div className="space-y-3">
              {ret.carrier && (
                <div>
                  <p className="text-sm text-muted-foreground">Carrier</p>
                  <p className="font-medium text-foreground">{ret.carrier}</p>
                </div>
              )}
              {ret.trackingNumber && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Tracking Number
                  </p>
                  <p className="font-medium text-foreground">
                    {ret.trackingNumber}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Returned By</p>
                <p className="font-medium text-foreground">
                  {ret.returnedByName || 'Unknown'}
                </p>
              </div>
            </div>
          </div>

          {/* Refund Status */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-muted-foreground" />
                Refund Status
              </h2>
              <button
                onClick={startRefundEdit}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <Edit3 className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <span
                  className={cn(
                    'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium mt-1',
                    refundStatusConfig[ret.refundStatus].color
                  )}
                >
                  {refundStatusConfig[ret.refundStatus].label}
                </span>
              </div>
              {ret.refundAmount && (
                <div>
                  <p className="text-sm text-muted-foreground">Refund Amount</p>
                  <p className="font-medium text-foreground">
                    ${ret.refundAmount.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
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
                onClick={() => setShowDeleteModal(false)}
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

      {/* Edit Refund Modal */}
      {showRefundEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border border-border shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Update Refund Status
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Refund Status
                </label>
                <select
                  value={refundStatus}
                  onChange={(e) => setRefundStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                >
                  <option value="pending">Pending</option>
                  <option value="processed">Processed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Refund Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder={calculatedRefund.toFixed(2)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Calculated: ${calculatedRefund.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowRefundEdit(false)}
                className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRefundUpdate}
                disabled={updateRefundMutation.isPending}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {updateRefundMutation.isPending && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
