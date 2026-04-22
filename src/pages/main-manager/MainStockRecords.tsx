import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import {
  Search,
  Filter,
  Plus,
  Edit2,
  History,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Package,
  Building2,
  CheckCircle,
} from 'lucide-react'
import { mainStockApi } from '@/api/mainManager'
import { materialsApi } from '@/api/sites'
import { cn, format } from '@/lib/utils'
import { z } from 'zod'

const ITEMS_PER_PAGE = 10

const directRecordSchema = z.object({
  materialName: z.string().min(1, 'Material is required'),
  material_id: z.string().optional(),
  quantityReceived: z.coerce.number().positive('Must be greater than 0'),
  quantityUsed: z.coerce.number().min(0, 'Cannot be negative').default(0),
  price: z.coerce.number().positive('Price must be greater than 0'),
  date: z.string().min(1, 'Date is required'),
  notes: z.string().optional(),
})

type DirectRecordFormData = z.infer<typeof directRecordSchema>

// Inline Price Edit Component
function InlinePriceEdit({
  recordId,
  currentPrice,
  onSave,
  isPending,
}: {
  recordId: string
  currentPrice?: number | null
  onSave: (id: string, price: number) => void
  isPending: boolean
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [price, setPrice] = useState(currentPrice?.toString() || '')

  const handleSave = () => {
    const numPrice = parseFloat(price)
    if (isNaN(numPrice) || numPrice <= 0) {
      toast.error('Please enter a valid price')
      return
    }
    onSave(recordId, numPrice)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-24 px-2 py-1 text-sm border border-input rounded bg-background"
          autoFocus
          step="0.01"
        />
        <button
          onClick={handleSave}
          disabled={isPending}
          className="p-1 text-green-600 dark:text-green-400 hover:bg-green-500/10 rounded"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : '✓'}
        </button>
        <button
          onClick={() => {
            setIsEditing(false)
            setPrice(currentPrice?.toString() || '')
          }}
          className="p-1 text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="flex items-center gap-1 text-sm text-primary hover:text-primary/80"
    >
      {currentPrice ? format.currency(currentPrice) : 'Set price'}
      <Edit2 className="w-3 h-3" />
    </button>
  )
}

