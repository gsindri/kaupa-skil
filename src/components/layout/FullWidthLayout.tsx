import React, { useLayoutEffect, useRef } from 'react'
import { TopNavigation } from './TopNavigation'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { cn } from '@/lib/utils'
import { AppChrome } from './AppChrome'
import { PrimaryNavRail } from './PrimaryNavRail'

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
  useLayoutEffect(() => {
    const el = internalHeaderRef.current
    if (!el) return
    const update = () => {
      const h = el.getBoundingClientRect().height || 56
      const clamped = Math.min(120, Math.max(40, Math.round(h)))
      document.documentElement.style.setProperty('--header-h', `${clamped}px`)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const setHeaderRef = (node: HTMLDivElement | null) => {
    internalHeaderRef.current = node as HTMLDivElement
    if (typeof headerRef === 'function') headerRef(node as HTMLDivElement)
    else if (headerRef && 'current' in (headerRef as any)) (headerRef as any).current = node
  }

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
          ref={setHeaderRef}
          className={cn(headerClassName)}
          style={{ position: 'sticky', top: 0, zIndex: 'var(--z-header,30)' }}
        >
          <TopNavigation />
          {header && (
            <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">{header}</div>
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
          {children}
        </div>
      </div>

      <CartDrawer />
    </div>
  )
}
