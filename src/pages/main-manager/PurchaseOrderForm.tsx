import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  Building2,
  Package,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  AlertCircle,
} from 'lucide-react'
import { purchaseOrderApi, sitesManagerApi, materialsCatalogApi } from '@/api/mainManager'
import { format, cn } from '@/lib/utils'
import type { POItem } from '@/types'

interface FormItem {
  id: string
  _id?: string
  materialName: string
  material_id?: string
  description?: string
  quantityOrdered: number
  quantityReceived?: number
  unitPrice: number
  unit: string
  notes?: string
}

export function PurchaseOrderForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!id

  // Form state
  const [supplier, setSupplier] = useState<{
    name: string
    contactPerson?: string
    email?: string
    phone?: string
    address?: string
  }>({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
  })
  const [siteId, setSiteId] = useState('')
  const [items, setItems] = useState<FormItem[]>([])
  const [taxRate, setTaxRate] = useState(0)
  const [notes, setNotes] = useState('')
  const [terms, setTerms] = useState('')
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch data
  const { data: sites } = useQuery({
    queryKey: ['sites'],
    queryFn: sitesManagerApi.getAllSites,
  })

  const { data: materials } = useQuery({
    queryKey: ['materials'],
    queryFn: materialsCatalogApi.getMaterials,
  })

  const { data: existingPO, isLoading: isLoadingPO } = useQuery({
    queryKey: ['purchase-order', id],
    queryFn: () => purchaseOrderApi.getById(id!),
    enabled: isEdit,
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: purchaseOrderApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      navigate('/purchase-orders')
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: any) => purchaseOrderApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-order', id] })
      navigate('/purchase-orders')
    },
  })

  // Load existing PO data
  useEffect(() => {
    if (existingPO && isEdit) {
      setSupplier(existingPO.supplier)
      setSiteId((existingPO.site as any)?._id || '')
      setItems(
        existingPO.items.map((item) => ({
          ...item,
          id: item._id || Math.random().toString(36).substr(2, 9),
        }))
      )
      setTaxRate(existingPO.taxRate)
      setNotes(existingPO.notes || '')
      setTerms(existingPO.terms || '')
      setExpectedDeliveryDate(
        existingPO.expectedDeliveryDate
          ? new Date(existingPO.expectedDeliveryDate).toISOString().split('T')[0]
          : ''
      )
    }
  }, [existingPO, isEdit])

  // Item management
  const addItem = () => {
    const newItem: FormItem = {
      id: Math.random().toString(36).substr(2, 9),
      materialName: '',
      description: '',
      quantityOrdered: 1,
      unitPrice: 0,
      unit: 'pcs',
      notes: '',
    }
    setItems([...items, newItem])
  }

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id))
  }

  const updateItem = (id: string, updates: Partial<FormItem>) => {
    setItems(
      items.map((item) => {
        if (item.id !== id) return item
        return { ...item, ...updates }
      })
    )
  }

  const selectMaterial = (itemId: string, materialId: string) => {
    const material = materials?.find((m) => m._id === materialId)
    if (material) {
      updateItem(itemId, {
        materialName: material.name,
        material_id: material._id,
        unit: material.unit,
      })
    }
  }

  // Calculations
  const subTotal = items.reduce((sum, item) => sum + (item.quantityOrdered * item.unitPrice), 0)
  const taxAmount = subTotal * (taxRate / 100)
  const total = subTotal + taxAmount

  // Validation
  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!supplier.name.trim()) {
      newErrors.supplierName = 'Supplier name is required'
    }
    if (!siteId) {
      newErrors.site = 'Site is required'
    }
    if (items.length === 0) {
      newErrors.items = 'At least one item is required'
    }
    items.forEach((item, index) => {
      if (!item.materialName.trim()) {
        newErrors[`item-${index}-name`] = 'Material name is required'
      }
      if (item.quantityOrdered <= 0) {
        newErrors[`item-${index}-qty`] = 'Quantity must be greater than 0'
      }
      if (item.unitPrice < 0) {
        newErrors[`item-${index}-price`] = 'Price cannot be negative'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    const poData = {
      supplier,
      site_id: siteId,
      items: items.map((item) => ({
        materialName: item.materialName,
        material_id: item.material_id,
        description: item.description,
        quantityOrdered: item.quantityOrdered,
        unitPrice: item.unitPrice,
        unit: item.unit,
        notes: item.notes,
      })),
      taxRate,
      notes,
      terms,
      expectedDeliveryDate,
    }

    if (isEdit) {
      updateMutation.mutate(poData)
    } else {
      createMutation.mutate(poData)
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  if (isEdit && isLoadingPO) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

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
          <h1 className="text-2xl font-bold text-foreground">
            {isEdit ? 'Edit Purchase Order' : 'Create Purchase Order'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Supplier Information */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Supplier Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Supplier Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={supplier.name}
                onChange={(e) => setSupplier({ ...supplier, name: e.target.value })}
                className={cn(
                  'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground',
                  errors.supplierName ? 'border-destructive' : 'border-input'
                )}
                placeholder="Enter supplier name"
              />
              {errors.supplierName && (
                <p className="text-sm text-destructive mt-1">{errors.supplierName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Contact Person
              </label>
              <input
                type="text"
                value={supplier.contactPerson}
                onChange={(e) => setSupplier({ ...supplier, contactPerson: e.target.value })}
                className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
                placeholder="Enter contact person"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={supplier.email}
                  onChange={(e) => setSupplier({ ...supplier, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
                  placeholder="Enter email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Phone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="tel"
                  value={supplier.phone}
                  onChange={(e) => setSupplier({ ...supplier, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
                  placeholder="Enter phone"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1">
                Address
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={supplier.address}
                  onChange={(e) => setSupplier({ ...supplier, address: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
                  placeholder="Enter address"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Information */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Delivery Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Delivery Site <span className="text-destructive">*</span>
              </label>
              <select
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                className={cn(
                  'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground',
                  errors.site ? 'border-destructive' : 'border-input'
                )}
              >
                <option value="">Select a site</option>
                {sites?.map((site) => (
                  <option key={site._id} value={site._id}>
                    {site.name} {site.location && `- ${site.location}`}
                  </option>
                ))}
              </select>
              {errors.site && <p className="text-sm text-destructive mt-1">{errors.site}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Expected Delivery Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="date"
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
                />
              </div>
            </div>
          </div>
        </div>

        {/* PO Items */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              PO Items
            </h2>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>

          {errors.items && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive">
              <AlertCircle className="w-4 h-4" />
              {errors.items}
            </div>
          )}

          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No items added. Click "Add Item" to start.
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="p-4 border border-border rounded-lg bg-muted/50"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-sm font-medium text-muted-foreground">
                      Item #{index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="p-1 hover:bg-destructive/10 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Material
                      </label>
                      {materials ? (
                        <select
                          value={item.material_id || ''}
                          onChange={(e) => selectMaterial(item.id, e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
                        >
                          <option value="">Select material...</option>
                          <option value="__custom__">-- Custom Material --</option>
                          {materials.map((m) => (
                            <option key={m._id} value={m._id}>
                              {m.name} ({m.unit})
                            </option>
                          ))}
                        </select>
                      ) : null}
                      <input
                        type="text"
                        value={item.materialName}
                        onChange={(e) => updateItem(item.id, { materialName: e.target.value })}
                        placeholder="Enter material name"
                        className={cn(
                          'w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground mt-1',
                          errors[`item-${index}-name`] ? 'border-destructive' : 'border-input'
                        )}
                      />
                      {errors[`item-${index}-name`] && (
                        <p className="text-xs text-destructive mt-1">{errors[`item-${index}-name`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.quantityOrdered}
                        onChange={(e) =>
                          updateItem(item.id, { quantityOrdered: parseFloat(e.target.value) || 0 })
                        }
                        className={cn(
                          'w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground',
                          errors[`item-${index}-qty`] ? 'border-destructive' : 'border-input'
                        )}
                      />
                      {errors[`item-${index}-qty`] && (
                        <p className="text-xs text-destructive mt-1">{errors[`item-${index}-qty`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Unit
                      </label>
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(e) => updateItem(item.id, { unit: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Unit Price
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) =>
                            updateItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })
                          }
                          className={cn(
                            'w-full pl-8 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground',
                            errors[`item-${index}-price`] ? 'border-destructive' : 'border-input'
                          )}
                        />
                      </div>
                      {errors[`item-${index}-price`] && (
                        <p className="text-xs text-destructive mt-1">{errors[`item-${index}-price`]}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(item.id, { description: e.target.value })}
                        placeholder="Optional description"
                        className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Item Total
                      </label>
                      <div className="px-3 py-2 text-sm font-medium text-foreground bg-muted rounded-lg">
                        {format.currency(item.quantityOrdered * item.unitPrice)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Terms & Conditions
                </label>
                <textarea
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
                  placeholder="Payment terms, delivery conditions, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
                  placeholder="Additional notes"
                />
              </div>
            </div>

            <div className="space-y-3 md:text-right">
              <div className="flex justify-between md:justify-end gap-4 text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium text-foreground">{format.currency(subTotal)}</span>
              </div>
              <div className="flex justify-between md:justify-end gap-4 text-sm">
                <span className="text-muted-foreground">Tax ({taxRate}%):</span>
                <span className="font-medium text-foreground">{format.currency(taxAmount)}</span>
              </div>
              <div className="flex justify-between md:justify-end gap-4 text-lg font-semibold pt-3 border-t border-border">
                <span className="text-foreground">Total:</span>
                <span className="text-primary">{format.currency(total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/purchase-orders')}
            className="px-6 py-2 text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? 'Update PO' : 'Create PO'}
          </button>
        </div>
      </form>
    </div>
  )
}
