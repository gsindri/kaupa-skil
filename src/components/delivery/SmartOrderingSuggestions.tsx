
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Lightbulb, TrendingUp, Clock, Merge, Plus } from 'lucide-react'
import type { OrderingSuggestion } from '@/services/OrderingSuggestions'

interface SmartOrderingSuggestionsProps {
  suggestions: OrderingSuggestion[]
  onApplySuggestion?: (suggestion: OrderingSuggestion) => void
  isLoading?: boolean
}

export function SmartOrderingSuggestions({ 
  suggestions, 
  onApplySuggestion,
  isLoading 
}: SmartOrderingSuggestionsProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('is-IS', {
      style: 'currency',
      currency: 'ISK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'threshold_optimization':
        return <TrendingUp className="h-4 w-4" />
      case 'consolidation':
        return <Merge className="h-4 w-4" />
      case 'timing_optimization':
        return <Clock className="h-4 w-4" />
      default:
        return <Lightbulb className="h-4 w-4" />
    }
  }

  const getSuggestionColor = (type: string) => {
    switch (type) {
      case 'threshold_optimization':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'consolidation':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'timing_optimization':
        return 'bg-purple-50 border-purple-200 text-purple-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Smart Ordering Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (suggestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Smart Ordering Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No optimization suggestions available at the moment.
          </p>
        </CardContent>
      </Card>
    )
  }

  const totalPotentialSavings = suggestions.reduce((sum, s) => sum + s.potential_savings, 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Smart Ordering Suggestions
          </CardTitle>
          {totalPotentialSavings > 0 && (
            <Badge variant="secondary">
              Potential savings: {formatPrice(totalPotentialSavings)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.map((suggestion) => (
          <Alert key={suggestion.id} className={getSuggestionColor(suggestion.type)}>
            <div className="flex items-start gap-3">
              {getSuggestionIcon(suggestion.type)}
              <div className="flex-1 min-w-0">
                <AlertDescription>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{suggestion.title}</h4>
                    <div className="flex items-center gap-2">
                      {suggestion.potential_savings > 0 && (
                        <Badge variant="outline" className="text-xs">
                          Save {formatPrice(suggestion.potential_savings)}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {Math.round(suggestion.confidence * 100)}% confidence
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm mb-3">{suggestion.description}</p>
                  
                  {suggestion.metadata.suggested_items && (
                    <div className="mb-3">
                      <p className="text-xs font-medium mb-1">Suggested items:</p>
                      <div className="flex flex-wrap gap-1">
                        {suggestion.metadata.suggested_items.map((item: any, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {item.supplier_items?.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {onApplySuggestion && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onApplySuggestion(suggestion)}
                        className="text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Apply
                      </Button>
                    </div>
                  )}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        ))}
      </CardContent>
    </Card>
  )
}
