import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Package,
  Calendar,
  FileText,
  Loader2,
  ArrowLeft,
  Plus,
  Trash2,
} from 'lucide-react'
import { siteRecordSchema, type SiteRecordFormData } from '@/lib/validations'
import { siteRecordsApi, sitesApi } from '@/api/sites'
import { BulkMaterialInput } from '@/components/BulkMaterialInput'
import { MaterialSearchDropdown } from '@/components/MaterialSearchDropdown'
import { cn } from '@/lib/utils'

export function RecordMaterial() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Get user's sites
  const { data: mySites, isLoading: sitesLoading } = useQuery({
    queryKey: ['my-sites'],
    queryFn: sitesApi.getMySites,
  })

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    clearErrors,
    formState: { errors },
    reset,
  } = useForm<SiteRecordFormData>({
    resolver: zodResolver(siteRecordSchema),
    mode: 'onSubmit',
    defaultValues: {
      quantityReceived: undefined as any,
      quantityUsed: 0,
      date: new Date().toISOString().split('T')[0],
      notes: '',
      site_id: mySites?.[0]?._id || '',
      materialName: '',
    },
  })

  const quantityReceived = watch('quantityReceived')

  // Bulk recording state
  const [isBulkMode, setIsBulkMode] = useState(false)
  const [bulkItems, setBulkItems] = useState<Array<{
    materialName: string
    material_id?: string
    quantityReceived: number
    quantityUsed: number
    notes?: string
  }>>([])

  // Set site_id when sites are loaded (for single site case)
  useEffect(() => {
    if (mySites && mySites.length > 0 && !watch('site_id')) {
      setValue('site_id', mySites[0]._id)
    }
  }, [mySites, setValue, watch])

  const { mutate: createRecord, isPending: isSubmitting } = useMutation({
    mutationFn: siteRecordsApi.createSiteRecord,
    onMutate: async (newRecord) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['site-records'] })
      await queryClient.cancelQueries({ queryKey: ['site-dashboard-stats'] })

      // Snapshot previous value
      const previousRecords = queryClient.getQueryData(['site-records'])

      // Optimistically update
      queryClient.setQueryData(['site-records'], (old: any) => {
        return {
          ...old,
          records: [
            {
              ...newRecord,
              _id: 'temp-' + Date.now(),
              createdAt: new Date().toISOString(),
              syncedToMainStock: false,
            },
            ...(old?.records || []),
          ],
        }
      })

      return { previousRecords }
    },
    onSuccess: () => {
      toast.success('Material recorded successfully!')
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['site-records'] })
      queryClient.invalidateQueries({ queryKey: ['site-dashboard-stats'] })
      reset()
      navigate('/received')
    },
    onError: (error: any, _variables, context) => {
      // Rollback on error
      if (context?.previousRecords) {
        queryClient.setQueryData(['site-records'], context.previousRecords)
      }
      toast.error(error.message || 'Failed to record material')
    },
  })

  // Bulk create mutation
  const { mutate: createBulkRecords, isPending: isBulkSubmitting } = useMutation({
    mutationFn: siteRecordsApi.createMultipleSiteRecords,
    onSuccess: () => {
      toast.success(`${bulkItems.length} materials recorded successfully!`)
      queryClient.invalidateQueries({ queryKey: ['site-records'] })
      queryClient.invalidateQueries({ queryKey: ['site-dashboard-stats'] })
      setBulkItems([])
      reset()
      navigate('/received')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to record materials')
    },
  })

  const onSubmit = (data: SiteRecordFormData) => {
    if (isBulkMode) {
      // In bulk mode, submit all items at once
      if (bulkItems.length === 0) {
        toast.error('Please add at least one material')
        return
      }
      const records = bulkItems.map(item => ({
        site_id: data.site_id,
        material_id: item.material_id,
        materialName: item.materialName,
        quantityReceived: item.quantityReceived,
        quantityUsed: item.quantityUsed || 0,
        date: data.date,
        notes: item.notes || data.notes,
      }))
      createBulkRecords(records)
    } else {
      // Single mode
      createRecord({
        site_id: data.site_id,
        material_id: data.material_id,
        materialName: data.materialName,
        quantityReceived: data.quantityReceived,
        quantityUsed: data.quantityUsed,
        date: data.date,
        notes: data.notes,
      })
    }
  }

  // Add item to bulk list
  const addBulkItem = (materialName: string, material_id?: string, quantity: number = 0, quantityUsed: number = 0, notes?: string) => {
    if (!materialName || quantity <= 0) {
      toast.error('Please enter material name and quantity')
      return
    }
    setBulkItems([...bulkItems, { materialName, material_id, quantityReceived: quantity, quantityUsed, notes }])
  }

  // Remove item from bulk list
  const removeBulkItem = (index: number) => {
    setBulkItems(bulkItems.filter((_, i) => i !== index))
  }

  // Handle bulk submit directly (bypasses form validation)
  const handleBulkSubmit = () => {
    const site_id = watch('site_id')
    const date = watch('date')
    const notes = watch('notes')

    if (bulkItems.length === 0) {
      toast.error('Please add at least one material')
      return
    }

    const records = bulkItems.map(item => ({
      site_id,
      material_id: item.material_id,
      materialName: item.materialName,
      quantityReceived: item.quantityReceived,
      quantityUsed: item.quantityUsed || 0,
      date,
      notes: item.notes || notes,
    }))

    createBulkRecords(records)
  }

  if (sitesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!mySites || mySites.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground">No Sites Assigned</h2>
        <p className="text-muted-foreground mt-2">
          You don't have any sites assigned. Contact your administrator.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Record Material</h1>
          <p className="text-muted-foreground">Log materials received or used at your site</p>
        </div>
      </div>

      {/* Recording Mode Toggle */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-2 mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => {
            setIsBulkMode(false)
            clearErrors(['materialName', 'quantityReceived', 'quantityUsed'])
          }}
          className={cn(
            'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            !isBulkMode
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted'
          )}
        >
          Single Record
        </button>
        <button
          type="button"
          onClick={() => {
            setIsBulkMode(true)
            clearErrors(['materialName', 'quantityReceived', 'quantityUsed'])
            reset({ materialName: '', quantityReceived: 0, quantityUsed: 0 })
          }}
          className={cn(
            'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            isBulkMode
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted'
          )}
        >
          Multiple Records
        </button>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-6"
      >
        {/* Site Selection */}
        {mySites.length > 1 && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Site *
            </label>
            <select
              {...register('site_id')}
              className={cn(
                'w-full px-4 py-2.5 rounded-lg border bg-background',
                errors.site_id ? 'border-destructive' : 'border-input'
              )}
            >
              <option value="">Select a site...</option>
              {mySites.map((site) => (
                <option key={site._id} value={site._id}>
                  {site.name}
                </option>
              ))}
            </select>
            {errors.site_id && (
              <p className="mt-1 text-sm text-destructive">{errors.site_id.message}</p>
            )}
          </div>
        )}

        {/* Material Selection - Single Mode Only */}
        {!isBulkMode && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Material *
            </label>
            <Controller
              name="materialName"
              control={control}
              render={({ field }) => (
                <MaterialSearchDropdown
                  value={{ id: field.value, name: field.value }}
                  onChange={(material) => {
                    field.onChange(material.name)
                  }}
                  error={errors.materialName?.message}
                />
              )}
            />
          </div>
        )}

        {/* Quantity Received - Single Mode Only */}
        {!isBulkMode && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Quantity Received *
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              {...register('quantityReceived')}
              className={cn(
                'w-full px-4 py-2.5 rounded-lg border bg-background',
                errors.quantityReceived ? 'border-destructive' : 'border-input'
              )}
              placeholder="0.00"
            />
            {errors.quantityReceived && (
              <p className="mt-1 text-sm text-destructive">
                {errors.quantityReceived.message}
              </p>
            )}
          </div>
        )}

        {/* Quantity Used - Single Mode Only */}
        {!isBulkMode && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Quantity Used (Optional)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              {...register('quantityUsed')}
              className={cn(
                'w-full px-4 py-2.5 rounded-lg border bg-background',
                errors.quantityUsed ? 'border-destructive' : 'border-input'
              )}
              placeholder="0.00"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Must not exceed quantity received ({quantityReceived || 0})
            </p>
            {errors.quantityUsed && (
              <p className="mt-1 text-sm text-destructive">
                {errors.quantityUsed.message}
              </p>
            )}
          </div>
        )}

        {/* Bulk Recording UI */}
        {isBulkMode && (
          <BulkMaterialInput onAdd={addBulkItem} />
        )}

        {/* Bulk Items List */}
        {isBulkMode && bulkItems.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">
              Materials to Record ({bulkItems.length})
            </h3>
            <div className="space-y-2">
              {bulkItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {item.materialName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Received: {item.quantityReceived}
                      {item.quantityUsed > 0 && ` | Used: ${item.quantityUsed}`}
                    </p>
                    {item.notes && (
                      <p className="text-xs text-muted-foreground truncate">
                        {item.notes}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeBulkItem(index)}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Date *
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="date"
              {...register('date')}
              className={cn(
                'w-full pl-10 pr-4 py-2.5 rounded-lg border bg-background',
                errors.date ? 'border-destructive' : 'border-input'
              )}
            />
          </div>
          {errors.date && (
            <p className="mt-1 text-sm text-destructive">{errors.date.message}</p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Notes
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input resize-none bg-background"
              placeholder="Any additional information..."
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 flex gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 px-4 py-2.5 border border-input text-foreground rounded-lg hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          {isBulkMode ? (
            <button
              type="button"
              onClick={handleBulkSubmit}
              disabled={isBulkSubmitting || bulkItems.length === 0}
              className={cn(
                'flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg',
                'hover:bg-primary/90 transition-colors',
                'flex items-center justify-center gap-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'cursor-pointer'
              )}
            >
              {isBulkSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Recording...
                </>
              ) : (
                `Record ${bulkItems.length} Material${bulkItems.length !== 1 ? 's' : ''}`
              )}
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                'flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg',
                'hover:bg-primary/90 transition-colors',
                'flex items-center justify-center gap-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'cursor-pointer'
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Recording...
                </>
              ) : (
                'Record Material'
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
