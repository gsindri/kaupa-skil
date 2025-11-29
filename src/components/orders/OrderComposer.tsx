import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowRight, Info, Send, CheckCircle, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDeliveryCalculation, useDeliveryOptimization } from '@/hooks/useDeliveryOptimization'
import { DeliveryOptimizationBanner } from '@/components/quick/DeliveryOptimizationBanner'
import { OrderApprovalWorkflow } from './OrderApprovalWorkflow'
import { useToast } from '@/hooks/use-toast'
import { useCart } from '@/contexts/useBasket'
import { useSettings } from '@/contexts/useSettings'
import { QuantityStepper } from '@/components/cart/QuantityStepper'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { CartItem } from '@/lib/types'
import { useSuppliers } from '@/hooks/useSuppliers'
import { SendOrderButton } from '@/components/cart/SendOrderButton'
import { SupplierOrderCard } from '@/components/orders/SupplierOrderCard'
import { SupplierOrderCardSkeleton } from '@/components/orders/SupplierOrderCardSkeleton'
import { OrderSummaryCard } from '@/components/orders/OrderSummaryCard'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useEmailAuth } from '@/hooks/useEmailAuth'
import { GmailAuthButton } from '@/components/gmail/GmailAuthButton'
import { OutlookAuthButton } from '@/components/cart/OutlookAuthButton'

