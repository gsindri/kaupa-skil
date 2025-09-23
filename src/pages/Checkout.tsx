import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LazyImage } from '@/components/ui/LazyImage'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { useCart } from '@/contexts/useBasket'
import { useSettings } from '@/contexts/useSettings'
import { useToast } from '@/hooks/use-toast'
import { useDeliveryCalculation } from '@/hooks/useDeliveryOptimization'
import { useAuth } from '@/contexts/useAuth'
import type { CartItem } from '@/lib/types'
import { ArrowRight, Truck } from 'lucide-react'

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

export default function Checkout() {
  const {
    items,
    clearCart,
    getTotalPrice,
    getMissingPriceCount,
  } = useCart()
  const { includeVat } = useSettings()
  const { profile } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const { data: deliveryCalculations, isLoading: isLoadingDelivery } = useDeliveryCalculation()
  const [paymentMethod, setPaymentMethod] = useState<'invoice' | 'card'>('invoice')
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)

  const subtotalPrice = getTotalPrice(includeVat)
  const missingPriceCount = getMissingPriceCount()
  const totalDeliveryFees = deliveryCalculations?.reduce(
    (sum, calc) => sum + calc.total_delivery_cost,
    0,
  ) ?? 0
  const grandTotal = subtotalPrice + totalDeliveryFees

  const supplierGroups = useMemo(() => {
    const groups = new Map<string, { supplierName: string; items: CartItem[] }>()

    items.forEach(item => {
      const current = groups.get(item.supplierId)
      if (current) {
        current.items.push(item)
      } else {
        groups.set(item.supplierId, {
          supplierName: item.supplierName,
          items: [item],
        })
      }
    })

    return Array.from(groups.entries())
  }, [items])

  const supplierSummaries = useMemo(() => {
    return supplierGroups.map(([supplierId, group]) => {
      const supplierDelivery = deliveryCalculations?.find(calc => calc.supplier_id === supplierId)
      const supplierSubtotal = group.items.reduce((sum, item) => {
        const price = includeVat ? item.unitPriceIncVat : item.unitPriceExVat
        return price != null ? sum + price * item.quantity : sum
      }, 0)
      const supplierHasUnknownPrices = group.items.some(item => {
        const price = includeVat ? item.unitPriceIncVat : item.unitPriceExVat
        return price == null
      })
      const deliveryCost = supplierDelivery?.total_delivery_cost ?? 0
      const supplierTotal = supplierSubtotal + deliveryCost

      return {
        supplierId,
        supplierName: group.supplierName,
        subtotal: supplierSubtotal,
        deliveryCost,
        total: supplierTotal,
        hasUnknownPrices: supplierHasUnknownPrices,
      }
    })
  }, [deliveryCalculations, includeVat, supplierGroups])

  const deliveryDisplay = isLoadingDelivery
    ? 'Calculating…'
    : deliveryCalculations
      ? totalDeliveryFees > 0
        ? formatPriceISK(totalDeliveryFees)
        : 'Included'
      : '—'
  const grandTotalDisplay = missingPriceCount > 0 && grandTotal === 0
    ? 'Pending'
    : formatPriceISK(grandTotal)

  const handlePlaceOrder = () => {
    if (items.length === 0) {
      toast({
        title: 'Cart is empty',
        description: 'Add items to your cart before placing an order.',
        variant: 'destructive',
      })
      return
    }

    setIsPlacingOrder(true)
    try {
      const confirmationSuppliers = supplierGroups.map(([supplierId, group]) => {
        const supplierDelivery = deliveryCalculations?.find(calc => calc.supplier_id === supplierId)
        const subtotal = group.items.reduce((sum, item) => {
          const price = includeVat ? item.unitPriceIncVat : item.unitPriceExVat
          return price != null ? sum + price * item.quantity : sum
        }, 0)
        const deliveryCost = supplierDelivery?.total_delivery_cost ?? 0
        const total = subtotal + deliveryCost
        const hasUnknownPrices = group.items.some(item => {
          const price = includeVat ? item.unitPriceIncVat : item.unitPriceExVat
          return price == null
        })

        return {
          supplierId,
          supplierName: group.supplierName,
          subtotal,
          deliveryCost,
          total,
          hasUnknownPrices,
          items: group.items.map(item => ({
            supplierItemId: item.supplierItemId,
            name: item.displayName || item.itemName,
            quantity: item.quantity,
            packSize: item.packSize,
            unit: item.unit,
            unitPrice: includeVat ? item.unitPriceIncVat : item.unitPriceExVat,
            image: item.image,
          })),
        }
      })

      const orderId = `PO-${Date.now().toString(36).toUpperCase()}`
      const placedAt = new Date().toISOString()

      navigate('/checkout/confirmation', {
        state: {
          orderId,
          placedAt,
          paymentMethod,
          totals: {
            grandTotal,
            deliveryFees: totalDeliveryFees,
            missingPriceCount,
            includeVat,
          },
          suppliers: confirmationSuppliers,
        },
      })

      clearCart()
      toast({
        title: 'Order placed',
        description: 'We’re sending the request to your suppliers now.',
      })
    } catch (error) {
      toast({
        title: 'Unable to place order',
        description: 'Please try again in a moment.',
        variant: 'destructive',
      })
    } finally {
      setIsPlacingOrder(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Checkout</h1>
        <Card className="overflow-hidden text-center">
          <CardContent className="flex flex-col items-center gap-6 py-16">
            <img src="/unavailable.svg" alt="" className="h-32 w-32 object-contain" />
            <div className="space-y-2">
              <p className="text-xl font-semibold text-foreground">Nothing to review yet</p>
              <p className="text-sm text-muted-foreground">
                Add items to your cart and return here to confirm delivery and payment details.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button onClick={() => navigate('/catalog')} className="inline-flex items-center gap-2">
                Browse catalog
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => navigate('/cart')}>Back to cart</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Checkout</h1>
          <p className="text-sm text-muted-foreground">
            Confirm delivery details, payment method, and totals before placing your order.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/cart')}>
          Return to cart
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">Delivery</CardTitle>
              <p className="text-sm text-muted-foreground">
                Confirm where we should route each supplier delivery.
              </p>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-background/70 p-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="font-semibold text-foreground">{profile?.full_name || 'Primary contact'}</p>
                    <p className="text-muted-foreground">{profile?.email || 'Add a contact email in Settings.'}</p>
                  </div>
                  <div className="rounded-md border border-dashed border-muted-foreground/30 bg-muted/10 p-3 text-xs text-muted-foreground">
                    Set your delivery locations in <span className="font-medium">Settings &gt; Locations</span>.
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">Payment</CardTitle>
              <p className="text-sm text-muted-foreground">
                Choose how you would like to settle this order.
              </p>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <RadioGroup value={paymentMethod} onValueChange={value => setPaymentMethod(value as 'invoice' | 'card')} className="gap-3">
                <Label
                  htmlFor="payment-invoice"
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 bg-background/70 p-3 transition hover:border-primary/50"
                >
                  <RadioGroupItem id="payment-invoice" value="invoice" className="mt-1" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">Invoice</p>
                    <p className="text-xs text-muted-foreground">Standard payment terms on invoice (net 30).</p>
                  </div>
                </Label>

                <Label
                  htmlFor="payment-card"
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-dashed border-border/60 bg-background/50 p-3 opacity-70"
                >
                  <RadioGroupItem id="payment-card" value="card" disabled className="mt-1" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">Card (coming soon)</p>
                    <p className="text-xs text-muted-foreground">Save a company card to pay directly at checkout.</p>
                  </div>
                </Label>
              </RadioGroup>
              <p className="text-xs text-muted-foreground">
                Need different terms? Contact support and we&rsquo;ll tailor payment rules for your team.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-lg font-semibold">Items &amp; deliveries</CardTitle>
                {missingPriceCount > 0 && (
                  <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                    Pricing pending
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Review supplier splits, quantities, and any delivery fees before you place the order.
              </p>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              {supplierGroups.map(([supplierId, group]) => {
                const summary = supplierSummaries.find(s => s.supplierId === supplierId)
                const supplierDelivery = deliveryCalculations?.find(calc => calc.supplier_id === supplierId)
                const [firstItem] = group.items
                const extended = firstItem as CartItem & {
                  supplierLogoUrl?: string | null
                  logoUrl?: string | null
                  supplierLogo?: string | null
                }
                const supplierLogo = extended?.supplierLogoUrl ?? extended?.logoUrl ?? extended?.supplierLogo ?? null
                const supplierInitials = (group.supplierName || '??').slice(0, 2).toUpperCase()

                return (
                  <div key={supplierId} className="space-y-3 rounded-xl border border-border/60 bg-background/70 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          {supplierLogo ? (
                            <AvatarImage src={supplierLogo} alt={`${group.supplierName} logo`} className="object-contain" />
                          ) : (
                            <AvatarFallback className="text-sm font-medium">{supplierInitials}</AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold leading-tight text-foreground">{group.supplierName || 'Supplier'}</p>
                          <p className="text-xs text-muted-foreground">{group.items.length} item{group.items.length === 1 ? '' : 's'}</p>
                        </div>
                      </div>

                      <div className="text-right text-sm font-semibold tabular-nums text-foreground">
                        {summary?.hasUnknownPrices
                          ? 'Pending'
                          : formatPriceISK(summary?.total ?? 0)}
                      </div>
                    </div>

                    {supplierDelivery && (
                      <div className="flex flex-wrap items-center gap-2 rounded-md border border-dashed border-muted-foreground/30 bg-muted/10 px-3 py-2 text-xs text-muted-foreground">
                        <Truck className="h-3.5 w-3.5" />
                        {supplierDelivery.total_delivery_cost > 0
                          ? `${formatPriceISK(supplierDelivery.total_delivery_cost)} delivery`
                          : 'Delivery included'}
                        {supplierDelivery.next_delivery_day && (
                          <span>&bull; Next: {supplierDelivery.next_delivery_day}</span>
                        )}
                      </div>
                    )}

                    {isLoadingDelivery && !supplierDelivery && (
                      <div className="rounded-md border border-dashed border-muted-foreground/30 px-3 py-2 text-xs text-muted-foreground">
                        Calculating delivery for this supplier…
                      </div>
                    )}

                    <div className="space-y-2">
                      {group.items.map(item => {
                        const displayName = item.displayName || item.itemName
                        const unitPrice = includeVat ? item.unitPriceIncVat : item.unitPriceExVat
                        const unitLabel = item.unit ? `per ${item.unit}` : 'per unit'
                        const pricePerUnit = unitPrice != null ? formatPriceISK(unitPrice) : 'Pending'
                        const lineTotal = unitPrice != null ? unitPrice * item.quantity : null
                        const lineTotalDisplay = lineTotal != null ? formatPriceISK(lineTotal) : 'Pending'

                        return (
                          <div key={item.supplierItemId} className="flex items-center gap-3 rounded-lg border border-muted/40 bg-background/80 p-3">
                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                              {item.image ? (
                                <LazyImage src={item.image} alt={displayName} className="h-full w-full" imgClassName="object-contain" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-[11px] text-muted-foreground">No image</div>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.quantity} × {pricePerUnit} {unitLabel}
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
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 xl:sticky xl:top-[calc(100vh-26rem)] xl:self-start">
          <Card className="shadow-lg">
            <CardHeader className="space-y-1 pb-4">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-lg font-semibold">Order summary</CardTitle>
                {missingPriceCount > 0 && (
                  <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                    Estimated
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Totals include supplier splits and delivery fees.
              </p>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              {missingPriceCount > 0 && (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  {missingPriceCount} item{missingPriceCount === 1 ? '' : 's'} awaiting supplier pricing – total is estimated.
                </div>
              )}

              <div className="space-y-3">
                <div className="space-y-1.5">
                  {supplierSummaries.map(summary => (
                    <SummaryRow
                      key={summary.supplierId}
                      label={summary.supplierName || 'Supplier'}
                      value={
                        summary.hasUnknownPrices
                          ? 'Pending'
                          : summary.total > 0 || summary.deliveryCost > 0
                            ? formatPriceISK(summary.total)
                            : 'Pending'
                      }
                    />
                  ))}
                </div>

                <SummaryRow label="Delivery fees" value={deliveryDisplay} />

                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center text-sm">
                  <span className="text-muted-foreground">Payment</span>
                  <span className="text-right text-xs text-muted-foreground">
                    {paymentMethod === 'invoice' ? 'Invoice (net 30)' : 'Card'}
                  </span>
                </div>

                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center text-sm">
                  <span className="text-muted-foreground">VAT</span>
                  <span className="text-right text-xs text-muted-foreground">
                    {includeVat ? 'Included in totals' : 'Calculated at settlement'}
                  </span>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {missingPriceCount > 0 ? 'Estimated total' : 'Grand total'}
                  </p>
                </div>
                <p className="text-2xl font-semibold tabular-nums text-foreground">{grandTotalDisplay}</p>
              </div>

              <div className="space-y-3 pt-2">
                <Button
                  type="button"
                  className="w-full"
                  size="lg"
                  onClick={handlePlaceOrder}
                  disabled={isPlacingOrder}
                >
                  {isPlacingOrder ? 'Placing order…' : 'Place order'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => navigate('/cart')}
                >
                  Back to cart
                </Button>
              </div>

              <div className="rounded-md border border-dashed border-muted-foreground/40 bg-muted/10 px-3 py-2 text-xs text-muted-foreground">
                Once submitted, suppliers will confirm availability and final pricing. You&rsquo;ll receive a confirmation email shortly after.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
