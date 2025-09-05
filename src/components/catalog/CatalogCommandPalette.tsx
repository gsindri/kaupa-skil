import React from 'react'
import { CommandDialog, CommandInput, CommandList, CommandEmpty } from '@/components/ui/command'
import type { FacetFilters } from '@/services/catalog'

interface CatalogCommandPaletteProps {
  onApply: (filters: Partial<FacetFilters> & { search?: string }) => void
}

export function CatalogCommandPalette({ onApply }: CatalogCommandPaletteProps) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState('')

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(o => !o)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const parseInput = React.useCallback(() => {
    const result: any = {}
    let text = value

    const tokenRegex = /(supplier|brand|category):([^\s]+)/gi
    let match
    while ((match = tokenRegex.exec(value)) !== null) {
      const [, key, val] = match
      if (key === 'supplier' || key === 'brand' || key === 'category') {
        result[key] = [...(result[key] || []), val]
      }
      text = text.replace(match[0], '')
    }
    const free = text.trim()
    if (free) result.search = free
    onApply(result)
    setOpen(false)
    setValue('')
  }, [value, onApply])

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        autoFocus
        value={value}
        onValueChange={setValue}
        placeholder="supplier:acme brand:great category:fruit"
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault()
            parseInput()
          }
        }}
      />
      <CommandList>
        <CommandEmpty>Type supplier:, brand:, category: or free text</CommandEmpty>
      </CommandList>
    </CommandDialog>
  )
}

export default CatalogCommandPalette
