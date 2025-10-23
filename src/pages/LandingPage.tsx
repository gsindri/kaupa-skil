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
    <div className="min-h-screen bg-background relative">
      {/* Subtle background texture */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--foreground) / 0.03) 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }}
      />
      
      <PublicNavigation />
      
      <main className="mx-auto max-w-[1200px] px-6 relative">
        {/* Hero Section - Asymmetric Layout */}
        <section className="py-20 md:py-28 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-[58%_42%] gap-12 lg:gap-16 items-center">
            {/* Left: Content */}
            <div className="text-left">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-extrabold text-foreground mb-8 leading-[1.1]">
                A <span className="relative inline-block">
                  simpler
                  <span className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-warning to-accent rounded-full" />
                </span> way to order from your suppliers.
              </h1>
              <p className="text-base md:text-lg text-muted-foreground mb-10 max-w-[500px]">
                Browse, compare, and order — all in one shared catalog.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  asChild 
                  size="lg" 
                  className="text-base relative group overflow-hidden transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-primary/20"
                >
                  <Link to="/catalog">
                    <span className="relative z-10">Explore catalog</span>
                  </Link>
                </Button>
                <Button 
                  asChild 
                  variant="outline" 
                  size="lg" 
                  className="text-base hover:scale-105 transition-transform duration-200"
                >
                  <Link to="/login">Log in</Link>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-6 tracking-wide">
                No account needed — just start browsing.
              </p>
            </div>

            {/* Right: Visual Element */}
            <div className="relative hidden lg:block">
              <div className="relative p-8 rounded-3xl bg-gradient-to-br from-primary/5 via-accent/5 to-warning/5 border border-primary/10 shadow-lg backdrop-blur-sm">
                <div className="space-y-8">
                  <div>
                    <div className="text-5xl font-bold font-display bg-gradient-to-r from-primary via-accent to-warning bg-clip-text text-transparent mb-2">
                      10,000+
                    </div>
                    <div className="text-sm text-muted-foreground">Products available</div>
                  </div>
                  <div>
                    <div className="text-5xl font-bold font-display bg-gradient-to-r from-primary via-accent to-warning bg-clip-text text-transparent mb-2">
                      50+
                    </div>
                    <div className="text-sm text-muted-foreground">Suppliers to compare</div>
                  </div>
                  <div>
                    <div className="text-5xl font-bold font-display bg-gradient-to-r from-primary via-accent to-warning bg-clip-text text-transparent mb-2">
                      100%
                    </div>
                    <div className="text-sm text-muted-foreground">Price transparency</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-10 md:py-12 bg-muted/30 rounded-3xl">
          <div className="max-w-[1000px] mx-auto px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-start gap-3 p-4 rounded-2xl hover:bg-background/50 transition-all duration-200 hover:-translate-y-1 group">
                <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-primary to-accent mt-2 flex-shrink-0 group-hover:scale-150 transition-transform" />
                <p className="text-base leading-relaxed text-foreground">
                  Compare prices across wholesalers.
                </p>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-2xl hover:bg-background/50 transition-all duration-200 hover:-translate-y-1 group">
                <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-accent to-warning mt-2 flex-shrink-0 group-hover:scale-150 transition-transform" />
                <p className="text-base leading-relaxed text-foreground">
                  See what's in stock before you order.
                </p>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-2xl hover:bg-background/50 transition-all duration-200 hover:-translate-y-1 group">
                <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-warning to-primary mt-2 flex-shrink-0 group-hover:scale-150 transition-transform" />
                <p className="text-base leading-relaxed text-foreground">
                  No juggling multiple supplier sites.
                </p>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-2xl hover:bg-background/50 transition-all duration-200 hover:-translate-y-1 group">
                <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-primary via-accent to-warning mt-2 flex-shrink-0 group-hover:scale-150 transition-transform" />
                <p className="text-base leading-relaxed text-foreground">
                  No spreadsheets — just ordering.
                </p>
              </div>
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
