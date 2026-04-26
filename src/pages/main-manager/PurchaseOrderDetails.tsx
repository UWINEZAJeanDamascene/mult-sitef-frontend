import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  FileText,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Send,
  Package,
  Plus,
  Trash2,
  Edit,
  Printer,
  Truck,
  Receipt,
} from 'lucide-react'
import { purchaseOrderApi } from '@/api/mainManager'
import { format, cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import type { POItem } from '@/types'

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: Clock },
  sent: { label: 'Sent', color: 'bg-blue-100 text-blue-800', icon: Send },
  partial: { label: 'Partial', color: 'bg-amber-100 text-amber-800', icon: Package },
  received: { label: 'Received', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  completed: { label: 'Completed', color: 'bg-purple-100 text-purple-800', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle },
}

interface ReceiveModalProps {
  isOpen: boolean
  onClose: () => void
  items: POItem[]
  onConfirm: (receivedItems: { itemId: string; quantity: number }[], notes: string) => void
}

function ReceiveModal({ isOpen, onClose, items, onConfirm }: ReceiveModalProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [notes, setNotes] = useState('')

  if (!isOpen) return null

  const handleConfirm = () => {
    const receivedItems = Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([itemId, quantity]) => ({ itemId, quantity }))

    if (receivedItems.length === 0) {
      alert('Please enter at least one quantity to receive')
      return
    }

    onConfirm(receivedItems, notes)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Receive Items</h2>

          <div className="space-y-4 mb-6">
            {items.map((item) => {
              const remaining = item.quantityOrdered - item.quantityReceived
              const currentQty = quantities[item._id || ''] || 0

              return (
                <div key={item._id} className="p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-foreground">{item.materialName}</span>
                    <span className="text-sm text-muted-foreground">
                      Ordered: {item.quantityOrdered} {item.unit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Already received: {item.quantityReceived} {item.unit}
                    </span>
                    <span className="text-sm font-medium text-amber-600">
                      Remaining: {remaining} {item.unit}
                    </span>
                  </div>

                  {remaining > 0 && (
                    <div className="mt-3 flex items-center gap-3">
                      <label className="text-sm text-foreground">Receive now:</label>
                      <input
                        type="number"
                        min="0"
                        max={remaining}
                        step="0.01"
                        value={currentQty || ''}
                        onChange={(e) =>
                          setQuantities({
                            ...quantities,
                            [item._id || '']: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-32 px-3 py-1.5 text-sm border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
                      />
                      <span className="text-sm text-muted-foreground">{item.unit}</span>
                    </div>
                  )}

                  {remaining === 0 && (
                    <div className="mt-2 text-sm text-green-600 font-medium">
                      ✓ Fully received
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-1">
              Receipt Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
              placeholder="Optional notes about this receipt"
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Confirm Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function PurchaseOrderDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [showReceiveModal, setShowReceiveModal] = useState(false)

  const { data: po, isLoading, error } = useQuery({
    queryKey: ['purchase-order', id],
    queryFn: () => purchaseOrderApi.getById(id!),
    enabled: !!id,
  })

  const sendMutation = useMutation({
    mutationFn: () => purchaseOrderApi.send(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-order', id] })
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
    },
  })

  const receiveMutation = useMutation({
    mutationFn: (data: { receivedItems: { itemId: string; quantity: number }[]; notes: string }) =>
      purchaseOrderApi.receiveItems(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-order', id] })
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      setShowReceiveModal(false)
    },
  })

  const completeMutation = useMutation({
    mutationFn: () => purchaseOrderApi.complete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-order', id] })
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
    },
  })

  const cancelMutation = useMutation({
    mutationFn: () => purchaseOrderApi.cancel(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-order', id] })
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
    },
  })

  const handleSend = () => {
    if (confirm('Mark this PO as sent to supplier?')) {
      sendMutation.mutate()
    }
  }

  const handleReceive = (receivedItems: { itemId: string; quantity: number }[], notes: string) => {
    receiveMutation.mutate({ receivedItems, notes })
  }

  const handleComplete = () => {
    if (confirm('Mark this PO as completed?')) {
      completeMutation.mutate()
    }
  }

  const handleCancel = () => {
    if (confirm('Cancel this purchase order?')) {
      cancelMutation.mutate()
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !po) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
          <h3 className="text-lg font-medium text-foreground">Failed to load PO</h3>
        </div>
      </div>
    )
  }

  const statusInfo = statusConfig[po.status]
  const StatusIcon = statusInfo.icon
  const canEdit = po.status === 'draft'
  const canSend = po.status === 'draft'
  const canReceive = ['sent', 'partial'].includes(po.status)
  const canComplete = ['received', 'partial'].includes(po.status)
  const canCancel = ['draft', 'sent', 'partial', 'received'].includes(po.status)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/purchase-orders')}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{po.poNumber}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                  statusInfo.color
                )}
              >
                <StatusIcon className="w-3 h-3" />
                {statusInfo.label}
              </span>
              <span className="text-sm text-muted-foreground">
                Created {format.date(po.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Print/PDF Button - Always Available */}
          <button
            onClick={() => window.open(`/api/purchase-orders/${po.id}/pdf`, '_blank')}
            className="flex items-center gap-2 px-4 py-2 border border-input rounded-lg hover:bg-muted transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print / PDF
          </button>

          {canEdit && (
            <button
              onClick={() => navigate(`/purchase-orders/${po.id}/edit`)}
              className="flex items-center gap-2 px-4 py-2 border border-input rounded-lg hover:bg-muted transition-colors"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
          )}

          {canSend && (
            <button
              onClick={handleSend}
              disabled={sendMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {sendMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              <Send className="w-4 h-4" />
              Mark as Sent
            </button>
          )}

          {canReceive && (
            <>
              <Link
                to={`/purchase-orders/${po.id}/create-dn`}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Truck className="w-4 h-4" />
                Create Delivery Note
              </Link>
              <button
                onClick={() => setShowReceiveModal(true)}
                disabled={receiveMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {receiveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                <Package className="w-4 h-4" />
                Quick Receive
              </button>
              <Link
                to={`/purchase-orders/${po.id}/create-return`}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Receipt className="w-4 h-4" />
                Create Return
              </Link>
            </>
          )}

          {canComplete && (
            <button
              onClick={handleComplete}
              disabled={completeMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {completeMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              <CheckCircle2 className="w-4 h-4" />
              Complete
            </button>
          )}

          {canCancel && (
            <button
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 border border-destructive text-destructive rounded-lg hover:bg-destructive/10 transition-colors disabled:opacity-50"
            >
              {cancelMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              <XCircle className="w-4 h-4" />
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - PO Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items Table */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              PO Items
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">
                      Material
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">
                      Ordered
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">
                      Received
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">
                      Unit Price
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {po.items.map((item) => (
                    <tr key={item._id}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{item.materialName}</div>
                        {item.description && (
                          <div className="text-sm text-muted-foreground">{item.description}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {item.quantityOrdered} {item.unit}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            item.quantityReceived >= item.quantityOrdered
                              ? 'text-green-600'
                              : 'text-amber-600'
                          )}
                        >
                          {item.quantityReceived} {item.unit}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {format.currency(item.unitPrice)}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {format.currency(item.quantityReceived * item.unitPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-6 pt-4 border-t border-border space-y-2 md:text-right">
              <div className="flex justify-between md:justify-end gap-4 text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium text-foreground">{format.currency(po.subTotal)}</span>
              </div>
              <div className="flex justify-between md:justify-end gap-4 text-sm">
                <span className="text-muted-foreground">Tax ({po.taxRate}%):</span>
                <span className="font-medium text-foreground">{format.currency(po.taxAmount)}</span>
              </div>
              <div className="flex justify-between md:justify-end gap-4 text-lg font-semibold pt-2">
                <span className="text-foreground">Total:</span>
                <span className="text-primary">{format.currency(po.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {(po.notes || po.terms) && (
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
              {po.notes && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Notes</h3>
                  <p className="text-foreground">{po.notes}</p>
                </div>
              )}
              {po.terms && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Terms & Conditions</h3>
                  <p className="text-foreground">{po.terms}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column - Supplier & Delivery */}
        <div className="space-y-6">
          {/* Supplier Info */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Supplier
            </h2>
            <div className="space-y-3">
              <div>
                <div className="font-medium text-foreground">{po.supplier.name}</div>
                {po.supplier.contactPerson && (
                  <div className="text-sm text-muted-foreground">{po.supplier.contactPerson}</div>
                )}
              </div>
              {po.supplier.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  {po.supplier.email}
                </div>
              )}
              {po.supplier.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  {po.supplier.phone}
                </div>
              )}
              {po.supplier.address && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 mt-0.5" />
                  {po.supplier.address}
                </div>
              )}
            </div>
          </div>

          {/* Delivery Info */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Delivery
            </h2>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground">Site</div>
                <div className="font-medium text-foreground">
                  {(po.site as any)?.name || 'Unknown'}
                </div>
                {(po.site as any)?.location && (
                  <div className="text-sm text-muted-foreground">
                    {(po.site as any)?.location}
                  </div>
                )}
              </div>
              {po.sentDate && (
                <div>
                  <div className="text-sm text-muted-foreground">Sent Date</div>
                  <div className="font-medium text-foreground">{format.date(po.sentDate)}</div>
                </div>
              )}
              {po.expectedDeliveryDate && (
                <div>
                  <div className="text-sm text-muted-foreground">Expected Delivery</div>
                  <div className="font-medium text-foreground">
                    {format.date(po.expectedDeliveryDate)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Created By */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground mb-4">Created By</h2>
            <div className="text-foreground">{po.createdBy}</div>
            <div className="text-sm text-muted-foreground">{format.datetime(po.createdAt)}</div>
          </div>
        </div>
      </div>

      {/* Receive Modal */}
      <ReceiveModal
        isOpen={showReceiveModal}
        onClose={() => setShowReceiveModal(false)}
        items={po.items}
        onConfirm={handleReceive}
      />
    </div>
  )
}
