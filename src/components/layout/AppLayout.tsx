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

  const isPinned = useCallback(() => {
    const el = internalHeaderRef.current
    if (!el) return false

    const ae = document.activeElement
    const menuOpen = el.querySelector('[data-state="open"]')
    if (menuOpen) return true

    if (ae && el.contains(ae) && isTypeableElement(ae)) return true

    return false
  }, [])

  const { ref: scrollHideRef, handleLockChange, reset: resetHeaderScrollHide } = useHeaderScrollHide({ isPinned })

  const combinedHeaderRef = useCallback(
    (node: HTMLDivElement | null) => {
      internalHeaderRef.current = node
      scrollHideRef(node as HTMLElement)
      if (typeof headerRef === 'function') headerRef(node)
      else if (headerRef && 'current' in headerRef)
        (headerRef as MutableRefObject<HTMLDivElement | null>).current = node
    },
    [headerRef, scrollHideRef]
  )

  const hasSecondary = !!secondary
  const showSecondary = hasSecondary && panelOpen


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

        {/* Header wrapper - full width, stays visible */}
        <div
          id="catalogHeader"
          data-app-header="true"
          data-chrome-layer
          ref={combinedHeaderRef}
          className={cn(headerClassName)}
          style={{
            position: 'fixed',
            top: 0,
            left: 'var(--layout-rail, 72px)',
            right: 0,
            zIndex: 'var(--z-header,55)',
          }}
        >
          <AppChrome />
          <TopNavigation />

          {headerNode ? (
            <div
              className="mx-auto w-full"
              style={{
                maxWidth: 'var(--page-max)',
                paddingInline: 'var(--page-gutter)',
              }}
            >
              {headerNode}
            </div>
          ) : null}
        </div>
        
        {/* Spacer to prevent content jump when header is fixed */}
        <div 
          style={{ 
            height: 'var(--header-h, 56px)',
            marginLeft: 'var(--layout-rail, 72px)',
            transition: 'height 200ms ease-in-out'
          }} 
          aria-hidden="true"
        />

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
              ref={contentRef}
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
                  marginInline: 'auto',
                  maxWidth: 'var(--page-max)',
                  width: '100%',
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
