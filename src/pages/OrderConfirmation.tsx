import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CART_ROUTE } from '@/lib/featureFlags'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { LazyImage } from '@/components/ui/LazyImage'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

function formatPriceISK(price: number) {
  return new Intl.NumberFormat('is-IS', {
    style: 'currency',
    currency: 'ISK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium tabular-nums text-foreground">{value}</span>
    </div>
  )
}

type ConfirmationItem = {
  supplierItemId: string
  name: string
  quantity: number
  packSize: string
  unit: string
  unitPrice: number | null
  image: string | null
}

type ConfirmationSupplier = {
  supplierId: string
  supplierName: string
  subtotal: number
  deliveryCost: number
  total: number
  hasUnknownPrices: boolean
  items: ConfirmationItem[]
}

type ConfirmationState = {
  orderId: string
  placedAt: string
  paymentMethod: 'invoice' | 'card'
  totals: {
    grandTotal: number
    deliveryFees: number
    missingPriceCount: number
    includeVat: boolean
  }
  suppliers: ConfirmationSupplier[]
}

export default function OrderConfirmation() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as ConfirmationState | undefined

  if (!state || !state.suppliers || state.suppliers.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Order confirmation</h1>
        <Card className="overflow-hidden text-center">
          <CardContent className="flex flex-col items-center gap-6 py-16">
            <img src="/unavailable.svg" alt="" className="h-32 w-32 object-contain" />
            <div className="space-y-2">
              <p className="text-xl font-semibold text-foreground">No recent order found</p>
              <p className="text-sm text-muted-foreground">
                Start a new order from your cart to view confirmation details here.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button onClick={() => navigate('/catalog')} className="inline-flex items-center gap-2">
                Browse catalog
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => navigate(CART_ROUTE)}>Back to cart</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const formattedPlacedAt = new Intl.DateTimeFormat('is-IS', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(state.placedAt))
  const deliveryFeesDisplay = state.totals.deliveryFees > 0
    ? formatPriceISK(state.totals.deliveryFees)
    : 'Included'
  const grandTotalDisplay = state.totals.missingPriceCount > 0 && state.totals.grandTotal === 0
    ? 'Pending'
    : formatPriceISK(state.totals.grandTotal)

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Card className="border border-emerald-200 bg-emerald-50">
          <CardContent className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-emerald-800">Order placed successfully</CardTitle>
                <p className="text-sm text-emerald-700">Order ID {state.orderId}</p>
              </div>
            </div>
            <div className="text-sm font-medium text-emerald-700">{formattedPlacedAt}</div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>{state.suppliers.length} supplier{state.suppliers.length === 1 ? '' : 's'} notified</span>
          <span>&bull;</span>
          <span>Payment: {state.paymentMethod === 'invoice' ? 'Invoice (net 30)' : 'Card'}</span>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          {state.suppliers.map(supplier => {
            const supplierInitials = (supplier.supplierName || '??').slice(0, 2).toUpperCase()

            return (
              <Card key={supplier.supplierId} className="shadow-sm">
                <CardHeader className="space-y-2 pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="text-sm font-medium">{supplierInitials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg font-semibold leading-snug text-foreground">
                          {supplier.supplierName || 'Supplier'}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {supplier.items.length} item{supplier.items.length === 1 ? '' : 's'} in this delivery
                        </p>
                      </div>
                    </div>

                    <div className="text-right text-sm font-semibold tabular-nums text-foreground">
                      {supplier.hasUnknownPrices ? 'Pending' : formatPriceISK(supplier.total)}
                    </div>
                  </div>

                  {supplier.hasUnknownPrices && (
                    <Badge variant="outline" className="w-fit border-amber-200 bg-amber-50 text-amber-700">
                      Pricing pending
                    </Badge>
                  )}
                </CardHeader>

                <CardContent className="space-y-4 pt-0">
                  <div className="space-y-2">
                    {supplier.items.map(item => {
                      const unitLabel = item.unit ? `per ${item.unit}` : 'per unit'
                      const unitPriceDisplay = item.unitPrice != null ? formatPriceISK(item.unitPrice) : 'Pending'
                      const lineTotal = item.unitPrice != null ? item.unitPrice * item.quantity : null
                      const lineTotalDisplay = lineTotal != null ? formatPriceISK(lineTotal) : 'Pending'

                      return (
                        <div key={item.supplierItemId} className="flex items-center gap-3 rounded-lg border border-muted/40 bg-background/80 p-3">
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                            {item.image ? (
                              <LazyImage src={item.image} alt={item.name} className="h-full w-full" imgClassName="object-contain" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[11px] text-muted-foreground">No image</div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.quantity} × {unitPriceDisplay} {unitLabel}
                            </p>
                            {item.packSize && (
                              <p className="text-xs text-muted-foreground">Pack: {item.packSize}</p>
                            )}
                          </div>

                          <div className="text-sm font-medium tabular-nums text-foreground">{lineTotalDisplay}</div>
                        </div>
                      )
                    })}
                  </div>

                  <Separator />

                  <div className="space-y-2 text-sm">
                    <SummaryRow label="Items subtotal" value={formatPriceISK(supplier.subtotal)} />
                    <SummaryRow
                      label="Delivery & fees"
                      value={supplier.deliveryCost > 0 ? formatPriceISK(supplier.deliveryCost) : 'Included'}
                    />
                    <SummaryRow
                      label={supplier.hasUnknownPrices ? 'Estimated supplier total' : 'Supplier total'}
                      value={supplier.hasUnknownPrices ? 'Pending' : formatPriceISK(supplier.total)}
                    />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="space-y-4 xl:sticky xl:top-[calc(100vh-26rem)] xl:self-start">
          <Card className="shadow-lg">
            <CardHeader className="space-y-1 pb-4">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-lg font-semibold">Totals</CardTitle>
                {state.totals.missingPriceCount > 0 && (
                  <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                    Estimated
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">Saved for your records.</p>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              {state.totals.missingPriceCount > 0 && (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  {state.totals.missingPriceCount} item{state.totals.missingPriceCount === 1 ? '' : 's'} awaiting supplier pricing – final total will update once confirmed.
                </div>
              )}

              <div className="space-y-3">
                <SummaryRow label="Suppliers" value={`${state.suppliers.length}`} />
                <SummaryRow label="Delivery fees" value={deliveryFeesDisplay} />
                <SummaryRow
                  label="Payment"
                  value={state.paymentMethod === 'invoice' ? 'Invoice (net 30)' : 'Card'}
                />
                <SummaryRow
                  label="VAT"
                  value={state.totals.includeVat ? 'Included in totals' : 'Calculated at settlement'}
                />
              </div>

              <Separator />

              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {state.totals.missingPriceCount > 0 ? 'Estimated grand total' : 'Grand total'}
                  </p>
                </div>
                <p className="text-2xl font-semibold tabular-nums text-foreground">{grandTotalDisplay}</p>
              </div>

              <div className="rounded-md border border-dashed border-muted-foreground/40 bg-muted/10 px-3 py-2 text-xs text-muted-foreground">
                We&rsquo;ve emailed a copy of this confirmation. Suppliers will follow up if any pricing or delivery windows change.
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/40 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">What happens next?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Suppliers receive separate purchase requests.</p>
              <p>• We monitor price confirmations and notify you of any changes.</p>
              <p>• Track delivery progress from the dashboard.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button onClick={() => navigate('/catalog')} className="inline-flex items-center gap-2">
          Continue shopping
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" onClick={() => navigate(CART_ROUTE)}>
          View cart
        </Button>
      </div>
    </div>
  )
}