function formatPriceISK(price: number) {
  if (typeof price !== 'number' || isNaN(price)) return '0 kr.'
  return new Intl.NumberFormat('is-IS', {
    style: 'currency',
    currency: 'ISK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}



// ... (imports)

// Remove SupplierItemRow and SupplierItemRowProps definitions



export function OrderComposer() {
  const {
    items,
    removeItem,
    clearCart,
    getTotalPrice,
    getMissingPriceCount,
    isHydrating,
  } = useCart()
  const { includeVat } = useSettings()
  const { isGmailAuthorized, isOutlookAuthorized, userEmail, isLoading: isAuthLoading, refresh: refreshAuth } = useEmailAuth()
  const {
    data: deliveryCalculations,
    isLoading: isLoadingDelivery,
  } = useDeliveryCalculation()
  const { data: optimization } = useDeliveryOptimization()
  const { toast } = useToast()
  const navigate = useNavigate()
  const { suppliers } = useSuppliers()
  const [orderApproved, setOrderApproved] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)


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
    setShowConfirmModal(true)
  }

  const handleConfirmSend = () => {
    setShowConfirmModal(false)
    // Logic to send emails would go here
    // For now, we'll just navigate to checkout as a placeholder or show a success toast
    toast({
      title: "Orders Sent",
      description: `Successfully sent ${supplierGroups.length} orders.`,
    })
    // In a real app, you might trigger the email sending mutations here
    // navigate('/checkout') 
  }



  // Show loading skeleton while cart is hydrating
  if (isHydrating) {
    return (
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="shadow-lg border-none shadow-slate-200/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-slate-900">Send Orders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Loading skeleton for supplier card */}
            <div className="space-y-4">
              <SupplierOrderCardSkeleton />
            </div>
          </CardContent>
        </Card>

        {/* Sidebar skeleton */}
        <div className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <Card className="shadow-lg border-none shadow-slate-200/50">
            <CardHeader className="border-b border-border/50">
              <div className="h-5 w-36 rounded bg-gradient-to-r from-muted via-muted/60 to-muted bg-[length:200%_100%] animate-shimmer" />
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <div className="flex justify-between items-center">
                <div className="h-4 w-28 rounded bg-gradient-to-r from-muted via-muted/60 to-muted bg-[length:200%_100%] animate-shimmer" />
                <div className="h-4 w-16 rounded bg-gradient-to-r from-muted via-muted/60 to-muted bg-[length:200%_100%] animate-shimmer" />
              </div>
              <div className="flex justify-between items-center">
                <div className="h-4 w-32 rounded bg-gradient-to-r from-muted via-muted/60 to-muted bg-[length:200%_100%] animate-shimmer" style={{ animationDelay: '100ms' }} />
                <div className="h-4 w-14 rounded bg-gradient-to-r from-muted via-muted/60 to-muted bg-[length:200%_100%] animate-shimmer" style={{ animationDelay: '100ms' }} />
              </div>
              <div className="pt-4 border-t border-border/50">
                <div className="flex justify-between items-center mb-4">
                  <div className="h-5 w-20 rounded bg-gradient-to-r from-muted via-muted/60 to-muted bg-[length:200%_100%] animate-shimmer" style={{ animationDelay: '200ms' }} />
                  <div className="h-6 w-24 rounded bg-gradient-to-r from-muted via-muted/60 to-muted bg-[length:200%_100%] animate-shimmer" style={{ animationDelay: '200ms' }} />
                </div>
                <div className="h-11 w-full rounded-md bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 bg-[length:200%_100%] animate-shimmer" style={{ animationDelay: '300ms' }} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
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
        <Card className="shadow-lg border-none shadow-slate-200/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-slate-900">Send Orders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
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
              const supplierHasUnknownPrices = group.items.some(item => {
                const price = includeVat ? item.unitPriceIncVat : item.unitPriceExVat
                return price == null
              })

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
                  hasUnknownPrices={supplierHasUnknownPrices}
                />
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* ... (Order Summary sidebar remains unchanged) */}

      <div className="space-y-4 xl:sticky xl:top-6 xl:self-start">
        <OrderSummaryCard
          supplierCount={supplierGroups.length}
          itemCount={items.reduce((sum, item) => sum + item.quantity, 0)}
          total={grandTotal}
          missingPricesCount={missingPriceCount}
          onCheckout={handleProceedToCheckout}
          canCheckout={orderApproved || totalDeliveryFees <= 10000}
          formatPrice={formatPrice}
        />

        <Card className="bg-muted/40 shadow-sm border-none">
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
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl">
          <div className="flex flex-col items-center p-8 text-center bg-white">
            {/* Icon */}
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 mb-6">
              <Send className="h-8 w-8 text-blue-600 ml-1" />
            </div>

            {/* Header */}
            <h2 className="text-xl font-bold text-slate-900 mb-2">Ready to send?</h2>
            <p className="text-sm text-slate-500 mb-8 max-w-[280px]">
              You are about to email purchase orders to <strong>{supplierGroups.length} supplier{supplierGroups.length > 1 ? 's' : ''}</strong>.
            </p>

            {/* Summary Ticket */}
            <div className="w-full bg-slate-50 rounded-xl p-4 mb-4 border border-slate-100">
              <div className="flex justify-between items-center py-2 border-b border-slate-200/60 last:border-0">
                <span className="text-sm text-slate-500">Suppliers</span>
                <span className="text-sm font-semibold text-slate-900 text-right">
                  {supplierGroups.map(([, g]) => g.supplierName).join(', ')}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-200/60 last:border-0">
                <span className="text-sm text-slate-500">Total Items</span>
                <span className="text-sm font-semibold text-slate-900">
                  {items.reduce((acc, item) => acc + item.quantity, 0)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 last:border-0">
                <span className="text-sm text-slate-500">Total Value</span>
                <span className={cn(
                  "text-sm font-bold",
                  grandTotal === 0 || missingPriceCount > 0 ? "text-amber-600" : "text-slate-900"
                )}>
                  {grandTotal === 0 || missingPriceCount > 0 ? 'Pending Pricing' : formatPrice(grandTotal)}
                </span>
              </div>
            </div>

            {/* Email Sender Row */}
            <div className="w-full mb-8 flex items-center justify-between rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-[13px]">
              <div className="flex items-center gap-2 text-slate-700">
                <span className="font-medium text-slate-500">From:</span>
                {!isGmailAuthorized && !isOutlookAuthorized ? (
                  <span className="flex items-center gap-1.5">
                    Restaurant Name <span className="text-slate-400">(via Deilda)</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-slate-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[240px] text-xs">
                        <p>Orders currently send via Deilda. Connect your email to send directly from your address.</p>
                      </TooltipContent>
                    </Tooltip>
                  </span>
                ) : isGmailAuthorized ? (
                  <span className="flex items-center gap-1.5 font-medium text-slate-900">
                    {userEmail || 'your.email@gmail.com'}
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-bold text-green-700">
                      Gmail <CheckCircle className="h-3 w-3" />
                    </span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 font-medium text-slate-900">
                    {userEmail || 'your.email@outlook.com'}
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
                      Outlook <CheckCircle className="h-3 w-3" />
                    </span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {!isGmailAuthorized && !isOutlookAuthorized && !isAuthLoading && (
                  <>
                    <GmailAuthButton minimal onAuthChange={refreshAuth} />
                    <span className="text-xs text-slate-400">or</span>
                    <OutlookAuthButton minimal onAuthChange={refreshAuth} />
                  </>
                )}
                {(isGmailAuthorized || isOutlookAuthorized) && (
                  <div className="flex items-center">
                    {isGmailAuthorized ? (
                      <GmailAuthButton minimal onAuthChange={refreshAuth} />
                    ) : (
                      <OutlookAuthButton minimal onAuthChange={refreshAuth} />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="w-full space-y-3">
              <Button
                className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200/50"
                onClick={handleConfirmSend}
              >
                Send {supplierGroups.length > 1 ? 'All Orders' : 'Order'}
              </Button>
              <Button
                variant="ghost"
                className="w-full text-slate-500 hover:text-slate-900 hover:bg-transparent"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
