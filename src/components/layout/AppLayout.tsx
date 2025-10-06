import React, {
  ReactNode,
  useCallback,
  useLayoutEffect,
  useRef,
  MutableRefObject,
  ReactElement,
  useMemo,
  useState,
  useEffect
} from 'react'
import clsx from 'clsx'
import { Outlet } from 'react-router-dom'
import { TopNavigation } from './TopNavigation'
import { PrimaryNavRail } from './PrimaryNavRail'
import { AppChrome } from './AppChrome'
import { CartDrawer } from '@/components/cart/CartDrawer'
import useHeaderScrollHide from './useHeaderScrollHide'
import { isTypeableElement } from './isTypeableElement'

interface AppLayoutProps {
  header?: ReactNode
  secondary?: ReactNode
  panelOpen?: boolean
  children?: ReactNode
  headerRef?: React.Ref<HTMLDivElement>
  headerClassName?: string
}

export function AppLayout({
  header,
  children,
  headerRef,
  headerClassName,
  secondary,
  panelOpen = true
}: AppLayoutProps) {
  const internalHeaderRef = useRef<HTMLDivElement>(null)
  const combinedHeaderRef = useCallback(
    (node: HTMLDivElement | null) => {
      internalHeaderRef.current = node
      if (typeof headerRef === 'function') headerRef(node)
      else if (headerRef && 'current' in headerRef)
        (headerRef as MutableRefObject<HTMLDivElement | null>).current = node
    },
    [headerRef]
  )

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

  const headerNode =
    header && React.isValidElement(header)
      ? React.cloneElement(header as ReactElement<any>, { onLockChange: handleLockChange })
      : header

  const hasSecondary = !!secondary

  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const showSecondary = hasSecondary && panelOpen
  const shouldOffset = showSecondary && isDesktop

  const layoutStyles = useMemo(
    () =>
      ({
        '--filters-panel-width': 'var(--sidebar-w, 288px)',
        '--filters-offset': shouldOffset ? 'var(--sidebar-w, 288px)' : '0px'
      }) as React.CSSProperties,
    [shouldOffset]
  )

  const shellTransform = shouldOffset
    ? 'translate3d(var(--filters-panel-width), 0, 0)'
    : undefined
  const panelTransform = showSecondary
    ? 'translate3d(0, 0, 0)'
    : isDesktop
      ? 'translate3d(calc(-1 * var(--filters-panel-width)), 0, 0)'
      : 'translate3d(-100%, 0, 0)'
  const panelWidth = isDesktop
    ? 'var(--filters-panel-width)'
    : 'min(100vw, var(--filters-panel-width))'

  return (
    <div className="relative min-h-screen" style={layoutStyles}>
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
        className="flex min-h-screen flex-col"
        style={{ marginLeft: 'var(--layout-rail,72px)' }}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only absolute left-2 top-2 z-[var(--z-header,50)] px-3 py-2 rounded bg-[var(--button-primary)] text-white"
        >
          Skip to content
        </a>
        <AppChrome offsetX={shouldOffset ? 'var(--filters-panel-width)' : '0px'} />

        {hasSecondary && (
          <aside
            id="catalog-filters-panel"
            aria-hidden={!showSecondary}
            aria-modal="false"
            aria-labelledby="catalog-filters-title"
            role="dialog"
            className="fixed bottom-0 top-0 transition-transform duration-300 ease-out motion-reduce:transition-none"
            style={{
              left: 'var(--layout-rail,72px)',
              width: panelWidth,
              transform: panelTransform,
              zIndex: 'calc(var(--z-header, 55) - 1)'
            }}
          >
            <div className="flex h-full flex-col overflow-y-auto border-r border-slate-200 bg-white shadow-xl">
              {secondary}
            </div>
          </aside>
        )}

        <div
          className={clsx(
            'flex min-h-screen flex-col transition-transform duration-300 ease-out motion-reduce:transition-none will-change-transform',
            shouldOffset && 'lg:translate-x-[var(--filters-panel-width)]'
          )}
          style={{ transform: shellTransform }}
        >
          <div
            id="catalogHeader"
            data-app-header="true"
            data-chrome-layer
            ref={combinedHeaderRef}
            className={headerClassName}
            style={{ position: 'sticky', top: 0, zIndex: 'var(--z-header,50)' }}
          >
            <TopNavigation />
            {headerNode}
          </div>

          {/* Main content */}
          <div className="px-4 pb-8 pt-2 sm:px-6 lg:px-8">
            <div className="page-grid items-start gap-3">
              <div className="page-grid__content mx-auto grid w-full items-start gap-6 max-w-none lg:grid-cols-1">
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
    </div>
  )
}

export default AppLayout

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mediaQuery = window.matchMedia(query)
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    setMatches(mediaQuery.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [query])

  return matches
}
