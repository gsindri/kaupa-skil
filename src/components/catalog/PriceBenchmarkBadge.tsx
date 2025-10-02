import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { usePriceBenchmark } from '@/hooks/usePriceBenchmark';

interface PriceBenchmarkBadgeProps {
  supplierId: string;
  catalogProductId: string;
  currentPrice?: number;
}

export const PriceBenchmarkBadge = memo(function PriceBenchmarkBadge({
  supplierId,
  catalogProductId,
  currentPrice,
}: PriceBenchmarkBadgeProps) {
  const { data: benchmark, isLoading } = usePriceBenchmark({
    supplierId,
    catalogProductId,
    enabled: !!supplierId && !!catalogProductId,
  });

  if (isLoading || !benchmark?.has_benchmark || !benchmark.comparison) {
    return null;
  }

  const { comparison } = benchmark;
  const vsMedian = comparison.vs_median_pct;

  // Determine badge variant and icon
  let variant: 'default' | 'secondary' | 'outline' | 'destructive' = 'secondary';
  let Icon = Minus;
  let message = comparison.message;

  if (vsMedian < -10) {
    // Significantly below market (good deal)
    variant = 'default';
    Icon = TrendingDown;
  } else if (vsMedian > 10) {
    // Significantly above market (expensive)
    variant = 'destructive';
    Icon = TrendingUp;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant={variant} className="h-6 px-2 text-xs gap-1 cursor-help">
          <Icon className="h-3 w-3" />
          <span className="font-semibold">
            {vsMedian > 0 ? '+' : ''}
            {vsMedian.toFixed(0)}%
          </span>
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <div className="space-y-1">
          <p className="font-semibold">{message}</p>
          {benchmark.benchmark && (
            <div className="text-xs space-y-0.5 mt-2">
              <p>
                Market median:{' '}
                <span className="font-mono">
                  {new Intl.NumberFormat('is-IS', {
                    style: 'currency',
                    currency: 'ISK',
                    minimumFractionDigits: 0,
                  }).format(benchmark.benchmark.median_kr_per_unit)}
                </span>
                /unit
              </p>
              <p className="text-muted-foreground">
                Based on {benchmark.benchmark.orders_count} orders from{' '}
                {benchmark.benchmark.distinct_orgs_count} organizations
              </p>
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
});
