
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useRecentOrders } from '@/hooks/useRecentOrders'

export function RecentOrdersTable() {
  const { orders, isLoading } = useRecentOrders()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('is-IS', {
      style: 'currency',
      currency: 'ISK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'acknowledged':
        return 'default'
      case 'sent':
        return 'secondary'
      case 'pending_approval':
        return 'outline'
      case 'error':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Draft'
      case 'pending_approval':
        return 'Pending Approval'
      case 'sent':
        return 'Sent'
      case 'acknowledged':
        return 'Acknowledged'
      case 'error':
        return 'Error'
      default:
        return status
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Orders</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="p-4 text-sm text-muted-foreground text-center">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground text-center">No recent orders</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Suppliers</TableHead>
                <TableHead className="text-right">Total (ex VAT)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{new Date(order.created_at).toLocaleDateString('is-IS')}</TableCell>
                  <TableCell>{order.supplier_count} supplier{order.supplier_count !== 1 ? 's' : ''}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatPrice(order.total_ex_vat)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(order.status)}>
                      {getStatusText(order.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" aria-label="View order">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
