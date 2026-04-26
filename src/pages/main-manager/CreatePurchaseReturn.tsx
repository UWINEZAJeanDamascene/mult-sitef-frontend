import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  Receipt,
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Package,
  Building2,
  MapPin,
  Calendar,
} from 'lucide-react'
import { purchaseReturnApi, purchaseOrderApi, deliveryNoteApi } from '@/api/mainManager'
import { format, cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { PurchaseOrder, POItem } from '@/types'

interface ReturnItem {
  materialName: string
  material_id?: string
  quantityReturned: number
  unit: string
  unitPrice: number
  reason: 'defective' | 'wrong_item' | 'overage' | 'other'
  notes: string
}

const reasonOptions = [
  { value: 'defective', label: 'Defective' },
  { value: 'wrong_item', label: 'Wrong Item' },
  { value: 'overage', label: 'Overage' },
  { value: 'other', label: 'Other' },
]

const conditionOptions = [
  { value: 'good', label: 'Good' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'partial', label: 'Partial' },
]

export function CreatePurchaseReturn() {
  const { poId } = useParams<{ poId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [returnDate, setReturnDate] = useState(format.date(new Date().toISOString()))
  const [carrier, setCarrier] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [condition, setCondition] = useState<'good' | 'damaged' | 'partial'>('good')
  const [notes, setNotes] = useState('')
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([])

  const { data: po, isLoading: poLoading } = useQuery({
    queryKey: ['purchase-order', poId],
    queryFn: () => purchaseOrderApi.getById(poId!),
    enabled: !!poId,
  })

  // Fetch delivery notes to auto-fill carrier and tracking
  const { data: deliveryNotes } = useQuery({
    queryKey: ['delivery-notes-by-po', poId],
    queryFn: () => deliveryNoteApi.getByPO(poId!),
    enabled: !!poId,
  })

  // Auto-fill carrier and tracking from first delivery note
  useEffect(() => {
    if (deliveryNotes && deliveryNotes.length > 0) {
      const firstDN = deliveryNotes[0]
      if (firstDN.carrier && !carrier) {
        setCarrier(firstDN.carrier)
      }
      if (firstDN.trackingNumber && !trackingNumber) {
        setTrackingNumber(firstDN.trackingNumber)
      }
    }
  }, [deliveryNotes, carrier, trackingNumber])

  const createMutation = useMutation({
    mutationFn: () =>
      purchaseReturnApi.create({
        poId: poId!,
        items: returnItems.map((item) => ({
          materialName: item.materialName,
          material_id: item.material_id,
          quantityReturned: item.quantityReturned,
          unit: item.unit,
          unitPrice: item.unitPrice,
          reason: item.reason,
          notes: item.notes,
        })),
        returnDate,
        carrier: carrier || undefined,
        trackingNumber: trackingNumber || undefined,
        condition,
        notes: notes || undefined,
      }),
    onSuccess: () => {
      toast.success('Purchase return created successfully')
      queryClient.invalidateQueries({ queryKey: ['purchase-returns'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-order', poId] })
      navigate('/purchase-returns')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create purchase return')
    },
  })

  const addReturnItem = (poItem: POItem) => {
    const existingIndex = returnItems.findIndex(
      (item) => item.materialName === poItem.materialName
    )
    if (existingIndex >= 0) {
      toast.error('Item already added to return')
      return
    }

    const maxReturn = poItem.quantityReceived || 0
    if (maxReturn === 0) {
      toast.error('Cannot return item with no received quantity')
      return
    }

    setReturnItems([
      ...returnItems,
      {
        materialName: poItem.materialName,
        material_id: poItem.material_id,
        quantityReturned: maxReturn,
        unit: poItem.unit,
        unitPrice: poItem.unitPrice,
        reason: 'defective',
        notes: '',
      },
    ])
  }

  const updateReturnItem = (index: number, updates: Partial<ReturnItem>) => {
    const updated = [...returnItems]
    updated[index] = { ...updated[index], ...updates }
    setReturnItems(updated)
  }

  const removeReturnItem = (index: number) => {
    setReturnItems(returnItems.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (returnItems.length === 0) {
      toast.error('Please add at least one item to return')
      return
    }
    createMutation.mutate()
  }

  const calculatedRefund = returnItems.reduce(
    (sum, item) => sum + item.quantityReturned * item.unitPrice,
    0
  )

  if (poLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!po) {
    return (
      <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
        <p className="text-destructive">Purchase order not found</p>
        <button
          onClick={() => navigate('/purchase-orders')}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
        >
          Back to POs
        </button>
      </div>
    )
  }

  const canReturnItems = po.items.filter((item) => (item.quantityReceived || 0) > 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/purchase-orders')}
            className="p-2 border border-border rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Receipt className="w-6 h-6" />
              Create Purchase Return
            </h1>
            <p className="text-muted-foreground mt-1">
              From PO: {po.poNumber}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Select Items to Return */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-muted-foreground" />
              Select Items to Return
            </h2>
            {canReturnItems.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800">
                  No items available to return. Items must have been received first.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground mb-2">
                  Click items to add them to the return:
                </p>
                {canReturnItems.map((item) => {
                  const isAdded = returnItems.some(
                    (ri) => ri.materialName === item.materialName
                  )
                  return (
                    <button
                      key={item._id}
                      type="button"
                      onClick={() => addReturnItem(item)}
                      disabled={isAdded}
                      className={cn(
                        'w-full flex items-center justify-between p-3 rounded-lg border transition-colors',
                        isAdded
                          ? 'bg-muted border-muted cursor-not-allowed'
                          : 'bg-card border-border hover:border-primary'
                      )}
                    >
                      <div>
                        <p className="font-medium text-foreground">
                          {item.materialName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Ordered: {item.quantityOrdered} | Received:{' '}
                          {item.quantityReceived || 0} {item.unit}
                        </p>
                      </div>
                      {isAdded ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <Plus className="w-5 h-5 text-muted-foreground" />
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Return Items Details */}
          {returnItems.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Return Item Details
              </h2>
              <div className="space-y-4">
                {returnItems.map((item, index) => (
                  <div
                    key={index}
                    className="border border-border rounded-lg p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-foreground">
                        {item.materialName}
                      </h3>
                      <button
                        type="button"
                        onClick={() => removeReturnItem(index)}
                        className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Quantity to Return
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={po.items.find(
                            (i) => i.materialName === item.materialName
                          )?.quantityReceived || 1}
                          value={item.quantityReturned}
                          onChange={(e) =>
                            updateReturnItem(index, {
                              quantityReturned: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Reason
                        </label>
                        <select
                          value={item.reason}
                          onChange={(e) =>
                            updateReturnItem(index, {
                              reason: e.target.value as any,
                            })
                          }
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                        >
                          {reasonOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Notes (Optional)
                      </label>
                      <input
                        type="text"
                        value={item.notes}
                        onChange={(e) =>
                          updateReturnItem(index, { notes: e.target.value })
                        }
                        placeholder="Additional details about this item..."
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              General Notes
            </h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about this return..."
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground resize-none"
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Return Info */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              Return Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Return Date *
                </label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Condition *
                </label>
                <select
                  value={condition}
                  onChange={(e) =>
                    setCondition(e.target.value as 'good' | 'damaged' | 'partial')
                  }
                  required
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                >
                  {conditionOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Carrier
                </label>
                <input
                  type="text"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  placeholder="e.g., FedEx, UPS"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Tracking Number
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Tracking number..."
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                />
              </div>
            </div>
          </div>

          {/* PO Summary */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-muted-foreground" />
              PO Summary
            </h2>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">PO Number:</span>{' '}
                <Link
                  to={`/purchase-orders/${po.id}`}
                  className="font-medium hover:underline"
                >
                  {po.poNumber}
                </Link>
              </p>
              <p>
                <span className="text-muted-foreground">Supplier:</span>{' '}
                <span className="font-medium">{po.supplier.name}</span>
              </p>
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{po.site.name}</span>
              </div>
            </div>
          </div>

          {/* Refund Summary */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Refund Summary
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Items to Return:</span>
                <span className="font-medium">{returnItems.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Quantity:</span>
                <span className="font-medium">
                  {returnItems.reduce((sum, i) => sum + i.quantityReturned, 0)}
                </span>
              </div>
              <div className="border-t border-border pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-foreground font-medium">
                    Estimated Refund:
                  </span>
                  <span className="text-lg font-bold text-foreground">
                    ${calculatedRefund.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={createMutation.isPending || returnItems.length === 0}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 font-medium"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Receipt className="w-5 h-5" />
                Create Return
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
