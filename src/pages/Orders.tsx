
import React from 'react'
import { OrderComposer } from '@/components/orders/OrderComposer'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { AlertTriangle, RefreshCw, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function OrdersErrorFallback({ resetErrorBoundary }: { resetErrorBoundary: () => void }) {
  return (
    <Card className="mx-auto max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <CardTitle className="text-lg">Orders System Unavailable</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-center text-muted-foreground">
          We couldn't load the order management system. Please try again.
        </p>
        
        <div className="flex flex-col gap-2">
          <Button onClick={resetErrorBoundary} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          
          <Button variant="outline" onClick={() => window.location.href = '/'} className="w-full">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Go to Quick Order
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function OrdersContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Order Management</h1>
        <p className="text-muted-foreground">
          Compose and dispatch orders to suppliers
        </p>
      </div>
      
      <OrderComposer />
    </div>
  )
}

export default function Orders() {
  return (
    <ErrorBoundary fallback={<OrdersErrorFallback />}>
      <OrdersContent />
    </ErrorBoundary>
  )
}
