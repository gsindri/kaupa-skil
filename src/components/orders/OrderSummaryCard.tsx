import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clipboard, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OrderSummaryCardProps {
  supplierCount: number
  itemCount: number
  total: number
  missingPricesCount: number
  onCheckout: () => void
  canCheckout: boolean
  formatPrice: (price: number) => string
}

export function OrderSummaryCard({
  supplierCount,
  itemCount,
  total,
  missingPricesCount,
  onCheckout,
  canCheckout,
  formatPrice,
}: OrderSummaryCardProps) {
  return (
    <Card className="shadow-lg border-none shadow-slate-200/50">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Clipboard className="h-5 w-5" />
          </div>
          <CardTitle className="text-lg font-bold text-slate-900">Order Summary</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Metrics Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Suppliers</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{supplierCount}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Items</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{itemCount}</p>
          </div>
        </div>

        <div className="space-y-4">
          <p className="font-medium text-slate-900">Estimated Totals</p>

          {/* Totals Row */}
          <div className="flex items-center justify-between">
            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">ISK</span>
            <span className="text-2xl font-bold text-slate-900">{formatPrice(total)}</span>
          </div>
        </div>

        {/* Info Banner */}
        <div className="rounded-xl bg-blue-50 p-4">
          <div className="flex gap-3">
            <Info className="h-5 w-5 shrink-0 text-blue-600" />
            <p className="text-sm font-medium leading-relaxed text-blue-700">
              Draft orders are separated by supplier. You will review and send emails for each supplier individually.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            className={cn(
              "w-full h-12 text-base font-semibold shadow-lg transition-all",
              canCheckout
                ? "bg-blue-600 hover:bg-blue-700 shadow-blue-200/50 hover:shadow-xl text-white"
                : "bg-slate-100 text-slate-400 shadow-none cursor-not-allowed"
            )}
            size="lg"
            onClick={onCheckout}
            disabled={!canCheckout}
          >
            {supplierCount > 1 ? `Send All ${supplierCount} Orders` : 'Send Order'}
          </Button>

          {missingPricesCount > 0 && (
            <p className="text-center text-xs text-amber-600 font-medium">
              {missingPricesCount} item{missingPricesCount === 1 ? '' : 's'} pending pricing
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
