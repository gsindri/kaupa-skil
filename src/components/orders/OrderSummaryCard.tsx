
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Send, AlertTriangle } from 'lucide-react'

interface OrderSummaryCardProps {
  itemCount: number
  totals: {
    exVat: number
    incVat: number
    vat: number
  }
  needsApproval: boolean
  approvalThreshold: number
  dispatching: boolean
  onDispatchOrders: () => void
  onClearCart: () => void
  formatPrice: (price: number) => string
}

export function OrderSummaryCard({
  itemCount,
  totals,
  needsApproval,
  approvalThreshold,
  dispatching,
  onDispatchOrders,
  onClearCart,
  formatPrice
}: OrderSummaryCardProps) {
  return (
    <>
      {/* Approval Banner */}
      {needsApproval && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div>
                <div className="font-medium text-amber-800">
                  Over your approval limit ({formatPrice(approvalThreshold)})
                </div>
                <div className="text-sm text-amber-700">
                  Request approval to proceed with this order.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5" />
            <span>Order Summary ({itemCount} items)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold font-mono tabular-nums">{formatPrice(totals.exVat)}</div>
              <div className="text-sm text-muted-foreground">Total (ex VAT)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold font-mono tabular-nums">{formatPrice(totals.vat)}</div>
              <div className="text-sm text-muted-foreground">VAT Amount</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary font-mono tabular-nums">{formatPrice(totals.incVat)}</div>
              <div className="text-sm text-muted-foreground">Total (inc VAT)</div>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClearCart}>
              Clear Cart
            </Button>
            <Button 
              onClick={onDispatchOrders}
              disabled={dispatching || needsApproval}
              className="flex-1"
            >
              {dispatching ? 'Dispatching...' : needsApproval ? 'Request Approval' : 'Dispatch Orders'}
              <Send className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
