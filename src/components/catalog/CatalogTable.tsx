import { useRef } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'

interface CatalogTableProps {
  products: any[]
  selected: string[]
  onSelect: (id: string) => void
  onSelectAll: (checked: boolean) => void
}

export function CatalogTable({ products, selected, onSelect, onSelectAll }: CatalogTableProps) {
  const rowRefs = useRef<Array<HTMLTableRowElement | null>>([])

  const allIds = products.map(p => p.catalog_id)
  const isAllSelected = allIds.length > 0 && allIds.every(id => selected.includes(id))

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTableRowElement>, index: number, id: string) => {
    if (e.key === 'ArrowDown') {
      rowRefs.current[index + 1]?.focus()
      e.preventDefault()
    } else if (e.key === 'ArrowUp') {
      rowRefs.current[index - 1]?.focus()
      e.preventDefault()
    } else if (e.key === ' ') {
      onSelect(id)
      e.preventDefault()
    }
  }

  return (
    <Table>
      <TableHeader className="sticky top-0 z-10 bg-background">
        <TableRow>
          <TableHead className="w-8">
            <Checkbox
              aria-label="Select all products"
              checked={isAllSelected}
              onCheckedChange={onSelectAll}
            />
          </TableHead>
          <TableHead className="w-16">Image</TableHead>
          <TableHead className="min-w-[200px]">Name</TableHead>
          <TableHead className="w-32">Brand</TableHead>
          <TableHead className="w-24">Pack</TableHead>
          <TableHead className="w-28">Availability</TableHead>
          <TableHead className="w-32">Suppliers</TableHead>
          <TableHead className="w-24">Price</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((p, i) => {
          const id = p.catalog_id
          const isSelected = selected.includes(id)
          return (
            <TableRow
              key={id}
              ref={el => (rowRefs.current[i] = el)}
              tabIndex={0}
              data-state={isSelected ? 'selected' : undefined}
              onKeyDown={e => handleKeyDown(e, i, id)}
              className="h-12 focus-visible:bg-muted/50"
            >
              <TableCell className="w-8 p-2">
                <Checkbox
                  aria-label={`Select ${p.name}`}
                  checked={isSelected}
                  onCheckedChange={() => onSelect(id)}
                />
              </TableCell>
              <TableCell className="w-16 p-2">
                {p.image_main && (
                  <img
                    src={p.image_main}
                    alt={p.name}
                    className="h-12 w-12 rounded object-cover"
                  />
                )}
              </TableCell>
              <TableCell
                className="min-w-[200px] max-w-[300px] p-2 font-medium truncate"
                title={p.name}
              >
                {p.name}
              </TableCell>
              <TableCell className="w-32 p-2 whitespace-nowrap">
                {p.brand || '-'}
              </TableCell>
              <TableCell className="w-24 p-2 whitespace-nowrap">
                {p.pack_size || '-'}
              </TableCell>
              <TableCell className="w-28 p-2 whitespace-nowrap">
                {p.availability || 'Unknown'}
              </TableCell>
              <TableCell className="w-32 p-2 space-x-1 whitespace-nowrap">
                {p.suppliers?.map((s: string) => (
                  <Badge key={s} variant="secondary">
                    {s}
                  </Badge>
                ))}
              </TableCell>
              <TableCell className="w-24 p-2 whitespace-nowrap">
                Connect to see price
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

