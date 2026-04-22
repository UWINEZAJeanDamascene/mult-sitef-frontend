import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2, Search, Package, Power, PowerOff, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { materialsCatalogApi } from '@/api/mainManager'
import { DataTable, Column } from '@/components/DataTable'
import { ModalWrapper } from '@/components/ModalWrapper'
import { InputField, SelectField } from '@/components/FormField'
import { StatusBadge } from '@/components/StatusBadge'
import { TableSkeleton } from '@/components/Skeleton'
import { format } from '@/lib/utils'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Material } from '@/types'

const unitOptions = [
  { value: '', label: 'Select unit...', disabled: true },
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'litres', label: 'Litres' },
  { value: 'pcs', label: 'Pieces (pcs)' },
  { value: 'metres', label: 'Metres' },
  { value: 'bags', label: 'Bags' },
  { value: 'boxes', label: 'Boxes' },
  { value: 'other', label: 'Other' },
]

const materialSchema = z.object({
  name: z.string().min(1, 'Material name is required'),
  unit: z.string().min(1, 'Unit is required'),
  description: z.string().optional(),
})

type MaterialForm = z.infer<typeof materialSchema>

// Create/Edit Material Modal
function MaterialModal({
  isOpen,
  onClose,
  material,
}: {
  isOpen: boolean
  onClose: () => void
  material: Material | null
}) {
  const queryClient = useQueryClient()
  const isEditing = !!material

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MaterialForm>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      name: material?.name || '',
      unit: material?.unit || '',
      description: material?.description || '',
    },
  })

  const createMutation = useMutation({
    mutationFn: materialsCatalogApi.createMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
      toast.success('Material created successfully')
      reset()
      onClose()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to create material')
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: MaterialForm) =>
      materialsCatalogApi.updateMaterial(material!._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
      toast.success('Material updated successfully')
      reset()
      onClose()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to update material')
    },
  })

  const onSubmit = (data: MaterialForm) => {
    if (isEditing) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Material' : 'Add New Material'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <InputField
          label="Material Name"
          {...register('name')}
          error={errors.name}
          required
        />
        <SelectField
          label="Unit"
          {...register('unit')}
          options={unitOptions}
          error={errors.unit}
          required
        />
        <InputField
          label="Description (Optional)"
          {...register('description')}
          error={errors.description}
        />
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-foreground hover:bg-muted rounded-lg font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {createMutation.isPending || updateMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isEditing ? (
              'Save Changes'
            ) : (
              'Create Material'
            )}
          </button>
        </div>
      </form>
    </ModalWrapper>
  )
}

export function MaterialsCatalog() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const queryClient = useQueryClient()

  const { data: materials, isLoading } = useQuery({
    queryKey: ['materials'],
    queryFn: materialsCatalogApi.getMaterials,
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      materialsCatalogApi.toggleMaterialActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
      toast.success('Material status updated')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to update status')
    },
  })

  const filteredMaterials = useMemo(() => {
    if (!materials) return []
    if (!searchQuery) return materials
    return materials.filter(
      (m) =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.unit.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [materials, searchQuery])

  const columns: Column<Material>[] = [
    {
      key: 'name',
      header: 'Material Name',
      sortable: true,
      render: (material) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">{material.name}</p>
            {material.description && (
              <p className="text-xs text-muted-foreground line-clamp-1">
                {material.description}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'unit',
      header: 'Unit',
      sortable: true,
      render: (material) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground capitalize">
          {material.unit}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (material) => (
        <StatusBadge
          status={material.isActive ? 'active' : 'inactive'}
        />
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (material) => (
        <span className="text-sm text-muted-foreground">
          {material.createdAt ? format.date(material.createdAt) : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (material) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setEditingMaterial(material)
              setIsModalOpen(true)
            }}
            className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg"
            title="Edit material"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() =>
              toggleActiveMutation.mutate({
                id: material._id,
                isActive: !material.isActive,
              })
            }
            disabled={toggleActiveMutation.isPending}
            className={`p-2 rounded-lg ${
              material.isActive
                ? 'text-amber-600 dark:text-amber-400 hover:bg-amber-500/10'
                : 'text-green-600 dark:text-green-400 hover:bg-green-500/10'
            }`}
            title={material.isActive ? 'Deactivate' : 'Activate'}
          >
            {material.isActive ? (
              <PowerOff className="w-4 h-4" />
            ) : (
              <Power className="w-4 h-4" />
            )}
          </button>
        </div>
      ),
    },
  ]

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Materials Catalog</h1>
            <p className="text-muted-foreground mt-1">Manage master materials list</p>
          </div>
          <div className="h-10 w-32 bg-muted rounded-lg animate-pulse" />
        </div>
        <TableSkeleton rows={5} columns={5} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Materials Catalog</h1>
          <p className="text-muted-foreground mt-1">
            Manage master materials list
          </p>
        </div>
        <button
          onClick={() => {
            setEditingMaterial(null)
            setIsModalOpen(true)
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90"
        >
          <Plus className="w-5 h-5" />
          Add Material
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search materials..."
          className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Total Materials</p>
          <p className="text-2xl font-bold text-foreground">{materials?.length || 0}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Active</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {materials?.filter((m) => m.isActive !== false).length || 0}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Inactive</p>
          <p className="text-2xl font-bold text-muted-foreground">
            {materials?.filter((m) => m.isActive === false).length || 0}
          </p>
        </div>
      </div>

      {/* Materials Table */}
      <DataTable
        columns={columns}
        data={filteredMaterials}
        keyExtractor={(material) => material._id}
        searchable={false}
        emptyState={
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground">No materials found</h3>
            <p className="text-muted-foreground mt-1">
              {searchQuery
                ? 'Try adjusting your search'
                : 'Add your first material to get started'}
            </p>
          </div>
        }
      />

      {/* Modal */}
      <MaterialModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingMaterial(null)
        }}
        material={editingMaterial}
      />
    </div>
  )
}
