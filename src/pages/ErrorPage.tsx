
import { Link, isRouteErrorResponse, useRouteError } from "react-router-dom"
import { AlertTriangle, Home, RefreshCw, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ErrorPage() {
  const error = useRouteError()

  let title = "Something went wrong"
  let message = "Please try again or contact support."
  let showDetails = false

  if (isRouteErrorResponse(error)) {
    title = `${error.status} ${error.statusText}`
    message = error.data || message
    showDetails = true
  } else if (error instanceof Error) {
    title = "Application Error"
    message = import.meta.env.DEV ? error.message : "An unexpected error occurred."
    showDetails = import.meta.env.DEV
  }

  const handleReload = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="mx-auto max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">{message}</p>
          
          {showDetails && error instanceof Error && (
            <details className="text-xs bg-muted p-3 rounded">
              <summary className="cursor-pointer text-muted-foreground mb-2">
                Error details (for developers)
              </summary>
              <pre className="whitespace-pre-wrap break-all text-xs">
                {error.stack || error.message}
              </pre>
            </details>
          )}

          <div className="flex flex-col gap-2">
            <Button onClick={handleReload} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            
            <div className="flex gap-2">
              <Button variant="outline" asChild className="flex-1">
                <Link to="/">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Link>
              </Button>
              <Button variant="outline" asChild className="flex-1">
                <Link to="/cart">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Cart
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
