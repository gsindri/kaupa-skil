import React, {
  ReactNode,
  useCallback,
  useLayoutEffect,
  useRef,
  MutableRefObject,
  ReactElement,
  useMemo,
  type CSSProperties
} from 'react'
import clsx from 'clsx'
import { cn } from '@/lib/utils'
import { Outlet } from 'react-router-dom'
import { TopNavigation } from './TopNavigation'
import { PrimaryNavRail } from './PrimaryNavRail'
import { AppChrome } from './AppChrome'
import { CartDrawer } from '@/components/cart/CartDrawer'
import useHeaderScrollHide from './useHeaderScrollHide'
import { isTypeableElement } from './isTypeableElement'
import { useCart } from '@/contexts/useBasket'
import { useMediaQuery } from '@/hooks/useMediaQuery'

interface AppLayoutProps {
  header?: ReactNode
  secondary?: ReactNode
  panelOpen?: boolean
  children?: ReactNode
  headerRef?: React.Ref<HTMLDivElement>
  headerClassName?: string
}

type GridVars = CSSProperties & { '--filters-w'?: string }

export function AppLayout({
  header,
  children,
  headerRef,
  headerClassName,
  secondary,
  panelOpen = true
}: AppLayoutProps) {
  const internalHeaderRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const { isDrawerOpen } = useCart()
  const isDesktopCart = useMediaQuery('(min-width: 1024px)')
  const shouldShowCartRail = isDesktopCart && isDrawerOpen
  const combinedHeaderRef = useCallback(
    (node: HTMLDivElement | null) => {
      internalHeaderRef.current = node
      if (typeof headerRef === 'function') headerRef(node)
      else if (headerRef && 'current' in headerRef)
        (headerRef as MutableRefObject<HTMLDivElement | null>).current = node
    },
    [headerRef]
  )


  const hasSecondary = !!secondary
  const showSecondary = hasSecondary && panelOpen

  const isPinned = useCallback(() => {
    const el = internalHeaderRef.current
    if (!el) return false

    const ae = document.activeElement
    const menuOpen = el.querySelector('[data-state="open"]')
    if (menuOpen) return true

    if (ae && el.contains(ae) && isTypeableElement(ae)) return true

    return false
  }, [])

  const { handleLockChange, reset: resetHeaderScrollHide } = useHeaderScrollHide(internalHeaderRef, { isPinned })

  useLayoutEffect(() => {
    const sidebarWidth = showSecondary ? 'clamp(280px, 24vw, 360px)' : '0px'
    document.documentElement.style.setProperty('--sidebar-push', sidebarWidth)
  }, [showSecondary])

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return

    const root = document.documentElement

    const updateMetrics = () => {
      const headerHeight = internalHeaderRef.current?.getBoundingClientRect().height
      if (headerHeight) {
        root.style.setProperty('--header-h', `${headerHeight}px`)
      }
    }

    updateMetrics()

    let resizeObserver: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(updateMetrics)
      const headerEl = internalHeaderRef.current
      if (headerEl) resizeObserver.observe(headerEl)
    }

    window.addEventListener('resize', updateMetrics)

    return () => {
      resizeObserver?.disconnect()
      window.removeEventListener('resize', updateMetrics)
      root.style.removeProperty('--header-h')
    }
  }, [])

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return
    
    // When filter sidebar toggles, reset header scroll-hide state
    // Small delay ensures layout has settled before reset
    const timeoutId = setTimeout(() => {
      resetHeaderScrollHide()
    }, 50)
    
    return () => clearTimeout(timeoutId)
  }, [showSecondary, resetHeaderScrollHide])


  const headerNode =
    header && React.isValidElement(header)
      ? React.cloneElement(header as ReactElement<any>, { onLockChange: handleLockChange })
      : header

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
    if (hasSecondary) cols.push('var(--filters-w, 0px)')
    cols.push('minmax(0, 1fr)')
    if (isDesktopCart) cols.push(cartWidth)
    
    return {
      '--filters-w': filtersWidth,
      gridTemplateColumns: cols.join(' '),
      transition: 'grid-template-columns var(--cart-rail-transition, 240ms)',
    }
  }, [hasSecondary, filtersWidth, isDesktopCart, cartWidth])

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

        {/* Header wrapper - full width, stays visible */}
        <div
          id="catalogHeader"
          data-app-header="true"
          data-chrome-layer
          ref={combinedHeaderRef}
          className={cn(headerClassName)}
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 'var(--z-header,55)',
          }}
        >
          <AppChrome />
          <TopNavigation />
          
          {/* Only FiltersBar shifts with sidebar */}
          {headerNode && (
            <div
              className="transition-[margin-left] duration-[var(--filters-transition,200ms)] motion-reduce:transition-none"
              style={{
                marginLeft: 'var(--sidebar-push, 0px)',
              }}
            >
              {headerNode}
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="pb-8 pt-2">
          <div
            className={clsx(
              'page-grid items-start transition-[margin-left] duration-[var(--filters-transition,200ms)]',
              'motion-reduce:transition-none',
              hasSecondary && 'page-grid--with-secondary'
            )}
            style={{
              marginLeft: 'var(--sidebar-push, 0px)',
            }}
            data-has-secondary={showSecondary ? 'true' : undefined}
          >
            <div
              className="w-full"
              ref={contentRef}
            >
              {hasSecondary && (
              <aside
                className={cn(
                  'hidden min-w-0 overflow-hidden lg:flex lg:flex-col',
                  'transition-[width] duration-[var(--filters-transition,200ms)]',
                  'motion-reduce:transition-none',
                  showSecondary ? 'lg:pointer-events-auto' : 'lg:pointer-events-none',
                )}
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 'var(--layout-rail, 72px)',
                  width: showSecondary ? 'clamp(280px, 24vw, 360px)' : '0px',
                  height: '100vh',
                  zIndex: 55,
                }}
                aria-hidden={!showSecondary}
              >
                  {secondary}
                </aside>
              )}
              <main
                id="main-content"
                className="w-full min-w-0 px-4 sm:px-6 lg:px-8"
                style={{ minHeight: 'calc(100vh - var(--header-h, 56px))' }}
              >
                {children ?? <Outlet />}
              </main>
              {isDesktopCart && <CartDrawer />}
            </div>
            {!isDesktopCart && <CartDrawer />}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AppLayout
