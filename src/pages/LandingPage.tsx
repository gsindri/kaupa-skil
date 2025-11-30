import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/useAuth'
import { Navigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { PublicNavigation } from '@/components/layout/PublicNavigation'
import { CatalogGridWrapper } from '@/components/landing/CatalogGridWrapper'
import { OrderingFlowDiagram } from '@/components/OrderingFlowDiagram'
import { PrimaryNavRail } from '@/components/layout/PrimaryNavRail'
import FloatingLines from '@/components/effects/FloatingLines'

import { cn } from '@/lib/utils'
import { useHeaderScrollHide } from '@/components/layout/useHeaderScrollHide'

export default function LandingPage() {
  const { user, isInitialized, loading } = useAuth()
  const [appEntered, setAppEntered] = useState(false)

  // Allow auto-hide behavior everywhere on landing page
  const isPinned = useCallback(() => {
    return false
  }, [])

  // Integrate scroll-hide hook with ref callback
  const { ref: headerRef } = useHeaderScrollHide({ isPinned })

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
      {/* Left rail - fixed position */}
      <aside
        data-rail
        className="fixed top-0 left-0 h-screen"
        style={{
          width: 'var(--layout-rail,72px)',
          zIndex: 'var(--z-rail, 60)'
        }}
      >
        <PrimaryNavRail />
      </aside>

      {/* Navigation - stable throughout scroll */}
      <PublicNavigation headerRef={headerRef} catalogVisible={appEntered} />

      {/* Hero Layer - pins at top and peels away */}
      <div
        className="hero-layer sticky top-0 h-screen overflow-hidden pl-[var(--layout-rail,72px)]"
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

          {/* Floating Lines Effect */}
          <div className="absolute inset-0">
            <FloatingLines
              enabledWaves={['top', 'middle', 'bottom']}
              lineCount={[8, 12, 15]}
              lineDistance={[6, 5, 4]}
              topWavePosition={{ x: 10.0, y: 0.5, rotate: -0.4 }}
              middleWavePosition={{ x: 5.0, y: 0.0, rotate: 0.2 }}
              bottomWavePosition={{ x: 2.0, y: -0.7, rotate: 0.4 }}
              animationSpeed={0.8}
              interactive={true}
              bendRadius={5.0}
              bendStrength={-0.5}
              parallax={true}
              parallaxStrength={0.15}
              mixBlendMode="screen"
              linesGradient={['#E8EDF5', '#F4F6FB', '#FFFFFF']}
            />
          </div>

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
        <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 py-16">
            {/* Left: Text and Buttons */}
            <div className="flex-1 text-left">
              <h1 className="text-5xl md:text-6xl font-display font-extrabold text-foreground leading-tight mb-6">
                <span className="block">
                  The easiest way to{' '}
                  <span
                    className="relative inline-block text-primary"
                    style={{ animationDelay: '0ms' }}
                  >
                    order
                  </span>
                </span>
                <span className="block">
                  <span
                    className="relative inline-block text-primary"
                    style={{ animationDelay: '60ms' }}
                  >
                    wholesale
                  </span>{' '}
                  products
                </span>
                <span className="block">
                  <span
                    className="relative inline-block text-primary"
                    style={{ animationDelay: '120ms' }}
                  >
                    online
                  </span>
                </span>
              </h1>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 mb-12">
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
            </div>

            {/* Right: Diagram */}
            <div className="relative hidden lg:flex items-center justify-center">
              <div className="w-full transform scale-75 origin-center">
                <OrderingFlowDiagram />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* App Viewport - revealed from underneath with zoom/blur effect */}
      <div
        id="app-viewport"
        className="app-viewport min-h-screen relative bg-background pl-[var(--layout-rail,72px)]"
        style={{
          zIndex: 2,
          // Pull the container up behind the header so sticky children
          // have room to stick at header-h position
          marginTop: 'calc(-1 * var(--header-h, 56px))',
          paddingTop: 'var(--header-h, 56px)',
        }}
      >
        <main className="relative">
          {/* Catalog Preview Section - Full Width for Toolbar */}
          <section
            id="catalog"
            className="pt-2 pb-4 md:pt-4 md:pb-6 scroll-mt-[80px]"
          >
            <div className="mx-auto w-full max-w-screen-xl px-5 md:px-6 lg:px-8 mb-2 relative z-50">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
                Browse the catalog
              </h2>
            </div>

            {/* Mount the actual catalog grid - Full Width */}
            <CatalogGridWrapper />
          </section>

          <div className="mx-auto w-full max-w-screen-xl px-5 md:px-6 lg:px-8">
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
