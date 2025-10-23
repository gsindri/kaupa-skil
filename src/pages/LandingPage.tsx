import React from 'react'
import { useAuth } from '@/contexts/useAuth'
import { Navigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { PublicNavigation } from '@/components/layout/PublicNavigation'

export default function LandingPage() {
  const { user, isInitialized, loading } = useAuth()

  // Show loading state while checking authentication
  if (loading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect authenticated users to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicNavigation />
      
      <main className="mx-auto max-w-[1200px] px-6">
        {/* Hero Section */}
        <section className="py-16 md:py-20 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            A simpler way to order from your suppliers.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-[600px] mx-auto">
            Browse, compare, and order — all in one shared catalog.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-base">
              <Link to="/catalog">Explore catalog</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base">
              <Link to="/login">Log in</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            No account needed — just start browsing.
          </p>
        </section>

        {/* Benefits Section */}
        <section className="py-10 md:py-12 bg-muted/30">
          <div className="max-w-[1000px] mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-base text-foreground">
              <p className="leading-relaxed">
                Compare prices across wholesalers.
              </p>
              <p className="leading-relaxed">
                See what's in stock before you order.
              </p>
              <p className="leading-relaxed">
                No juggling multiple supplier sites.
              </p>
              <p className="leading-relaxed">
                No spreadsheets — just ordering.
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-12 md:py-16 text-center">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-6">
            Ready to simplify your ordering?
          </h2>
          <Button asChild size="lg" className="text-base">
            <Link to="/catalog">Explore catalog</Link>
          </Button>
        </section>
      </main>

      {/* Footer spacing */}
      <div className="pb-12"></div>
    </div>
  )
}
