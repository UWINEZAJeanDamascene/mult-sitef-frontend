import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { cn } from '../lib/utils'
import { MaterialSearchDropdown } from './MaterialSearchDropdown'

interface BulkMaterialInputProps {
  onAdd: (materialName: string, material_id: string | undefined, quantity: number, quantityUsed?: number, notes?: string) => void
}

export function BulkMaterialInput({ onAdd }: BulkMaterialInputProps) {
  const [materialName, setMaterialName] = useState('')
  const [materialId, setMaterialId] = useState<string>()
  const [quantity, setQuantity] = useState('')
  const [quantityUsed, setQuantityUsed] = useState('')
  const [notes, setNotes] = useState('')

  const handleAdd = () => {
    const qty = parseFloat(quantity)
    const qtyUsed = parseFloat(quantityUsed) || 0
    if (!materialName || isNaN(qty) || qty <= 0) {
      return
    }
    if (qtyUsed > qty) {
      return
    }
    onAdd(materialName, materialId, qty, qtyUsed, notes || undefined)
    // Clear inputs
    setMaterialName('')
    setMaterialId(undefined)
    setQuantity('')
    setQuantityUsed('')
    setNotes('')
  }

  const handleMaterialSelect = (material: { id?: string; name: string }) => {
    setMaterialName(material.name)
    setMaterialId(material.id)
  }

  return (
    <div className="space-y-4 p-4 bg-muted/50 rounded-lg border border-border">
      <h3 className="text-sm font-medium text-foreground">Add Material</h3>
      
      {/* Material Selection */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Material *
        </label>
        <MaterialSearchDropdown
          value={{ id: materialId, name: materialName }}
          onChange={handleMaterialSelect}
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
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-input bg-background"
          placeholder="0.00"
        />
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
          value={quantityUsed}
          onChange={(e) => setQuantityUsed(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-input bg-background"
          placeholder="0.00"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Must not exceed quantity received ({quantity || 0})
        </p>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Notes (Optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full px-4 py-2.5 rounded-lg border border-input bg-background resize-none"
          placeholder="Add notes about this material..."
        />
      </div>

      {/* Add Button */}
      <button
        type="button"
        onClick={handleAdd}
        disabled={!materialName || !quantity || parseFloat(quantity) <= 0}
        className={cn(
          'w-full px-4 py-2.5 rounded-lg font-medium transition-colors',
          'flex items-center justify-center gap-2',
          !materialName || !quantity || parseFloat(quantity) <= 0
            ? 'bg-muted text-muted-foreground cursor-not-allowed'
            : 'bg-primary text-primary-foreground hover:bg-primary/90'
        )}
      >
        <Plus className="w-4 h-4" />
        Add to List
      </button>
    </div>
  )
}
