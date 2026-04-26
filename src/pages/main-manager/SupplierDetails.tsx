import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Loader2,
  AlertCircle,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  FileText,
  Package,
  Clock,
  Send,
  ChevronRight,
  Plus,
} from 'lucide-react'
import { supplierApi, purchaseOrderApi } from '@/api/mainManager'
import { format, cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Supplier, CreateSupplierDto } from '@/types'

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: Clock },
  sent: { label: 'Sent', color: 'bg-blue-100 text-blue-800', icon: Send },
  partial: { label: 'Partial', color: 'bg-amber-100 text-amber-800', icon: Package },
  received: { label: 'Received', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  completed: { label: 'Completed', color: 'bg-purple-100 text-purple-800', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle },
}

interface EditFormProps {
  supplier: Supplier
  onSubmit: (data: CreateSupplierDto) => void
  onCancel: () => void
  isSubmitting: boolean
}

function EditForm({ supplier, onSubmit, onCancel, isSubmitting }: EditFormProps) {
  const [formData, setFormData] = useState<CreateSupplierDto>({
    name: supplier.name,
    contactPerson: supplier.contactPerson || '',
    email: supplier.email || '',
    phone: supplier.phone || '',
    address: supplier.address || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Supplier name is required')
      return
    }
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Supplier Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Contact Person
        </label>
        <input
          type="text"
          value={formData.contactPerson}
          onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
          className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Phone
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Address
        </label>
        <textarea
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          rows={3}
          className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground resize-none"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-input text-foreground rounded-lg hover:bg-muted transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            'flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg',
            'hover:bg-primary/90 transition-colors',
            'flex items-center justify-center gap-2',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          Save Changes
        </button>
      </div>
    </form>
  )
}

export function SupplierDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)

  const { data: supplier, isLoading: isLoadingSupplier, error: supplierError } = useQuery({
    queryKey: ['supplier', id],
    queryFn: () => supplierApi.getById(id!),
    enabled: !!id,
  })

  const { data: allPOs, isLoading: isLoadingPOs } = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: () => purchaseOrderApi.getAll({ limit: 1000 }),
  })

  const updateMutation = useMutation({
    mutationFn: (data: CreateSupplierDto) => supplierApi.update(id!, data),
    onSuccess: () => {
      toast.success('Supplier updated successfully')
      queryClient.invalidateQueries({ queryKey: ['supplier', id] })
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      setIsEditing(false)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update supplier')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => supplierApi.delete(id!),
    onSuccess: () => {
      toast.success('Supplier deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      navigate('/suppliers')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete supplier')
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: (isActive: boolean) => supplierApi.toggleActive(id!, isActive),
    onSuccess: () => {
      toast.success('Supplier status updated')
      queryClient.invalidateQueries({ queryKey: ['supplier', id] })
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update status')
    },
  })

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this supplier?')) {
      deleteMutation.mutate()
    }
  }

  const handleUpdate = (data: CreateSupplierDto) => {
    updateMutation.mutate(data)
  }

  // Filter POs for this supplier
  const supplierPOs = allPOs?.records?.filter(
    (po) => po.supplier.name.toLowerCase() === supplier?.name.toLowerCase()
  ) || []

  const totalPOValue = supplierPOs.reduce((sum, po) => sum + po.totalAmount, 0)
  const activePOs = supplierPOs.filter((po) => ['draft', 'sent', 'partial'].includes(po.status))
  const completedPOs = supplierPOs.filter((po) => ['received', 'completed'].includes(po.status))

  if (isLoadingSupplier) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (supplierError || !supplier) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
          <h3 className="text-lg font-medium text-foreground">Failed to load supplier</h3>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/suppliers')}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{supplier.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                  supplier.isActive
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                    : 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400'
                )}
              >
                {supplier.isActive ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    Active
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3" />
                    Inactive
                  </>
                )}
              </span>
              <span className="text-sm text-muted-foreground">
                Created {format.date(supplier.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleActiveMutation.mutate(!supplier.isActive)}
            disabled={toggleActiveMutation.isPending}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
              supplier.isActive
                ? 'border border-input hover:bg-muted text-foreground'
                : 'bg-green-600 text-white hover:bg-green-700'
            )}
          >
            {supplier.isActive ? (
              <>
                <XCircle className="w-4 h-4" />
                Deactivate
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Activate
              </>
            )}
          </button>
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 border border-input rounded-lg hover:bg-muted transition-colors"
          >
            <Edit className="w-4 h-4" />
            Edit
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Supplier Info */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            {isEditing ? (
              <EditForm
                supplier={supplier}
                onSubmit={handleUpdate}
                onCancel={() => setIsEditing(false)}
                isSubmitting={updateMutation.isPending}
              />
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{supplier.name}</h2>
                    <p className="text-sm text-muted-foreground">Supplier</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {supplier.contactPerson && (
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Contact Person</p>
                        <p className="font-medium text-foreground">{supplier.contactPerson}</p>
                      </div>
                    </div>
                  )}

                  {supplier.email && (
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <a
                          href={`mailto:${supplier.email}`}
                          className="font-medium text-foreground hover:text-primary"
                        >
                          {supplier.email}
                        </a>
                      </div>
                    </div>
                  )}

                  {supplier.phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <a
                          href={`tel:${supplier.phone}`}
                          className="font-medium text-foreground hover:text-primary"
                        >
                          {supplier.phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {supplier.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Address</p>
                        <p className="font-medium text-foreground">{supplier.address}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Last updated: {format.date(supplier.updatedAt)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats & POs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
              <p className="text-sm text-muted-foreground">Total POs</p>
              <p className="text-2xl font-bold text-foreground mt-1">{supplierPOs.length}</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
              <p className="text-sm text-muted-foreground">Active POs</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{activePOs.length}</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="text-2xl font-bold text-primary mt-1">{format.currency(totalPOValue)}</p>
            </div>
          </div>

          {/* Purchase Orders */}
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Purchase Orders
              </h2>
            </div>

            {isLoadingPOs ? (
              <div className="px-6 py-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
              </div>
            ) : supplierPOs.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-medium text-foreground">No purchase orders</h3>
                <p className="text-muted-foreground mt-1">
                  No POs have been created for this supplier yet.
                </p>
                <Link
                  to="/purchase-orders/new"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create PO
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                        PO Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                        Items
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {supplierPOs.map((po) => {
                      const statusInfo = statusConfig[po.status]
                      const StatusIcon = statusInfo.icon

                      return (
                        <tr key={po.id} className="hover:bg-muted/50">
                          <td className="px-6 py-4">
                            <div className="font-medium text-foreground">{po.poNumber}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                                statusInfo.color
                              )}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-foreground">{po.items.length}</td>
                          <td className="px-6 py-4 font-medium text-foreground">
                            {format.currency(po.totalAmount)}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {format.date(po.createdAt)}
                          </td>
                          <td className="px-6 py-4">
                            <Link
                              to={`/purchase-orders/${po.id}`}
                              className="inline-flex items-center gap-1 text-primary hover:underline"
                            >
                              View
                              <ChevronRight className="w-4 h-4" />
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
