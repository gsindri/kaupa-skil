
import React from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, AlertTriangle, Lightbulb } from 'lucide-react'
import type { OrderDeliveryOptimization } from '@/lib/types/delivery'

interface DeliveryOptimizationBannerProps {
  optimization: OrderDeliveryOptimization
  onApplySuggestion?: (suggestionIndex: number) => void
}

export function DeliveryOptimizationBanner({ 
  optimization, 
  onApplySuggestion 
}: DeliveryOptimizationBannerProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('is-IS', {
      style: 'currency',
      currency: 'ISK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  if (optimization.warnings.length === 0 && optimization.suggestions.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      {/* Warnings */}
      {optimization.warnings.map((warning, index) => (
        <Alert key={index} variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>{warning.message}</span>
              <Badge variant="destructive">
                +{formatPrice(warning.cost_impact)}
              </Badge>
            </div>
          </AlertDescription>
        </Alert>
      ))}

      {/* Suggestions */}
      {optimization.suggestions.map((suggestion, index) => (
        <Alert key={index} className="border-blue-200 bg-blue-50">
          <Lightbulb className="h-4 w-4 text-blue-600" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-blue-800">{suggestion.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <TrendingDown className="h-3 w-3 text-green-600" />
                  <span className="text-sm text-green-600 font-medium">
                    Save {formatPrice(suggestion.savings)}
                  </span>
                </div>
              </div>
              {onApplySuggestion && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onApplySuggestion(index)}
                  className="ml-4"
                >
                  Apply
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  )
}
