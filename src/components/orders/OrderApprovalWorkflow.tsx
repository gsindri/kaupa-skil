
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react'
import type { DeliveryCalculation } from '@/lib/types/delivery'

interface OrderApprovalWorkflowProps {
  calculations: DeliveryCalculation[]
  onApprove: (reason?: string) => void
  onReject: (reason: string) => void
  isSubmitting?: boolean
}

export function OrderApprovalWorkflow({ 
  calculations, 
  onApprove, 
  onReject, 
  isSubmitting = false 
}: OrderApprovalWorkflowProps) {
  const [reason, setReason] = useState('')
  const [showReason, setShowReason] = useState(false)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('is-IS', {
      style: 'currency',
      currency: 'ISK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const totalDeliveryFees = calculations.reduce((sum, calc) => sum + calc.total_delivery_cost, 0)
  const suppliersWithFees = calculations.filter(calc => calc.total_delivery_cost > 0)
  const isHighCost = totalDeliveryFees > 10000 // More than ISK 10,000 in delivery fees

  if (!isHighCost && suppliersWithFees.length <= 1) {
    return null // No approval needed for low-cost or single-supplier orders
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          <CardTitle className="text-orange-800">Order Approval Required</CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-orange-700">
            This order has been flagged for review due to:
          </p>
          
          <ul className="text-sm text-orange-700 space-y-1 ml-4">
            {isHighCost && (
              <li>• High delivery costs: {formatPrice(totalDeliveryFees)}</li>
            )}
            {suppliersWithFees.length > 1 && (
              <li>• Multiple suppliers with delivery fees ({suppliersWithFees.length} suppliers)</li>
            )}
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-orange-800">Delivery Fee Breakdown:</h4>
          {suppliersWithFees.map(calc => (
            <div key={calc.supplier_id} className="flex justify-between items-center p-2 bg-white rounded">
              <span className="text-sm">{calc.supplier_name}</span>
              <Badge variant="outline" className="text-orange-600">
                {formatPrice(calc.total_delivery_cost)}
              </Badge>
            </div>
          ))}
          
          <div className="flex justify-between items-center p-2 bg-orange-100 rounded font-medium">
            <span>Total Delivery Fees:</span>
            <span className="text-orange-700">{formatPrice(totalDeliveryFees)}</span>
          </div>
        </div>

        {showReason && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-orange-800">
              Approval Reason (Optional):
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for approving this order despite high delivery costs..."
              className="border-orange-200 focus:border-orange-400"
            />
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => {
              if (showReason) {
                onApprove(reason)
              } else {
                setShowReason(true)
              }
            }}
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            {showReason ? 'Confirm Approval' : 'Approve Order'}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => onReject('Order rejected due to high delivery costs')}
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            <XCircle className="h-4 w-4" />
            Reject Order
          </Button>
          
          {showReason && (
            <Button
              variant="ghost"
              onClick={() => {
                setShowReason(false)
                setReason('')
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
