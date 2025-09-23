
import React from 'react'
import { AlertTriangle, RefreshCw, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface QuickOrderErrorFallbackProps {
  error?: Error
  resetErrorBoundary?: () => void
}

export function QuickOrderErrorFallback({ 
  error, 
  resetErrorBoundary 
}: QuickOrderErrorFallbackProps) {
  const handleRetry = () => {
    if (resetErrorBoundary) {
      resetErrorBoundary()
    } else {
      window.location.reload()
    }
  }

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <CardTitle className="text-lg">Quick Order Unavailable</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-center text-muted-foreground">
          We couldn't load the quick order interface. This might be a temporary issue.
        </p>
        
        {import.meta.env.DEV && error && (
          <details className="text-xs bg-muted p-3 rounded">
            <summary className="cursor-pointer text-muted-foreground mb-2">
              Error details (dev mode)
            </summary>
            <pre className="whitespace-pre-wrap break-all text-xs">
              {error.message}
            </pre>
          </details>
        )}

        <div className="flex flex-col gap-2">
          <Button onClick={handleRetry} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          
          <Button variant="outline" onClick={() => window.location.href = '/orders'} className="w-full">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Go to Cart Instead
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
