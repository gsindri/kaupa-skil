import React, {
  ReactNode,
  useLayoutEffect,
  useMemo,
  type CSSProperties
} from 'react'
import clsx from 'clsx'
import { cn } from '@/lib/utils'
import { Outlet } from 'react-router-dom'
import { PrimaryNavRail } from './PrimaryNavRail'
import { AuthenticatedHeader } from './AuthenticatedHeader'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { useAutoHideHeader } from '@/hooks/useAutoHideHeader'
import { useCart } from '@/contexts/useBasket'
import { useMediaQuery } from '@/hooks/useMediaQuery'

interface AppLayoutProps {
  header?: ReactNode
  secondary?: ReactNode
  panelOpen?: boolean
  children?: ReactNode
  headerClassName?: string
}

type GridVars = CSSProperties & { '--filters-w'?: string }

export function AppLayout({
  header,
  children,
  headerClassName,
  secondary,
  panelOpen = true
}: AppLayoutProps) {
  const { isDrawerOpen } = useCart()
  const isDesktopCart = useMediaQuery('(min-width: 1024px)')
  const shouldShowCartRail = isDesktopCart && isDrawerOpen

  const hasSecondary = !!secondary
  const showSecondary = hasSecondary && panelOpen

  // Check if modal/dialog is open to disable auto-hide
  const modalOpen = !!document.querySelector('[role="dialog"][data-state="open"]')
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches

  useAutoHideHeader({
    headerId: 'authenticated-header',
    spacerId: 'authenticated-header-spacer',
    thresholdPx: 24,
    minVelocity: 2,
    disabled: modalOpen || reduceMotion
  })

  const filtersWidth = useMemo(
    () => (showSecondary ? 'clamp(280px, 24vw, 360px)' : '0px'),
    [showSecondary]
  )

  const cartWidth = useMemo(
    () => (shouldShowCartRail ? 'var(--cart-rail-w, 240px)' : '0px'),
    [shouldShowCartRail]
  )

  const gridStyle = useMemo<GridVars | undefined>(() => {
    const cols: string[] = []
    if (showSecondary) cols.push('var(--filters-w, 0px)')
    cols.push('minmax(0, 1fr)')
    if (shouldShowCartRail) cols.push(cartWidth)

    return {
      '--filters-w': filtersWidth,
      gridTemplateColumns: cols.join(' '),
      transition: 'grid-template-columns var(--cart-rail-transition, 240ms)',
    }
  }, [showSecondary, filtersWidth, shouldShowCartRail, cartWidth])

  const contentGridColumn = useMemo(() => {
    if (showSecondary) return '2 / span 1'
    if (isDesktopCart) return '1 / span 1'
    return '1 / -1'
  }, [showSecondary, isDesktopCart])

  const cartGridColumn = useMemo(() => {
    if (!isDesktopCart) return undefined
    return showSecondary ? '3 / span 1' : '2 / span 1'
  }, [isDesktopCart, showSecondary])

  return (
    <div className="relative min-h-screen">
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

      {/* Right content area */}
      <div
        className="app-shell-content flex min-h-screen flex-col"
        style={{
          marginLeft: 'var(--layout-rail,72px)',
        }}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only absolute left-2 top-2 z-[var(--z-header,50)] px-3 py-2 rounded bg-[var(--button-primary)] text-white"
        >
          Skip to content
        </a>

        {/* Header wrapper - full width, uses fixed positioning via hook */}
        <AuthenticatedHeader className={headerClassName}>
          {header}
        </AuthenticatedHeader>

        {/* Main content */}
        <div className="pb-8 pt-2">
          <div
            className={clsx(
              'page-grid items-start',
              hasSecondary && 'page-grid--with-secondary'
            )}
            data-has-secondary={showSecondary ? 'true' : undefined}
            style={gridStyle}
          >
            {hasSecondary && (
              <aside
                className={cn(
                  'hidden min-w-0 overflow-hidden lg:flex lg:flex-col',
                  'transition-[width,box-shadow] duration-[var(--filters-transition,200ms)]',
                  'motion-reduce:transition-none',
                  showSecondary ? 'lg:pointer-events-auto' : 'lg:pointer-events-none',
                  showSecondary && 'shadow-[8px_0_32px_rgba(0,0,0,0.12)]'
                )}
                style={{
                  gridColumn: '1 / span 1',
                  position: 'sticky',
                  top: 'var(--header-h, 56px)',
                  height: 'calc(100vh - var(--header-h, 56px))',
                  width: 'var(--filters-w, 0px)',
                  zIndex: 70,
                  background: 'hsl(var(--background))',
                  display: showSecondary ? undefined : 'none',
                }}
                aria-hidden={!showSecondary}
              >
                {secondary}
              </aside>
            )}
            <div
              className="page-grid__content min-w-0 w-full"
              style={{
                gridColumn: contentGridColumn,
              }}
            >
              <main
                id="main-content"
                className="w-full min-w-0"
                style={{
                  minHeight: 'calc(100vh - var(--header-h, 56px))',
                  paddingInline: 'var(--page-gutter)',
                }}
              >
                {children ?? <Outlet />}
              </main>
            </div>
            {shouldShowCartRail && isDesktopCart && <CartDrawer />}
            {isDesktopCart && (
              <div
                aria-hidden={!isDesktopCart}
                style={{ gridColumn: cartGridColumn }}
              >
                <CartDrawer />
              </div>
            )}
            {!isDesktopCart && <CartDrawer />}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AppLayout
