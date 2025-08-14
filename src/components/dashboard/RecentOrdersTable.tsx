
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, MoreHorizontal } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface RecentOrder {
  id: string
  date: string
  supplierCount: number
  totalExVat: number
  totalIncVat: number
  status: 'draft' | 'pending_approval' | 'sent' | 'acknowledged' | 'error'
}

const mockRecentOrders: RecentOrder[] = [
  {
    id: 'ORD-2024-001',
    date: '2024-08-14',
    supplierCount: 2,
    totalExVat: 125000,
    totalIncVat: 155000,
    status: 'sent'
  },
  {
    id: 'ORD-2024-002',
    date: '2024-08-13',
    supplierCount: 1,
    totalExVat: 67500,
    totalIncVat: 83700,
    status: 'acknowledged'
  },
  {
    id: 'ORD-2024-003',
    date: '2024-08-12',
    supplierCount: 3,
    totalExVat: 89200,
    totalIncVat: 110648,
    status: 'pending_approval'
  }
]

export function RecentOrdersTable() {
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
            {mockRecentOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.id}</TableCell>
                <TableCell>{new Date(order.date).toLocaleDateString('is-IS')}</TableCell>
                <TableCell>{order.supplierCount} supplier{order.supplierCount !== 1 ? 's' : ''}</TableCell>
                <TableCell className="text-right font-mono">
                  {formatPrice(order.totalExVat)}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(order.status)}>
                    {getStatusText(order.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
