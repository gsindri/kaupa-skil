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
  const layoutPaddingRef = useRef<HTMLDivElement | null>(null)
  const { isDrawerOpen } = useCart()
  const isDesktopCart = useMediaQuery('(min-width: 1024px)')
  const isWideViewport = useMediaQuery('(min-width: 1600px)')
  const isCartOpen = isDesktopCart && isDrawerOpen
  const cartMode = isWideViewport ? 'inset' : 'overlay'
  const baseShellWidth = 'calc(100% - var(--layout-rail, 72px))'
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
    const ae = document.activeElement
    const menuOpen = el?.querySelector('[data-open="true"]')
    return window.scrollY < 1 || !!menuOpen || isTypeableElement(ae)
  }, [])

  const handleLockChange = useHeaderScrollHide(internalHeaderRef, { isPinned })

  useLayoutEffect(() => {
    const rail = document.querySelector('[data-rail]')
    if (rail instanceof HTMLElement) {
      document.documentElement.style.setProperty('--header-left', `${rail.offsetWidth}px`)
    }
  }, [])

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return

    const root = document.documentElement

    const updateMetrics = () => {
      const headerHeight = internalHeaderRef.current?.getBoundingClientRect().height
      if (headerHeight) {
        root.style.setProperty('--cart-rail-top', `${headerHeight}px`)
        root.style.setProperty('--header-h', `${headerHeight}px`)
      }

      const layoutEl = layoutPaddingRef.current
      if (layoutEl) {
        const styles = window.getComputedStyle(layoutEl)
        const paddingRight = styles.paddingRight
        const basePad = styles.getPropertyValue('--page-content-pad')?.trim()
        const gapValue = basePad && basePad.length > 0 ? basePad : paddingRight

        if (gapValue) {
          root.style.setProperty('--cart-rail-gap', gapValue)
        }
      }
    }

    updateMetrics()

    let resizeObserver: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(updateMetrics)
      const headerEl = internalHeaderRef.current
      if (headerEl) resizeObserver.observe(headerEl)
      const layoutEl = layoutPaddingRef.current
      if (layoutEl) resizeObserver.observe(layoutEl)
    }

    window.addEventListener('resize', updateMetrics)

    return () => {
      resizeObserver?.disconnect()
      window.removeEventListener('resize', updateMetrics)
      root.style.removeProperty('--cart-rail-gap')
      root.style.removeProperty('--cart-rail-top')
      root.style.removeProperty('--header-h')
    }
  }, [])


  const headerNode =
    header && React.isValidElement(header)
      ? React.cloneElement(header as ReactElement<any>, { onLockChange: handleLockChange })
      : header

  const filtersWidth = useMemo(
    () => (showSecondary ? 'clamp(280px, 24vw, 360px)' : '0px'),
    [showSecondary]
  )

  const gridStyle = useMemo<GridVars | undefined>(() => {
    if (!hasSecondary) return undefined
    return {
      '--filters-w': filtersWidth,
      gridTemplateColumns: 'var(--filters-w, 0px) minmax(0, 1fr)',
      transition: 'grid-template-columns var(--enter)',
    }
  }, [hasSecondary, filtersWidth])

  return (
    <div
      id="app-shell"
      className="relative min-h-screen"
      data-cart-open={isCartOpen ? 'true' : 'false'}
      data-cart-mode={cartMode}
    >
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
          width: baseShellWidth,
        }}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only absolute left-2 top-2 z-[var(--z-header,50)] px-3 py-2 rounded bg-[var(--button-primary)] text-white"
        >
          Skip to content
        </a>
        <AppChrome />
        {/* Header */}
        <div
          id="catalogHeader"
          data-app-header="true"
          data-chrome-layer
          ref={combinedHeaderRef}
          className={clsx('topbar', headerClassName)}
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 'var(--z-header,50)',
            isolation: 'isolate',
          }}
        >
          <TopNavigation />
          {headerNode}
        </div>

        {/* Main content */}
        <div
          className="page-content pb-8 pt-2"
          ref={layoutPaddingRef}
        >
          <div
            className={clsx(
              'page-grid items-start gap-3',
              hasSecondary && 'page-grid--with-secondary'
            )}
            data-has-secondary={showSecondary ? 'true' : undefined}
          >
            <div
              className={clsx(
                'page-grid__content mx-auto grid w-full items-start gap-6 max-w-none',
                hasSecondary ? 'lg:max-w-[1600px]' : 'lg:grid-cols-1'
              )}
              ref={contentRef}
              style={gridStyle}
            >
              {hasSecondary && (
                <aside
                  className={cn(
                    'relative hidden min-w-0 overflow-hidden lg:flex lg:flex-col',
                    'transition-[width] duration-[var(--filters-transition,200ms)] ease-[var(--ease-snap)]',
                    'motion-reduce:transition-none',
                    showSecondary ? 'lg:pointer-events-auto' : 'lg:pointer-events-none'
                  )}
                  style={{
                    width: showSecondary ? 'var(--filters-w, 320px)' : '0px',
                  }}
                  aria-hidden={!showSecondary}
                >
                  {secondary}
                </aside>
              )}
              <main
                id="main-content"
                className="w-full min-w-0"
                style={{ minHeight: 'calc(100vh - var(--header-h, 56px))' }}
              >
                {children ?? <Outlet />}
              </main>
            </div>
            <CartDrawer />
          </div>
        </div>
      </div>
    </div>
  )
}

export default AppLayout
