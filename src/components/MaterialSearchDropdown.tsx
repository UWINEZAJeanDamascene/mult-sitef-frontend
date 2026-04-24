import { useState, useEffect, useRef } from 'react'
import { Search } from 'lucide-react'
import { cn } from '../lib/utils'
import { materialsApi } from '../api/sites'
import { useQuery } from '@tanstack/react-query'
import type { Material } from '../types'

interface MaterialSearchDropdownProps {
  value: { id?: string; name: string }
  onChange: (material: { id?: string; name: string }) => void
  error?: string
}

export function MaterialSearchDropdown({
  value,
  onChange,
  error,
}: MaterialSearchDropdownProps) {
  const [searchQuery, setSearchQuery] = useState(value.name || '')
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { data: materials, isLoading } = useQuery<Material[]>({
    queryKey: ['materials-search', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 1) return []
      return await materialsApi.searchMaterials(searchQuery)
    },
    enabled: isOpen && searchQuery.length > 0,
  })

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    onChange({ name: e.target.value })
    setIsOpen(true)
  }

  const handleSelect = (material: { id: string; name: string }) => {
    setSearchQuery(material.name)
    onChange(material)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder="Search materials..."
          className={cn(
            'w-full pl-10 pr-4 py-2.5 rounded-lg border bg-background',
            error ? 'border-destructive' : 'border-input'
          )}
        />
      </div>

      {error && (
        <p className="mt-1 text-sm text-destructive">{error}</p>
      )}

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-60 overflow-auto">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              Searching...
            </div>
          ) : materials && materials.length > 0 ? (
            materials.map((material: Material) => (
              <button
                key={material._id}
                type="button"
                onClick={() => handleSelect({ id: material._id, name: material.name })}
                className="w-full px-4 py-2 text-left hover:bg-muted transition-colors"
              >
                <p className="font-medium">{material.name}</p>
                <p className="text-sm text-muted-foreground">Unit: {material.unit}</p>
              </button>
            ))
          ) : searchQuery.length > 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              Use &quot;{searchQuery}&quot; as custom material
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              Type to search materials
            </div>
          )}
        </div>
      )}
    </div>
  )
}
