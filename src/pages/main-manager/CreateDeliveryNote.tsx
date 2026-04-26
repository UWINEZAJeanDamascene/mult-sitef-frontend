import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Truck,
  Package,
  Calendar,
  Loader2,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Building2,
  User,
} from 'lucide-react'
import { purchaseOrderApi, deliveryNoteApi } from '@/api/mainManager'
import { format, cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { CreateDeliveryNoteDto } from '@/types'

const conditionOptions = [
  { value: 'good', label: 'Good - All items received in good condition', icon: CheckCircle2, color: 'text-green-600' },
  { value: 'partial', label: 'Partial - Some items missing or incomplete', icon: AlertTriangle, color: 'text-amber-600' },
  { value: 'damaged', label: 'Damaged - Items received damaged', icon: AlertCircle, color: 'text-red-600' },
]

export function CreateDeliveryNote() {
  const { poId } = useParams<{ poId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0])
  const [carrier, setCarrier] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [condition, setCondition] = useState<'good' | 'damaged' | 'partial'>('good')
  const [notes, setNotes] = useState('')
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({})
  const [itemConditions, setItemConditions] = useState<Record<string, 'good' | 'damaged' | 'partial'>>({})
  const [itemNotes, setItemNotes] = useState<Record<string, string>>({})

  const { data: po, isLoading, error } = useQuery({
    queryKey: ['purchase-order', poId],
    queryFn: () => purchaseOrderApi.getById(poId!),
    enabled: !!poId,
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateDeliveryNoteDto) => deliveryNoteApi.create(data),
    onSuccess: () => {
      toast.success('Delivery note created successfully')
      queryClient.invalidateQueries({ queryKey: ['delivery-notes'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-order', poId] })
      navigate(`/purchase-orders/${poId}`)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create delivery note')
    },
  })

  // Initialize quantities with remaining to deliver
  useState(() => {
    if (po) {
      const initialQuantities: Record<string, number> = {}
      po.items.forEach((item) => {
        const remaining = item.quantityOrdered - (item.quantityReceived || 0)
        initialQuantities[item._id || item.materialName] = remaining > 0 ? remaining : 0
      })
      setItemQuantities(initialQuantities)
    }
  })

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
          <h3 className="text-lg font-medium text-foreground">Failed to load purchase order</h3>
        </div>
      </div>
    )
  }

  // Filter items that still have quantities to receive
  const receivableItems = po.items.filter(
    (item) => item.quantityOrdered - (item.quantityReceived || 0) > 0
  )

  if (receivableItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(`/purchase-orders/${poId}`)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Create Delivery Note</h1>
            <p className="text-muted-foreground">{po.poNumber}</p>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">All Items Received</h2>
          <p className="text-muted-foreground mb-4">
            All items from this purchase order have already been received.
          </p>
          <button
            onClick={() => navigate(`/purchase-orders/${poId}`)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Back to PO
          </button>
        </div>
      </div>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate at least one item has quantity > 0
    const itemsToDeliver = receivableItems
      .map((item) => {
        const itemId = item._id || item.materialName
        const qty = itemQuantities[itemId] || 0
        if (qty <= 0) return null

        return {
          materialName: item.materialName,
          material_id: item.material_id,
          quantityOrdered: item.quantityOrdered,
          quantityDelivered: qty,
          unit: item.unit,
          unitPrice: item.unitPrice,
          condition: itemConditions[itemId] || condition,
          notes: itemNotes[itemId] || undefined,
        }
      })
      .filter(Boolean)

    if (itemsToDeliver.length === 0) {
      toast.error('Please enter at least one quantity to deliver')
      return
    }

    const data: CreateDeliveryNoteDto = {
      poId: poId!,
      items: itemsToDeliver as any,
      deliveryDate,
      carrier: carrier || undefined,
      trackingNumber: trackingNumber || undefined,
      condition,
      notes: notes || undefined,
    }

    createMutation.mutate(data)
  }

  const updateQuantity = (itemId: string, value: string) => {
    const qty = parseFloat(value) || 0
    setItemQuantities({ ...itemQuantities, [itemId]: qty })
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(`/purchase-orders/${poId}`)}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create Delivery Note</h1>
          <p className="text-muted-foreground">{po.poNumber} - {po.supplier.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* PO Summary */}
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Delivery Site</p>
              <p className="font-semibold text-foreground">{(po.site as any)?.name}</p>
              {(po.site as any)?.location && (
                <p className="text-sm text-muted-foreground">{(po.site as any)?.location}</p>
              )}
            </div>
          </div>
        </div>

        {/* Delivery Info */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary" />
            Delivery Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Delivery Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Carrier / Transport
              </label>
              <input
                type="text"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
                placeholder="e.g., DHL, FedEx, Local Transport"
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
                className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
                placeholder="Enter tracking number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Overall Condition <span className="text-red-500">*</span>
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as any)}
                className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
                required
              >
                {conditionOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-foreground mb-1">
              Delivery Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground resize-none"
              placeholder="Any additional notes about this delivery..."
            />
          </div>
        </div>

        {/* Items to Receive */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Items to Receive ({receivableItems.length})
          </h2>

          <div className="space-y-4">
            {receivableItems.map((item) => {
              const itemId = item._id || item.materialName
              const remaining = item.quantityOrdered - (item.quantityReceived || 0)
              const currentQty = itemQuantities[itemId] ?? remaining

              return (
                <div key={itemId} className="p-4 border border-border rounded-lg">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{item.materialName}</h3>
                      <p className="text-sm text-muted-foreground">
                        Ordered: {item.quantityOrdered} {item.unit} | 
                        Already received: {item.quantityReceived || 0} {item.unit} |
                        <span className="text-amber-600"> Remaining: {remaining} {item.unit}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">
                          Quantity Received
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={remaining}
                          step="0.01"
                          value={currentQty}
                          onChange={(e) => updateQuantity(itemId, e.target.value)}
                          className="w-32 px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">
                          Condition
                        </label>
                        <select
                          value={itemConditions[itemId] || condition}
                          onChange={(e) =>
                            setItemConditions({
                              ...itemConditions,
                              [itemId]: e.target.value as any,
                            })
                          }
                          className="w-32 px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
                        >
                          <option value="good">Good</option>
                          <option value="partial">Partial</option>
                          <option value="damaged">Damaged</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <input
                      type="text"
                      value={itemNotes[itemId] || ''}
                      onChange={(e) =>
                        setItemNotes({ ...itemNotes, [itemId]: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground text-sm"
                      placeholder="Item-specific notes (optional)"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(`/purchase-orders/${poId}`)}
            className="flex-1 px-4 py-2 border border-input text-foreground rounded-lg hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className={cn(
              'flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg',
              'hover:bg-primary/90 transition-colors',
              'flex items-center justify-center gap-2',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Delivery Note
          </button>
        </div>
      </form>
    </div>
  )
}
