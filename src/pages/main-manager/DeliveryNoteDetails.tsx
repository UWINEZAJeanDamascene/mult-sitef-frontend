import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Truck,
  FileText,
  Building2,
  Calendar,
  Package,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  User,
  Mail,
  Phone,
  MapPin,
  Loader2,
  AlertCircle,
  Trash2,
  Printer,
} from 'lucide-react'
import { deliveryNoteApi } from '@/api/mainManager'
import { format, cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const conditionConfig = {
  good: { label: 'Good', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  damaged: { label: 'Damaged', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
  partial: { label: 'Partial', color: 'bg-amber-100 text-amber-800', icon: XCircle },
}

export function DeliveryNoteDetails() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const { data: dn, isLoading, error } = useQuery({
    queryKey: ['delivery-note', id],
    queryFn: () => deliveryNoteApi.getById(id!),
    enabled: !!id,
  })

  const deleteMutation = useMutation({
    mutationFn: () => deliveryNoteApi.delete(id!),
    onSuccess: () => {
      toast.success('Delivery note deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['delivery-notes'] })
      window.location.href = '/delivery-notes'
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete delivery note')
    },
  })

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this delivery note?')) {
      deleteMutation.mutate()
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !dn) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
          <h3 className="text-lg font-medium text-foreground">Failed to load delivery note</h3>
        </div>
      </div>
    )
  }

  const conditionInfo = conditionConfig[dn.condition]
  const ConditionIcon = conditionInfo.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <Link
            to="/delivery-notes"
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{dn.dnNumber}</h1>
            <p className="text-muted-foreground">Delivery Note</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 border border-input rounded-lg hover:bg-muted transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 border border-destructive text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block text-center mb-8">
        <h1 className="text-3xl font-bold">DELIVERY NOTE</h1>
        <p className="text-xl">{dn.dnNumber}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* DN Info */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Truck className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">{dn.dnNumber}</h2>
                <p className="text-sm text-muted-foreground">Delivery Note</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Delivery Date</span>
                <span className="font-medium text-foreground">{format.date(dn.deliveryDate)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Condition</span>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                    conditionInfo.color
                  )}
                >
                  <ConditionIcon className="w-3 h-3" />
                  {conditionInfo.label}
                </span>
              </div>
              {dn.carrier && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Carrier</span>
                  <span className="font-medium text-foreground">{dn.carrier}</span>
                </div>
              )}
              {dn.trackingNumber && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tracking #</span>
                  <span className="font-medium text-foreground">{dn.trackingNumber}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Received By</span>
                <span className="font-medium text-foreground">{dn.receivedByName || 'Unknown'}</span>
              </div>
            </div>
          </div>

          {/* PO Reference */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Purchase Order
            </h3>
            <Link
              to={`/purchase-orders/${dn.poId}`}
              className="text-lg font-semibold text-foreground hover:text-primary hover:underline print:no-underline print:text-black"
            >
              {dn.poNumber}
            </Link>
          </div>

          {/* Supplier */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              Supplier
            </h3>
            <p className="font-semibold text-foreground">{dn.supplier.name}</p>
            {dn.supplier.contactPerson && (
              <p className="text-sm text-muted-foreground">{dn.supplier.contactPerson}</p>
            )}
            {dn.supplier.email && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Mail className="w-3 h-3" />
                {dn.supplier.email}
              </p>
            )}
            {dn.supplier.phone && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {dn.supplier.phone}
              </p>
            )}
          </div>

          {/* Site */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Delivery Site
            </h3>
            <p className="font-semibold text-foreground">{dn.site.name}</p>
            {dn.site.location && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {dn.site.location}
              </p>
            )}
          </div>

          {/* Notes */}
          {dn.notes && (
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Notes</h3>
              <p className="text-foreground whitespace-pre-wrap">{dn.notes}</p>
            </div>
          )}
        </div>

        {/* Right Column - Items */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Delivered Items ({dn.items.length})
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                      Material
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                      Ordered
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                      Delivered
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                      Unit Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                      Condition
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {dn.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{item.materialName}</div>
                        {item.notes && (
                          <div className="text-sm text-muted-foreground">{item.notes}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-foreground">
                        {item.quantityOrdered} {item.unit}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            'font-medium',
                            item.quantityDelivered >= item.quantityOrdered
                              ? 'text-green-600'
                              : 'text-amber-600'
                          )}
                        >
                          {item.quantityDelivered} {item.unit}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-foreground">
                        {format.currency(item.unitPrice)}
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">
                        {format.currency(item.quantityDelivered * item.unitPrice)}
                      </td>
                      <td className="px-6 py-4">
                        {item.condition && (
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                              conditionConfig[item.condition].color
                            )}
                          >
                            {conditionConfig[item.condition].label}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="px-6 py-4 border-t border-border bg-muted/50 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium text-foreground">
                  {format.currency(dn.subTotal || dn.items.reduce((sum, item) => sum + item.quantityDelivered * item.unitPrice, 0))}
                </span>
              </div>
              {(dn.taxRate || 0) > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Tax ({dn.taxRate}%)</span>
                  <span className="font-medium text-foreground">
                    {format.currency(dn.taxAmount || 0)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-border/50">
                <span className="text-muted-foreground font-medium">Total</span>
                <span className="text-xl font-bold text-foreground">
                  {format.currency(dn.totalAmount || dn.subTotal || dn.items.reduce((sum, item) => sum + item.quantityDelivered * item.unitPrice, 0))}
                </span>
              </div>
            </div>
          </div>

          {/* Attachments */}
          {dn.attachments && dn.attachments.length > 0 && (
            <div className="mt-6 bg-card rounded-xl border border-border p-6 shadow-sm">
              <h3 className="text-sm font-medium text-foreground mb-3">Attachments</h3>
              <div className="space-y-2">
                {dn.attachments.map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <FileText className="w-4 h-4" />
                    Attachment {index + 1}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Print Footer */}
      <div className="hidden print:block mt-8 pt-8 border-t text-center text-sm text-gray-500">
        <p>Delivery Note #{dn.dnNumber} | Generated on {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  )
}
