import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Package,
  Search,
  Loader2,
  AlertCircle,
  Plus,
  TrendingDown,
  Calendar,
  Warehouse,
  ArrowRight,
} from 'lucide-react'
import { siteRecordsApi } from '@/api/sites'
import { useAuth } from '@/context/AuthContext'
import { cn, format } from '@/lib/utils'
import toast from 'react-hot-toast'

export function SiteInventory() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMaterial, setSelectedMaterial] = useState<{
    materialName: string
    siteId: string
    siteName: string
    remainingQuantity: number
  } | null>(null)
  const [usageForm, setUsageForm] = useState({
    quantityUsed: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  })

  // Fetch inventory
  const { data, isLoading, error } = useQuery({
    queryKey: ['site-inventory'],
    queryFn: siteRecordsApi.getSiteInventory,
    refetchInterval: 30000,
  })

  // Record usage mutation
  const recordUsage = useMutation({
    mutationFn: siteRecordsApi.recordUsage,
    onSuccess: (result) => {
      toast.success(`Recorded usage: ${result.quantityUsed} units used`)
      queryClient.invalidateQueries({ queryKey: ['site-inventory'] })
      queryClient.invalidateQueries({ queryKey: ['site-records'] })
      setSelectedMaterial(null)
      setUsageForm({
        quantityUsed: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to record usage')
    },
  })

  // Filter inventory by search
  const filteredInventory =
    data?.inventory?.filter(
      (item) =>
        item.materialName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.siteName.toLowerCase().includes(searchQuery.toLowerCase())
    ) || []

  // Group by site
  const groupedBySite = filteredInventory.reduce((acc, item) => {
    if (!acc[item.siteName]) {
      acc[item.siteName] = []
    }
    acc[item.siteName].push(item)
    return acc
  }, {} as Record<string, typeof filteredInventory>)

  const handleRecordUsage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMaterial) return

    const qty = parseFloat(usageForm.quantityUsed)
    if (!qty || qty <= 0) {
      toast.error('Please enter a valid quantity')
      return
    }

    if (qty > selectedMaterial.remainingQuantity) {
      toast.error(`Cannot exceed available quantity (${selectedMaterial.remainingQuantity})`)
      return
    }

    recordUsage.mutate({
      siteId: selectedMaterial.siteId,
      materialName: selectedMaterial.materialName,
      quantityUsed: qty,
      date: usageForm.date,
      notes: usageForm.notes,
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
          <h3 className="text-lg font-medium text-foreground">Failed to load inventory</h3>
          <p className="text-muted-foreground mt-1">Please try again later</p>
        </div>
      </div>
    )
  }

  // Usage Modal
  if (selectedMaterial) {
    return (
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setSelectedMaterial(null)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowRight className="w-5 h-5 rotate-180 text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Record Usage</h1>
            <p className="text-muted-foreground">
              {selectedMaterial.materialName} at {selectedMaterial.siteName}
            </p>
          </div>
        </div>

        {/* Available Info */}
        <div className="bg-card rounded-xl border border-border p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Warehouse className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Available Quantity</p>
              <p className="text-2xl font-bold text-foreground">
                {selectedMaterial.remainingQuantity}
              </p>
            </div>
          </div>
        </div>

        {/* Usage Form */}
        <form
          onSubmit={handleRecordUsage}
          className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-6"
        >
          {/* Quantity Used */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Quantity Used *
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              max={selectedMaterial.remainingQuantity}
              value={usageForm.quantityUsed}
              onChange={(e) => setUsageForm({ ...usageForm, quantityUsed: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-background"
              placeholder="0.00"
              required
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Maximum: {selectedMaterial.remainingQuantity}
            </p>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Date *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="date"
                value={usageForm.date}
                onChange={(e) => setUsageForm({ ...usageForm, date: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background"
                required
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Notes
            </label>
            <textarea
              value={usageForm.notes}
              onChange={(e) => setUsageForm({ ...usageForm, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-background resize-none"
              placeholder="Optional notes about this usage..."
            />
          </div>

          {/* Submit */}
          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={() => setSelectedMaterial(null)}
              className="flex-1 px-4 py-2.5 border border-input text-foreground rounded-lg hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={recordUsage.isPending}
              className={cn(
                'flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg',
                'hover:bg-primary/90 transition-colors',
                'flex items-center justify-center gap-2',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {recordUsage.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <TrendingDown className="w-4 h-4" />
                  Record Usage
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Site Inventory</h1>
          <p className="text-muted-foreground mt-1">
            Materials available from PO receipts - record daily usage
          </p>
        </div>
      </div>

      {/* Search */}
      <form className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search materials or sites..."
            className="w-full sm:w-96 pl-9 pr-4 py-2 rounded-lg border border-input bg-background"
          />
        </div>
      </form>

      {/* Inventory List */}
      {Object.keys(groupedBySite).length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground">
            {searchQuery ? 'No materials match your search' : 'No inventory available'}
          </h3>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            {searchQuery
              ? 'Try adjusting your search terms'
              : "Materials will appear here when PO items are received. Contact your main manager if you haven't received any materials yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedBySite).map(([siteName, items]) => (
            <div key={siteName} className="bg-card rounded-xl border border-border overflow-hidden">
              {/* Site Header */}
              <div className="px-6 py-4 bg-muted/50 border-b border-border">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Warehouse className="w-4 h-4" />
                  {siteName}
                </h3>
              </div>

              {/* Materials */}
              <div className="divide-y divide-border">
                {items.map((item) => (
                  <div
                    key={`${item.materialName}-${item.siteId}`}
                    className="px-6 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{item.materialName}</h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>Received: {item.totalReceived}</span>
                        <span>Used: {item.totalUsed}</span>
                        <span>Last: {format.date(item.lastReceivedDate)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                          {item.remainingQuantity}
                        </p>
                        <p className="text-xs text-muted-foreground">Available</p>
                      </div>
                      <button
                        onClick={() =>
                          setSelectedMaterial({
                            materialName: item.materialName,
                            siteId: item.siteId,
                            siteName: item.siteName,
                            remainingQuantity: item.remainingQuantity,
                          })
                        }
                        className={cn(
                          'px-4 py-2 bg-primary text-primary-foreground rounded-lg',
                          'hover:bg-primary/90 transition-colors',
                          'flex items-center gap-2'
                        )}
                      >
                        <Plus className="w-4 h-4" />
                        Use
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