// Movement History Drawer
function MovementHistoryDrawer({
  recordId,
  isOpen,
  onClose,
}: {
  recordId: string | null
  isOpen: boolean
  onClose: () => void
}) {
  const { data: movements, isLoading } = useQuery({
    queryKey: ['stock-movements', recordId],
    queryFn: () => mainStockApi.getStockMovements(recordId!),
    enabled: !!recordId,
  })

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 h-full w-96 bg-card shadow-xl z-50 overflow-y-auto">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-semibold text-card-foreground">
            Movement History
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : movements?.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No movement history found
            </p>
          ) : (
            <div className="space-y-4">
              {movements?.map((movement) => (
                <div
                  key={movement._id}
                  className="p-4 bg-muted rounded-lg border border-border"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={cn(
                        'px-2 py-1 rounded text-xs font-medium',
                        movement.type === 'received' && 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
                        movement.type === 'used' && 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
                        movement.type === 'price_update' && 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                      )}
                    >
                      {movement.type.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {format.datetime(movement.createdAt)}
                    </span>
                  </div>
                  {movement.quantity && (
                    <p className="text-sm text-foreground">
                      Quantity: {format.number(movement.quantity, 2)}
                    </p>
                  )}
                  {movement.newPrice && (
                    <p className="text-sm text-foreground">
                      Price: {format.currency(movement.newPrice)}
                    </p>
                  )}
                  {movement.notes && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {movement.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// Add Direct Record Modal
function AddDirectRecordModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')

  const { data: materials } = useQuery({
    queryKey: ['materials-search', searchQuery],
    queryFn: () =>
      searchQuery.length >= 2
        ? materialsApi.searchMaterials(searchQuery)
        : materialsApi.getMaterials(),
    staleTime: 60000,
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DirectRecordFormData>({
    resolver: zodResolver(directRecordSchema),
    defaultValues: {
      quantityReceived: 0,
      quantityUsed: 0,
      price: 0,
      date: new Date().toISOString().split('T')[0],
    },
  })

  const createMutation = useMutation({
    mutationFn: mainStockApi.createDirectRecord,
    onSuccess: () => {
      toast.success('Direct record created successfully')
      queryClient.invalidateQueries({ queryKey: ['main-stock-records'] })
      reset()
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create record')
    },
  })

  const onSubmit = (data: DirectRecordFormData) => {
    createMutation.mutate(data)
  }

  const materialName = watch('materialName')

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-card rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h3 className="text-lg font-semibold text-card-foreground">
              Add Direct Record
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
            {/* Material Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Material *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={materialName || ''}
                  onChange={(e) => {
                    setValue('materialName', e.target.value)
                    setSearchQuery(e.target.value)
                  }}
                  placeholder="Search or type material name..."
                  className={cn(
                    'w-full px-4 py-2 border rounded-lg bg-background',
                    errors.materialName ? 'border-destructive' : 'border-input'
                  )}
                />
                {materials && materials.length > 0 && searchQuery && (
                  <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-48 overflow-auto">
                    {materials.map((m) => (
                      <button
                        key={m._id}
                        type="button"
                        onClick={() => {
                          setValue('materialName', m.name)
                          setValue('material_id', m._id)
                          setSearchQuery('')
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-muted"
                      >
                        <p className="font-medium text-foreground">{m.name}</p>
                        <p className="text-sm text-muted-foreground">{m.unit}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {errors.materialName && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.materialName.message}
                </p>
              )}
            </div>

            {/* Quantities */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Qty Received *
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('quantityReceived')}
                  className={cn(
                    'w-full px-4 py-2 border rounded-lg bg-background',
                    errors.quantityReceived ? 'border-destructive' : 'border-input'
                  )}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Qty Used
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('quantityUsed')}
                  className="w-full px-4 py-2 border border-input rounded-lg bg-background"
                />
              </div>
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Price *
              </label>
              <input
                type="number"
                step="0.01"
                {...register('price')}
                className={cn(
                  'w-full px-4 py-2 border rounded-lg bg-background',
                  errors.price ? 'border-destructive' : 'border-input'
                )}
              />
              {errors.price && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.price.message}
                </p>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Date *
              </label>
              <input
                type="date"
                {...register('date')}
                className="w-full px-4 py-2 border border-input rounded-lg bg-background"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Notes
              </label>
              <textarea
                {...register('notes')}
                rows={2}
                className="w-full px-4 py-2 border border-input rounded-lg resize-none bg-background"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-input text-foreground rounded-lg hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || createMutation.isPending}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                {createMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  'Create Record'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

export function MainStockRecords() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [sourceFilter, setSourceFilter] = useState<'all' | 'site' | 'direct'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending_price' | 'priced' | 'direct'>('all')
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' })
  const [showFilters, setShowFilters] = useState(false)
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingPriceRecordId, setEditingPriceRecordId] = useState<string | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: [
      'main-stock-records',
      page,
      searchQuery,
      sourceFilter,
      statusFilter,
      dateRange,
    ],
    queryFn: () =>
      mainStockApi.getRecords({
        page,
        limit: ITEMS_PER_PAGE,
        source: sourceFilter,
        status: statusFilter,
        materialName: searchQuery,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      }),
  })

  const updatePriceMutation = useMutation({
    mutationFn: ({ id, price }: { id: string; price: number }) =>
      mainStockApi.updatePrice(id, price),
    onSuccess: () => {
      toast.success('Price updated successfully')
      queryClient.invalidateQueries({ queryKey: ['main-stock-records'] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update price')
    },
  })

  const handlePriceUpdate = (id: string, price: number) => {
    updatePriceMutation.mutate({ id, price })
  }

  const markAsReceivedMutation = useMutation({
    mutationFn: (id: string) => mainStockApi.markAsReceived(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['main-stock'] })
      toast.success('Record marked as received')
    },
    onError: () => {
      toast.error('Failed to mark as received')
    },
  })

  const handleMarkReceived = (id: string) => {
    markAsReceivedMutation.mutate(id)
  }

  const handleViewHistory = (recordId: string) => {
    setSelectedRecordId(recordId)
    setIsHistoryOpen(true)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSourceFilter('all')
    setStatusFilter('all')
    setDateRange({ startDate: '', endDate: '' })
    setPage(1)
  }

  const records = data?.records || []
  const totalPages = data?.totalPages || 1

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
          <h3 className="text-lg font-medium text-foreground">Failed to load records</h3>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Main Stock Records</h1>
          <p className="text-muted-foreground mt-1">
            Manage all stock records across sites and direct entries
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          Add Direct Record
        </button>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search materials..."
                className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-background text-foreground"
              />
            </div>
          </div>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value as any)}
            className="px-4 py-2 border border-input rounded-lg bg-background text-foreground"
          >
            <option value="all">All Sources</option>
            <option value="site">Site Only</option>
            <option value="direct">Direct Only</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border border-input rounded-lg bg-background text-foreground"
          >
            <option value="all">All Statuses</option>
            <option value="pending_price">Pending Price</option>
            <option value="priced">Priced</option>
            <option value="direct">Direct</option>
          </select>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 border rounded-lg',
              showFilters
                ? 'bg-primary/10 border-primary/50 text-primary'
                : 'border-input hover:bg-muted text-foreground'
            )}
          >
            <Filter className="w-4 h-4" />
            Date
          </button>

          {(searchQuery || sourceFilter !== 'all' || statusFilter !== 'all' || dateRange.startDate) && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-border flex gap-4">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="px-4 py-2 border border-input rounded-lg bg-background"
              placeholder="From"
            />
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="px-4 py-2 border border-input rounded-lg bg-background"
              placeholder="To"
            />
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Material</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Source</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Qty Rcvd</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Qty Used</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Price</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Total Value</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {records.map((record) => (
                <tr key={record._id} className="hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium text-foreground">{record.materialName}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {record.source === 'site' ? (
                        <>
                          <Building2 className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Site</span>
                        </>
                      ) : (
                        <>
                          <Package className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Direct</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">
                    {format.number(record.quantityReceived, 2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">
                    {format.number(record.quantityUsed, 2)}
                  </td>
                  <td className="px-4 py-3">
                    {record.status === 'pending_price' ? (
                      <InlinePriceEdit
                        recordId={record._id}
                        currentPrice={record.price}
                        onSave={handlePriceUpdate}
                        isPending={updatePriceMutation.isPending}
                      />
                    ) : (
                      <span className="text-sm text-foreground">
                        {record.price ? format.currency(record.price) : '-'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">
                    {record.totalValue ? format.currency(record.totalValue) : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {format.date(record.date)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        record.status === 'pending_price' && 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
                        record.status === 'priced' && 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
                        record.status === 'direct' && 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                      )}
                    >
                      {record.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewHistory(record._id)}
                        className="p-1 text-muted-foreground hover:text-primary"
                        title="View history"
                      >
                        <History className="w-4 h-4" />
                      </button>
                      {record.status === 'pending_price' && (
                        <>
                          {editingPriceRecordId === record._id ? (
                            <InlinePriceEdit
                              recordId={record._id}
                              currentPrice={record.price}
                              onSave={(id, price) => {
                                handlePriceUpdate(id, price)
                                setEditingPriceRecordId(null)
                              }}
                              isPending={updatePriceMutation.isPending}
                            />
                          ) : (
                            <button
                              onClick={() => setEditingPriceRecordId(record._id)}
                              className="p-1 text-muted-foreground hover:text-green-600 dark:hover:text-green-400"
                              title="Edit price"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                      {record.status === 'direct' && (
                        <button
                          onClick={() => handleMarkReceived(record._id)}
                          className="p-1 text-muted-foreground hover:text-green-600 dark:hover:text-green-400"
                          title="Mark as received"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <MovementHistoryDrawer
        recordId={selectedRecordId}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
      <AddDirectRecordModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  )
}
