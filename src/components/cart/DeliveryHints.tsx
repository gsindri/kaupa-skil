
import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, Plus } from 'lucide-react'
import { useCart } from '@/contexts/BasketProviderUtils'
import { useSettings } from '@/contexts/SettingsProviderUtils'

interface DeliveryHint {
  supplierId: string
  supplierName: string
  amountToFreeDelivery: number
  currentDeliveryFee: number
  suggestedItems: Array<{
    id: string
    name: string
    packSize: string
    unitPrice: number
  }>
}

interface DeliveryHintsProps {
  hints: DeliveryHint[]
}

export function DeliveryHints({ hints }: DeliveryHintsProps) {
  const { addItem } = useCart()
  const { includeVat } = useSettings()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('is-IS', {
      style: 'currency',
      currency: 'ISK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  if (hints.length === 0) return null

  return (
    <div className="space-y-3">
      {hints.map((hint) => (
        <Card key={hint.supplierId} className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 text-blue-800 font-medium">
                  <TrendingUp className="h-4 w-4" />
                  <span>Save {formatPrice(hint.currentDeliveryFee)} delivery fee</span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  Add {formatPrice(hint.amountToFreeDelivery)} more from {hint.supplierName} to get free delivery
                </p>
              </div>
            </div>

            {hint.suggestedItems.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs text-blue-600 font-medium">Quick add suggestions:</div>
                <div className="flex flex-wrap gap-2">
                  {hint.suggestedItems.slice(0, 3).map((item) => (
                    <Button
                      key={item.id}
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs bg-white hover:bg-blue-100 border-blue-200"
                      onClick={() => addItem({
                        id: item.id,
                        supplierItemId: item.id,
                        itemName: item.name,
                        packSize: item.packSize,
                        unitPriceExVat: item.unitPrice,
                        unitPriceIncVat: item.unitPrice * 1.24,
                        supplierId: hint.supplierId,
                        supplierName: hint.supplierName,
                        sku: `SKU-${item.id}`,
                        packPrice: item.unitPrice,
                        vatRate: 0.24,
                        unit: 'pc',
                        displayName: item.name,
                        packQty: 1
                      })}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {item.name} - {formatPrice(item.unitPrice)}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
