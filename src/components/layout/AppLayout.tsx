import React, {
  ReactNode,
  useCallback,
  useLayoutEffect,
  useRef,
  MutableRefObject,
  ReactElement
} from 'react'
import { Outlet } from 'react-router-dom'
import { TopNavigation } from './TopNavigation'
import { PrimaryNavRail } from './PrimaryNavRail'
import { AppChrome } from './AppChrome'
import { CartDrawer } from '@/components/cart/CartDrawer'
import useHeaderScrollHide from './useHeaderScrollHide'

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

  const isPinned = useCallback(() => {
    const el = internalHeaderRef.current
    const ae = document.activeElement
    const menuOpen = el?.querySelector('[data-open="true"]')
    const isTypeable = (node: Element | null) =>
      !!node &&
      ((node instanceof HTMLInputElement) ||
        (node instanceof HTMLTextAreaElement) ||
        (node as HTMLElement).isContentEditable ||
        node.getAttribute('role') === 'combobox')
    return window.scrollY < 1 || !!menuOpen || isTypeable(ae)
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
      <div style={{ marginLeft: 'var(--layout-rail,72px)' }}>
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
          className={headerClassName}
          style={{ position: 'sticky', top: 0, zIndex: 'var(--z-header,50)' }}
        >
          <TopNavigation />
          {headerNode}
        </div>

        {/* Main content */}
        <main 
          id="main-content" 
          className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8"
          style={{ 
            minHeight: 'calc(100vh - var(--header-h, 56px))',
            paddingTop: '1rem'
          }}
        >
          {children ?? <Outlet />}
        </main>
      </div>
      <CartDrawer />
    </div>
  )
}

export default AppLayout
