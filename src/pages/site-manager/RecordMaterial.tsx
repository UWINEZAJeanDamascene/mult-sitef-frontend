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
  ChevronDown,
  Search,
  Check,
  ArrowLeft,
} from 'lucide-react'
import { siteRecordSchema, type SiteRecordFormData } from '@/lib/validations'
import { siteRecordsApi, materialsApi, sitesApi } from '@/api/sites'
import { cn } from '@/lib/utils'

// Material Search Dropdown Component
function MaterialSearchDropdown({
  value,
  onChange,
  error,
}: {
  value: { id?: string; name: string }
  onChange: (material: { id?: string; name: string }) => void
  error?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const { data: materials, isLoading } = useQuery({
    queryKey: ['materials-search', searchQuery],
    queryFn: () =>
      searchQuery.length >= 2
        ? materialsApi.searchMaterials(searchQuery)
        : materialsApi.getMaterials(),
    staleTime: 60000,
  })

  const handleSelect = (material: { _id?: string; name: string }) => {
    onChange({ id: material._id, name: material.name })
    setIsOpen(false)
    setSearchQuery('')
  }

  return (
    <div className="relative">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full px-4 py-2.5 rounded-lg border bg-background cursor-pointer',
          error ? 'border-destructive' : 'border-input'
        )}
      >
        <span className={value.name ? 'text-foreground' : 'text-muted-foreground'}>
          {value.name || 'Select or search material...'}
        </span>
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-50 w-full mt-1 bg-background rounded-lg border border-border shadow-lg max-h-60 overflow-auto">
            <div className="p-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search materials..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
              </div>
            </div>

            <div className="py-1">
              {isLoading ? (
                <div className="p-3 text-center text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1" />
                  Loading...
                </div>
              ) : materials?.length === 0 ? (
                <div className="p-3 text-center text-muted-foreground">
                  No materials found
                </div>
              ) : (
                materials?.map((material) => (
                  <button
                    key={material._id}
                    type="button"
                    onClick={() => handleSelect(material)}
                    className={cn(
                      'w-full px-4 py-2 text-left hover:bg-muted flex items-center justify-between',
                      value.id === material._id && 'bg-primary/10'
                    )}
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {material.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Unit: {material.unit}
                      </p>
                    </div>
                    {value.id === material._id && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  )
}

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

  const onSubmit = (data: SiteRecordFormData) => {
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

        {/* Material Selection */}
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

        {/* Quantity Received */}
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

        {/* Quantity Used */}
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
                'w-full pl-10 pr-4 py-2.5 rounded-lg border',
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
        </div>
      </form>
    </div>
  )
}
