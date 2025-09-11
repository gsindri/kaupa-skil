import React, {
  ReactNode,
  useCallback,
  useLayoutEffect,
  useRef,
  MutableRefObject
} from 'react'
import { Outlet } from 'react-router-dom'
import { TopNavigation } from './TopNavigation'
import { PrimaryNavRail } from './PrimaryNavRail'
import { AppChrome } from './AppChrome'
import { CartDrawer } from '@/components/cart/CartDrawer'

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
  headerClassName
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

  useLayoutEffect(() => {
    const el = internalHeaderRef.current
    if (!el) return
    const update = () => {
      const h = Math.round(el.getBoundingClientRect().height || 56)
      document.documentElement.style.setProperty('--header-h', `${h}px`)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)

    const rail = document.querySelector('[data-rail]')
    if (rail instanceof HTMLElement) {
      document.documentElement.style.setProperty('--header-left', `${rail.offsetWidth}px`)
    }

    return () => ro.disconnect()
  }, [])

  return (
    <div
      className="relative h-screen grid"
      style={{ gridTemplateColumns: 'var(--layout-rail,72px) 1fr' }}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only absolute left-2 top-2 z-[var(--z-header,50)] px-3 py-2 rounded bg-[var(--button-primary)] text-white"
      >
        Skip to content
      </a>
      <AppChrome />

      {/* Left rail */}
      <aside
        data-rail
        className="sticky top-0 h-screen"
        style={{ zIndex: 'var(--z-rail,40)' }}
      >
        <PrimaryNavRail />
      </aside>

      {/* Right column: header + page */}
      <div className="relative">
        {/* Header is now scoped to the right column only */}
        <div
          id="catalogHeader"
          ref={combinedHeaderRef}
          className={headerClassName}
          style={{ position: 'sticky', top: 0, zIndex: 'var(--z-header,50)' }}
        >
          <TopNavigation />
          {header}
        </div>

        {/* Content; if header overlays, pad with the measured height */}
        <main
          id="main-content"
          style={{ paddingTop: 'var(--header-h, var(--layout-header-h,56px))' }}
        >
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
            {children ?? <Outlet />}
          </div>
        </main>
      </div>
      <CartDrawer />
    </div>
  )
}

export default AppLayout
