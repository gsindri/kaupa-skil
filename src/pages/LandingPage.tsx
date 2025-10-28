import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/useAuth'
import { Navigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { PublicNavigation } from '@/components/layout/PublicNavigation'
import { CatalogGridWrapper } from '@/components/landing/CatalogGridWrapper'
import { useAutoHideHeader } from '@/hooks/useAutoHideHeader'

import heroImage from '@/assets/frontpagepic.png'

export default function LandingPage() {
  const { user, isInitialized, loading } = useAuth()
  const [appEntered, setAppEntered] = useState(false)

  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches

  useAutoHideHeader({
    headerId: 'public-header',
    spacerId: 'public-header-spacer',
    thresholdPx: 24,
    minVelocity: 2,
    disabled: !appEntered || reduceMotion
  })

  // Detect when app viewport threshold is reached (~80%)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setAppEntered(entry.intersectionRatio > 0.8)
      },
      { threshold: [0, 0.2, 0.4, 0.6, 0.8, 1.0] }
    )
    
    const appViewport = document.getElementById('app-viewport')
    if (appViewport) observer.observe(appViewport)
    
    return () => observer.disconnect()
  }, [])

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
    <div className="landing-container min-h-screen bg-background">
      {/* Navigation - stable throughout scroll */}
      <PublicNavigation catalogVisible={appEntered} />

      {/* Hero Layer - pins at top and peels away */}
      <div 
        className="hero-layer sticky top-0 h-screen overflow-hidden"
        style={{
          zIndex: 1,
          willChange: 'clip-path, opacity'
        }}
      >
        {/* Hybrid background: soft gradient + light grid with edge fade */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Gradient base layer */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, #F9FAFB 0%, #F4F6FB 45%, #E8EDF5 100%)'
            }}
          />

          {/* Grid overlay with radial fade */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(0, 0, 0, 0.03) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(0, 0, 0, 0.03) 1px, transparent 1px)
              `,
              backgroundSize: '72px 72px',
              maskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%, black 40%, transparent 100%)',
              WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%, black 40%, transparent 100%)'
            }}
          />
          <div
            className="absolute inset-x-0 bottom-0 h-1/3"
            style={{
              background: 'linear-gradient(to top, rgba(148, 163, 184, 0.14), transparent)'
            }}
          />
        </div>

        {/* Hero Content */}
        <div 
          className="relative h-full"
          style={{
            paddingLeft: 'var(--layout-rail, 72px)'
          }}
        >
          <div
            className="mx-auto w-full h-full flex items-center"
            style={{
              maxWidth: '1600px',
              paddingInline: 'clamp(1.5rem, 4vw, 4rem)'
            }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-12 lg:gap-16 items-center w-full">
              {/* Left: Content */}
              <div className="text-left">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-extrabold text-foreground mb-6 leading-[1.08]">
                  A <span className="relative inline-block">
                    simpler
                    <span
                      className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-warning to-accent rounded-full animate-fade-in"
                      style={{ animationDelay: '120ms' }}
                    />
                  </span> way to order from your suppliers.
                </h1>
                <p className="text-base md:text-lg text-muted-foreground mb-10 max-w-[500px]">
                  Browse, compare, and order — all in one shared catalog.
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
                  <Button
                    asChild
                    size="lg"
                    className="text-base relative group overflow-hidden transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/20"
                  >
                    <a 
                      href="#app-viewport"
                      onClick={(e) => {
                        e.preventDefault()
                        document.getElementById('app-viewport')?.scrollIntoView({ behavior: 'smooth' })
                      }}
                    >
                      <span className="relative z-10">Explore catalog</span>
                    </a>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="text-base"
                  >
                    <Link to="/login">Log in</Link>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground/80 mt-6 tracking-wide">
                  No account needed — just start browsing.
                </p>
              </div>

              {/* Right: Visual Element */}
              <div className="relative hidden lg:flex justify-end">
                <div className="relative max-w-[520px] rounded-3xl overflow-hidden shadow-[0_40px_120px_rgba(15,23,42,0.12)] border border-primary/10">
                  <img
                    src={heroImage}
                    alt="Professional chef managing inventory in a modern kitchen"
                    className="w-full h-full object-cover brightness-[1.08] saturate-[0.94]"
                  />
                  <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_40px_rgba(15,23,42,0.08)]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* App Viewport - revealed from underneath with zoom/blur effect */}
      <div 
        id="app-viewport"
        className="app-viewport min-h-screen relative bg-background"
        style={{
          zIndex: 2,
          willChange: 'filter, transform'
        }}
      >
        <main 
          className="relative"
          style={{
            paddingLeft: 'var(--layout-rail, 72px)'
          }}
        >
          <div
            className="mx-auto w-full"
            style={{
              maxWidth: '1600px',
              paddingInline: 'clamp(1.5rem, 4vw, 4rem)'
            }}
          >
            {/* Catalog Preview Section */}
            <section 
              id="catalog" 
              className="py-12 md:py-16 scroll-mt-[80px]"
            >
              <div className="mb-8">
                <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
                  Browse the catalog
                </h2>
                <p className="text-base text-muted-foreground">
                  See what's available — no account needed.
                </p>
              </div>
              
              {/* Mount the actual catalog grid */}
              <CatalogGridWrapper />
            </section>

            {/* Benefits Section */}
            <section className="py-10 md:py-12 bg-muted/30 rounded-3xl mt-8">
              <div className="max-w-[1000px] mr-auto px-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="flex items-start gap-3 p-4 rounded-2xl hover:bg-background/50 transition-all duration-200 hover:-translate-y-1 group">
                    <div className="w-2 h-2 rounded-full bg-warning mt-2 flex-shrink-0 group-hover:scale-150 transition-transform" />
                    <p className="text-base leading-7 text-foreground">
                      Compare prices across wholesalers.
                    </p>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-2xl hover:bg-background/50 transition-all duration-200 hover:-translate-y-1 group">
                    <div className="w-2 h-2 rounded-full bg-warning mt-2 flex-shrink-0 group-hover:scale-150 transition-transform" />
                    <p className="text-base leading-7 text-foreground">
                      See what's in stock before you order.
                    </p>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-2xl hover:bg-background/50 transition-all duration-200 hover:-translate-y-1 group">
                    <div className="w-2 h-2 rounded-full bg-warning mt-2 flex-shrink-0 group-hover:scale-150 transition-transform" />
                    <p className="text-base leading-7 text-foreground">
                      No juggling multiple supplier sites.
                    </p>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-2xl hover:bg-background/50 transition-all duration-200 hover:-translate-y-1 group">
                    <div className="w-2 h-2 rounded-full bg-warning mt-2 flex-shrink-0 group-hover:scale-150 transition-transform" />
                    <p className="text-base leading-7 text-foreground">
                      No spreadsheets — just ordering.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>

        {/* Footer spacing */}
        <div className="pb-12"></div>
      </div>
    </div>
  )
}
