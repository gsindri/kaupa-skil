import { AlertTriangle, TrendingUp, TrendingDown, CheckCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/formatPrice'
import type { PriceDrift } from '@/hooks/useLivePricing'

interface PriceDriftAlertProps {
  drifts: PriceDrift[]
  totalOld: number
  totalNew: number
  onRefresh?: () => void
  isStale?: boolean
}

export function PriceDriftAlert({ 
  drifts, 
  totalOld, 
  totalNew, 
  onRefresh,
  isStale = false 
}: PriceDriftAlertProps) {
  if (drifts.length === 0 && !isStale) {
    return (
      <Alert className="border-success/50 bg-success/10">
        <CheckCircle className="h-4 w-4 text-success" />
        <AlertTitle>Prices Up to Date</AlertTitle>
        <AlertDescription>
          All prices are current and validated.
        </AlertDescription>
      </Alert>
    )
  }

  const increases = drifts.filter(d => d.direction === 'increase')
  const decreases = drifts.filter(d => d.direction === 'decrease')
  const totalDrift = totalNew - totalOld

  return (
    <div className="space-y-2">
      {isStale && (
        <Alert className="border-warning/50 bg-warning/10">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertTitle>Price Check Recommended</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>Prices haven't been validated recently</span>
            {onRefresh && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={onRefresh}
                className="ml-4"
              >
                Refresh Prices
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {drifts.length > 0 && (
        <Alert className={totalDrift > 0 ? 'border-warning/50 bg-warning/10' : 'border-success/50 bg-success/10'}>
          <div className="flex items-start gap-3">
            {totalDrift > 0 ? (
              <TrendingUp className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
            ) : (
              <TrendingDown className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
            )}
            
            <div className="flex-1 space-y-2">
              <AlertTitle>
                {totalDrift > 0 ? 'Price Increases Detected' : 'Prices Decreased'}
              </AlertTitle>
              
              <AlertDescription>
                <div className="space-y-2">
                  <div className="text-sm">
                    {increases.length > 0 && (
                      <span className="text-warning font-medium">
                        {increases.length} item{increases.length > 1 ? 's' : ''} increased
                      </span>
                    )}
                    {increases.length > 0 && decreases.length > 0 && <span className="mx-2">•</span>}
                    {decreases.length > 0 && (
                      <span className="text-success font-medium">
                        {decreases.length} item{decreases.length > 1 ? 's' : ''} decreased
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <span>Total change:</span>
                    <Badge variant={totalDrift > 0 ? 'destructive' : 'default'}>
                      {totalDrift > 0 ? '+' : ''}{formatPrice(totalDrift)}
                    </Badge>
                    <span className="text-muted-foreground">
                      ({formatPrice(totalOld)} → {formatPrice(totalNew)})
                    </span>
                  </div>

                  {drifts.slice(0, 3).map(drift => (
                    <div key={drift.lineId} className="flex items-center justify-between text-xs pt-1 border-t">
                      <span className="truncate max-w-[200px]">{drift.productName}</span>
                      <div className="flex items-center gap-2">
                        <span className="line-through text-muted-foreground">
                          {formatPrice(drift.oldPrice)}
                        </span>
                        <span className={drift.direction === 'increase' ? 'text-warning' : 'text-success'}>
                          {formatPrice(drift.newPrice)}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {drift.direction === 'increase' ? '+' : '-'}{drift.driftPercent.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  ))}

                  {drifts.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{drifts.length - 3} more items with price changes
                    </div>
                  )}
                </div>
              </AlertDescription>
            </div>
          </div>
        </Alert>
      )}
    </div>
  )
}
