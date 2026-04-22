import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Calendar,
  Package,
  TrendingUp,
  AlertTriangle,
  Clock,
  Building2,
  User,
  DollarSign,
  FileText,
} from 'lucide-react'
import { purchaseOrderApi } from '@/api/mainManager'
import { format, cn } from '@/lib/utils'

export function PurchaseOrderReports() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'aging' | 'suppliers' | 'pending'>('aging')

  const { data: agingData, isLoading: loadingAging } = useQuery({
    queryKey: ['po-aging-report'],
    queryFn: purchaseOrderApi.getAgingReport,
    enabled: activeTab === 'aging',
  })

  const { data: supplierData, isLoading: loadingSuppliers } = useQuery({
    queryKey: ['po-supplier-report'],
    queryFn: purchaseOrderApi.getSupplierReport,
    enabled: activeTab === 'suppliers',
  })

  const { data: pendingData, isLoading: loadingPending } = useQuery({
    queryKey: ['po-pending-report'],
    queryFn: purchaseOrderApi.getPendingReport,
    enabled: activeTab === 'pending',
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/purchase-orders')}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">PO Reports</h1>
          <p className="text-muted-foreground mt-1">
            Analytics and insights for purchase orders
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab('aging')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors',
            activeTab === 'aging'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Clock className="w-4 h-4" />
          Aging Report
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors',
            activeTab === 'suppliers'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <TrendingUp className="w-4 h-4" />
          Supplier Performance
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors',
            activeTab === 'pending'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Package className="w-4 h-4" />
          Pending Deliveries
        </button>
      </div>

      {/* Aging Report */}
      {activeTab === 'aging' && (
        <div className="space-y-6">
          {/* Overdue Section */}
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-red-50/50">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Overdue POs
                {agingData?.overdue && (
                  <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-sm">
                    {agingData.overdue.length}
                  </span>
                )}
              </h2>
            </div>

            {loadingAging ? (
              <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
              </div>
            ) : agingData?.overdue?.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                No overdue purchase orders
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">PO Number</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Supplier</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Site</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Expected Delivery</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Days Overdue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {agingData?.overdue?.map((po) => (
                      <tr
                        key={po.id}
                        className="hover:bg-muted/50 cursor-pointer"
                        onClick={() => navigate(`/purchase-orders/${po.id}`)}
                      >
                        <td className="px-4 py-3 font-medium text-foreground">{po.poNumber}</td>
                        <td className="px-4 py-3">
                          <div className="text-foreground">{po.supplier.name}</div>
                          {po.supplier.contactPerson && (
                            <div className="text-sm text-muted-foreground">{po.supplier.contactPerson}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-foreground">{po.site}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {po.expectedDeliveryDate ? format.date(po.expectedDeliveryDate) : 'Not set'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                            {po.daysOverdue} days
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Approaching Delivery Section */}
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-amber-50/50">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                Approaching Delivery (Next 3 Days)
                {agingData?.approaching && (
                  <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-sm">
                    {agingData.approaching.length}
                  </span>
                )}
              </h2>
            </div>

            {loadingAging ? (
              <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
              </div>
            ) : agingData?.approaching?.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No deliveries approaching in the next 3 days
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">PO Number</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Supplier</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Site</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Expected Delivery</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Days Remaining</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {agingData?.approaching?.map((po) => (
                      <tr
                        key={po.id}
                        className="hover:bg-muted/50 cursor-pointer"
                        onClick={() => navigate(`/purchase-orders/${po.id}`)}
                      >
                        <td className="px-4 py-3 font-medium text-foreground">{po.poNumber}</td>
                        <td className="px-4 py-3">
                          <div className="text-foreground">{po.supplier.name}</div>
                          {po.supplier.contactPerson && (
                            <div className="text-sm text-muted-foreground">{po.supplier.contactPerson}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-foreground">{po.site}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {po.expectedDeliveryDate ? format.date(po.expectedDeliveryDate) : 'Not set'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                            {po.daysRemaining} days
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Supplier Performance Report */}
      {activeTab === 'suppliers' && (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          {loadingSuppliers ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            </div>
          ) : supplierData?.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-3" />
              No supplier data available
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Supplier</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Total POs</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Total Value</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Completed</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Cancelled</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Completion Rate</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Avg Delivery</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {supplierData?.map((supplier) => (
                    <tr key={supplier.supplierName} className="hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium text-foreground">{supplier.supplierName}</td>
                      <td className="px-4 py-3 text-right text-foreground">{supplier.totalPOs}</td>
                      <td className="px-4 py-3 text-right font-medium text-foreground">
                        {format.currency(supplier.totalValue)}
                      </td>
                      <td className="px-4 py-3 text-right text-green-600">{supplier.completedPOs}</td>
                      <td className="px-4 py-3 text-right text-red-600">{supplier.cancelledPOs}</td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={cn(
                            'px-2 py-1 rounded-full text-sm font-medium',
                            parseFloat(supplier.completionRate) >= 80
                              ? 'bg-green-100 text-green-700'
                              : parseFloat(supplier.completionRate) >= 50
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                          )}
                        >
                          {supplier.completionRate}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {supplier.avgDeliveryDays ? `${supplier.avgDeliveryDays} days` : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Pending Deliveries Report */}
      {activeTab === 'pending' && (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          {loadingPending ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            </div>
          ) : pendingData?.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
              No pending deliveries
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">PO Number</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Supplier</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Site</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Items</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Sent Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Expected</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pendingData?.map((po) => (
                    <tr
                      key={po.id}
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => navigate(`/purchase-orders/${po.id}`)}
                    >
                      <td className="px-4 py-3 font-medium text-foreground">{po.poNumber}</td>
                      <td className="px-4 py-3 text-foreground">{po.supplier.name}</td>
                      <td className="px-4 py-3 text-foreground">{po.site}</td>
                      <td className="px-4 py-3 text-right font-medium text-foreground">
                        {format.currency(po.totalAmount)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'px-2 py-1 rounded-full text-xs font-medium',
                            po.status === 'sent'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-amber-100 text-amber-700'
                          )}
                        >
                          {po.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {po.itemsPending} / {po.totalItems}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {po.sentDate ? format.date(po.sentDate) : '-'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {po.expectedDeliveryDate ? format.date(po.expectedDeliveryDate) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// CheckCircle icon component (not imported from lucide-react earlier)
function CheckCircle({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}
