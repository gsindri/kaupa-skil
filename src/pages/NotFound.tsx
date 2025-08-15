
import { useLocation, Link } from "react-router-dom"
import { useEffect } from "react"
import { Home, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const NotFound = () => {
  const location = useLocation()

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    )
  }, [location.pathname])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="mx-auto max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold mb-2">404</CardTitle>
          <p className="text-xl text-muted-foreground">Page not found</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
          
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Link>
            </Button>
            
            <Button variant="outline" onClick={() => window.history.back()} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default NotFound
