import { useUnmatchedProducts } from '@/hooks/useUnmatchedProducts'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'

export function UnmatchedProductsTable() {
  const { data = [], isLoading } = useUnmatchedProducts()

  if (isLoading) {
    return <p>Loading...</p>
  }

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No unmatched products</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Supplier ID</TableHead>
          <TableHead>SKU</TableHead>
          <TableHead>Raw Name</TableHead>
          <TableHead>Attempted Match</TableHead>
          <TableHead>Inserted</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map(item => (
          <TableRow key={item.unmatched_id}>
            <TableCell>{item.supplier_id}</TableCell>
            <TableCell>{item.supplier_sku}</TableCell>
            <TableCell>{item.raw_name}</TableCell>
            <TableCell>{item.attempted_match || '-'}</TableCell>
            <TableCell>{new Date(item.inserted_at).toLocaleString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
