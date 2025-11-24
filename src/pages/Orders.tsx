
import React from 'react'
import { OrderComposer } from '@/components/orders/OrderComposer'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { AlertTriangle, RefreshCw, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import CartEmailCheckout from './CartEmailCheckout'
import { FEATURE_EMAIL_CHECKOUT_ONE_PAGE } from '@/lib/featureFlags'

import { ContentRail } from '@/components/layout/ContentRail'

function OrdersErrorFallback({ resetErrorBoundary }: { resetErrorBoundary: () => void }) {
  return (
    <Card className="mx-auto max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <CardTitle className="text-lg">Cart unavailable</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-center text-muted-foreground">
          We couldn't load your cart right now. Please try again.
        </p>

        <div className="flex flex-col gap-2">
          <Button onClick={resetErrorBoundary} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>

          <Button variant="outline" onClick={() => window.location.href = '/catalog'} className="w-full">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Browse Catalog
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}



function OrdersContent() {
  return (
    <ContentRail includeRailPadding={false}>
      <div className="mx-auto w-full max-w-[1100px] space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Cart</h1>

        <OrderComposer />
      </div>
    </ContentRail>
  )
}

export default function Orders() {
  if (FEATURE_EMAIL_CHECKOUT_ONE_PAGE) {
    return <CartEmailCheckout />
  }

  return (
    <ErrorBoundary fallback={<OrdersErrorFallback resetErrorBoundary={() => window.location.reload()} />}>
      <OrdersContent />
    </ErrorBoundary>
  )
}
