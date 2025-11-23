import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowRight, ChevronDown, ChevronUp, Info, Trash2, Truck } from 'lucide-react'
import { useDeliveryCalculation, useDeliveryOptimization } from '@/hooks/useDeliveryOptimization'
import { DeliveryOptimizationBanner } from '@/components/quick/DeliveryOptimizationBanner'
import { OrderApprovalWorkflow } from './OrderApprovalWorkflow'
import { useToast } from '@/hooks/use-toast'
import { useCart } from '@/contexts/useBasket'
import { useSettings } from '@/contexts/useSettings'
import { QuantityStepper } from '@/components/cart/QuantityStepper'
import { LazyImage } from '@/components/ui/LazyImage'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import type { CartItem } from '@/lib/types'
import { useSuppliers } from '@/hooks/useSuppliers'
import { SendOrderButton } from '@/components/cart/SendOrderButton'

function formatPriceISK(price: number) {
  return new Intl.NumberFormat('is-IS', {
    style: 'currency',
    currency: 'ISK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

import { SupplierOrderCard } from '@/components/orders/SupplierOrderCard'

// ... (imports)

// Remove SupplierItemRow and SupplierItemRowProps definitions

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium tabular-nums text-foreground">{value}</span>
    </div>
  )
}

export function OrderComposer() {
  const {
    items,
    removeItem,
    clearCart,
    getTotalPrice,
    getMissingPriceCount,
  } = useCart()
  const { includeVat } = useSettings()
  const {
    data: deliveryCalculations,
    isLoading: isLoadingDelivery,
  } = useDeliveryCalculation()
  const { data: optimization } = useDeliveryOptimization()
  const { toast } = useToast()
  const navigate = useNavigate()
  const { suppliers } = useSuppliers()
  const [orderApproved, setOrderApproved] = useState(false)
  const [showPromoField, setShowPromoField] = useState(false)
  const [promoCode, setPromoCode] = useState('')

  const formatPrice = formatPriceISK

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

  const hasMultipleSuppliers = supplierGroups.length > 1

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

  const handleOrderApproval = (reason?: string) => {
    setOrderApproved(true)
    toast({
      title: 'Order Approved',
      description: reason || 'Order approved for checkout despite delivery costs.',
    })
  }

  const handleOrderRejection = (reason: string) => {
    toast({
      title: 'Order Rejected',
      description: reason,
      variant: 'destructive',
    })
  }

  const handleProceedToCheckout = () => {
    if (!orderApproved && totalDeliveryFees > 10000) {
      return
    }
    navigate('/checkout')
  }

  const handleApplyPromoCode = () => {
    if (!promoCode.trim()) return

    toast({
      title: 'Promo codes not yet supported',
      description: 'We will let you know once discounts are available.',
    })
    setPromoCode('')
    setShowPromoField(false)
  }

  if (items.length === 0) {
    return (
      <Card className="overflow-hidden text-center">
        <CardContent className="flex flex-col items-center gap-6 py-16">
          <img src="/unavailable.svg" alt="" className="h-32 w-32 object-contain" />
          <div className="space-y-2">
            <p className="text-xl font-semibold text-foreground">Your cart is empty</p>
            <p className="text-sm text-muted-foreground">
              Browse the catalog to discover products for your next order.
            </p>
          </div>
          <Button
            type="button"
            className="inline-flex items-center gap-2"
            onClick={() => (window.location.href = '/catalog')}
          >
            Browse catalog
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    )
  }

  const deliveryDisplay = isLoadingDelivery
    ? 'Calculating…'
    : deliveryCalculations
      ? totalDeliveryFees > 0
        ? formatPrice(totalDeliveryFees)
        : 'Included'
      : '—'
  const grandTotalDisplay = missingPriceCount > 0 && grandTotal === 0 ? 'Pending' : formatPrice(grandTotal)

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6">
        {optimization && <DeliveryOptimizationBanner optimization={optimization} />}

        {deliveryCalculations && !orderApproved && (
          <OrderApprovalWorkflow
            calculations={deliveryCalculations}
            onApprove={handleOrderApproval}
            onReject={handleOrderRejection}
          />
        )}

        {hasMultipleSuppliers && (
          <Alert className="border-primary/20 bg-primary/5">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Separate orders will be sent to each supplier.
            </AlertDescription>
          </Alert>
        )}

        {supplierGroups.map(([supplierId, group]) => {
          const supplierDelivery = deliveryCalculations?.find(calc => calc.supplier_id === supplierId)
          const supplierSubtotal = group.items.reduce((sum, item) => {
            const price = includeVat ? item.unitPriceIncVat : item.unitPriceExVat
            return price != null ? sum + price * item.quantity : sum
          }, 0)

          const supplierDeliveryCost = supplierDelivery?.total_delivery_cost ?? 0
          const supplierTotal = supplierSubtotal + supplierDeliveryCost
          const [firstItem] = group.items
          const extended = firstItem as CartItem & {
            supplierLogoUrl?: string | null
            logoUrl?: string | null
            supplierLogo?: string | null
          }
          const supplierLogo = extended?.supplierLogoUrl ?? extended?.logoUrl ?? extended?.supplierLogo ?? null
          const amountToFreeDelivery = supplierDelivery?.amount_to_free_delivery
          const supplierData = suppliers?.find(s => s.id === supplierId) as any
          const minOrderValue = supplierData?.min_order_isk || 0
          const supplierEmail = supplierData?.order_email

          return (
            <SupplierOrderCard
              key={supplierId}
              supplierId={supplierId}
              supplierName={group.supplierName}
              supplierEmail={supplierEmail}
              logoUrl={supplierLogo}
              items={group.items}
              subtotal={supplierSubtotal}
              deliveryFee={supplierDeliveryCost}
              total={supplierTotal}
              minOrderValue={minOrderValue}
              amountToFreeDelivery={amountToFreeDelivery}
              onRemoveItem={removeItem}
              formatPrice={formatPrice}
            />
          )
        })}
      </div>

      {/* ... (Order Summary sidebar remains unchanged) */}

      <div className="space-y-4 xl:sticky xl:top-[calc(100vh-26rem)] xl:self-end">
        <Card className="shadow-lg">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-lg font-semibold">Order Summary</CardTitle>
              {missingPriceCount > 0 && (
                <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                  Pricing pending
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Review totals before proceeding to checkout.
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
                          ? formatPrice(summary.total)
                          : 'Pending'
                    }
                  />
                ))}
              </div>

              <SummaryRow label="Delivery fees" value={deliveryDisplay} />

              <div className="space-y-2">
                <button
                  type="button"
                  className="text-xs font-medium text-primary hover:underline"
                  onClick={() => setShowPromoField(prev => !prev)}
                >
                  {showPromoField ? 'Hide promo code' : 'Add promo code'}
                </button>
                {showPromoField && (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      value={promoCode}
                      onChange={event => setPromoCode(event.target.value)}
                      placeholder="Enter code"
                      className="h-9 flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleApplyPromoCode}
                      disabled={!promoCode.trim()}
                    >
                      Apply
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center text-sm">
                <span className="text-muted-foreground">VAT</span>
                <span className="text-right text-xs text-muted-foreground">
                  {includeVat ? 'Included in totals' : 'Calculated at checkout'}
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
                onClick={handleProceedToCheckout}
                disabled={!orderApproved && totalDeliveryFees > 10000}
              >
                Proceed to Checkout
              </Button>
              <button
                type="button"
                onClick={() => {
                  clearCart()
                  setOrderApproved(false)
                }}
                className="w-full text-sm font-medium text-destructive underline-offset-4 hover:underline"
              >
                Clear cart
              </button>
            </div>

            {deliveryCalculations && totalDeliveryFees > 0 && !orderApproved && (
              <p className="text-xs text-muted-foreground">
                Delivery fees above exceed your automatic approval limit. Approve the delivery plan to enable checkout.
              </p>
            )}

            <div className="rounded-md border border-dashed border-muted-foreground/40 bg-muted/10 px-3 py-2 text-xs text-muted-foreground">
              Need to adjust delivery dates or split shipments? You can finalize these details on the next step.
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/40 shadow-sm">
          <CardHeader className="space-y-1 pb-3">
            <CardTitle className="text-base font-semibold">Need help?</CardTitle>
            <p className="text-sm text-muted-foreground">
              Our team can assist with combining deliveries or sourcing alternatives if pricing is missing.
            </p>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-muted-foreground">
            <p>Chat with support or leave a note for suppliers during checkout.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
