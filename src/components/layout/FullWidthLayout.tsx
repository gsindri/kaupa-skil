import React, { useRef, useCallback, ReactElement } from 'react'
import { TopNavigation } from './TopNavigation'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { cn } from '@/lib/utils'
import { AppChrome } from './AppChrome'
import { PrimaryNavRail } from './PrimaryNavRail'
import useHeaderScrollHide from './useHeaderScrollHide'
import { isTypeableElement } from './isTypeableElement'

interface FullWidthLayoutProps {
  children: React.ReactNode
  header?: React.ReactNode
  headerClassName?: string
  headerRef?: React.Ref<HTMLDivElement>
  contentProps?: React.HTMLAttributes<HTMLDivElement>
}

export function FullWidthLayout({
  children,
  header,
  headerClassName,
  headerRef,
  contentProps,
}: FullWidthLayoutProps) {
  const { className: contentClassName, style: contentStyle, ...restContentProps } = contentProps || {}
  const internalHeaderRef = useRef<HTMLDivElement>(null)
  const isPinned = useCallback(() => {
    const el = internalHeaderRef.current
    const ae = document.activeElement
    const menuOpen = el?.querySelector('[data-open="true"]')
    return window.scrollY < 1 || !!menuOpen || isTypeableElement(ae)
  }, [])
  const handleLockChange = useHeaderScrollHide(internalHeaderRef, { isPinned })
  const setHeaderRef = (node: HTMLDivElement | null) => {
    internalHeaderRef.current = node as HTMLDivElement
    if (typeof headerRef === 'function') headerRef(node as HTMLDivElement)
    else if (headerRef && 'current' in (headerRef as any)) (headerRef as any).current = node
  }

  const headerNode =
    header && React.isValidElement(header)
      ? React.cloneElement(header as ReactElement<any>, { onLockChange: handleLockChange })
      : header

  return (
    <div
      className="min-h-dvh grid"
      style={{ gridTemplateColumns: 'var(--layout-rail,72px) 1fr' }}
    >
      {/* Left rail */}
      <aside
        className="sticky top-0 h-dvh"
        style={{ zIndex: 'var(--z-rail,40)' }}
      >
        <PrimaryNavRail />
      </aside>

      {/* Right column: header + page */}
      <div className="relative">
        <AppChrome />
        {/* Header is now scoped to the right column only */}
        <div
          id="catalogHeader"
          data-app-header="true"
          ref={setHeaderRef}
          className={cn(headerClassName)}
          style={{ position: 'sticky', top: 0, zIndex: 'var(--z-header,30)' }}
        >
          <TopNavigation />
          {headerNode && (
            <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">{headerNode}</div>
          )}
        </div>

        {/* Content; if header overlays, pad with the measured height */}
        <div
          id="catalogContent"
          className={cn(
            'flex-1 min-h-0 px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12',
            contentClassName,
          )}
          style={{
            paddingTop: 'var(--header-h, var(--layout-header-h,56px))',
            ...contentStyle
          }}
          {...restContentProps}
        >
          <div className="page-grid items-start gap-3">
            <div className="page-grid__content min-w-0">
              {children}
            </div>
            <CartDrawer />
          </div>
        </div>
      </div>
    </div>
  )
}
