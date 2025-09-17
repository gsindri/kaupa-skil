import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import clsx from 'clsx'
import { NavIcon } from '@/components/ui/NavIcon'

// Import SVG icons as React components
// dashboard-holo.svg is the primary dashboard icon
import DashboardIcon from '@/icons/dashboard-holo.svg?react'
import CatalogIcon from '@/icons/catalog.svg?react'
import CompareIcon from '@/icons/compare.svg?react'
import SuppliersIcon from '@/icons/suppliers.svg?react'
import PantryIcon from '@/icons/pantry.svg?react'
import PriceIcon from '@/icons/price.svg?react'
import DiscoverIcon from '@/icons/discover.svg?react'

const items = [
  { to: '/', Icon: DashboardIcon, label: 'Dashboard' },
  { to: '/catalog', Icon: CatalogIcon, label: 'Catalog' },
  { to: '/compare', Icon: CompareIcon, label: 'Compare' },
  { to: '/suppliers', Icon: SuppliersIcon, label: 'Suppliers' },
  { to: '/pantry', Icon: PantryIcon, label: 'Pantry' },
  { to: '/price-history', Icon: PriceIcon, label: 'Price' },
  { to: '/discovery', Icon: DiscoverIcon, label: 'Discover' },
]

export function PrimaryNavRail() {
  const { pathname } = useLocation()
  const [hoveredItem, setHoveredItem] = React.useState<string | null>(null)
  const [keyboardFocusedItem, setKeyboardFocusedItem] = React.useState<string | null>(null)

  React.useEffect(() => {
    setKeyboardFocusedItem(null)
  }, [pathname])
  return (
    <div
      className="nav-rail h-full w-[var(--layout-rail,72px)] bg-gradient-to-b from-[#0B1220] via-[#0E1B35] to-[#0E2A5E] relative"
      style={{
        zIndex: 'var(--z-rail, 60)'
      }}
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[2px] pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, rgba(165, 243, 252, 0.63) 0%, rgba(34, 211, 238, 0.9) 50%, rgba(165, 243, 252, 0.63) 100%)',
        }}
      />

      <nav className="flex w-full flex-col items-center gap-1 pt-[var(--sidebar-offset-rail)]">
      {items.map(({ to, Icon, label }) => {
        const active = pathname === to || pathname.startsWith(to + '/')
        const isHovered = hoveredItem === to
        const isKeyboardFocused = keyboardFocusedItem === to
        return (
          <Link
            key={to}
            to={to}
            aria-current={active ? 'page' : undefined}
            className={clsx(
              'group relative my-1 flex w-20 flex-col items-center rounded-2xl px-2.5 py-2 text-white/80',
              'hover:text-white transition-colors duration-200',
              active &&
                'bg-white/5 text-white ring-2 ring-white/40 ring-offset-2 ring-offset-white/10'
            )}
            onPointerEnter={() => setHoveredItem(to)}
            onPointerLeave={() =>
              setHoveredItem((current) => (current === to ? null : current))
            }
            onPointerDown={() => setKeyboardFocusedItem(null)}
            onFocus={(event) => {
              if (event.currentTarget.matches(':focus-visible')) {
                setKeyboardFocusedItem(to)
              }
            }}
            onBlur={() =>
              setKeyboardFocusedItem((current) => (current === to ? null : current))
            }
          >
            <NavIcon
              Icon={Icon}
              active={active}
              label={label}
              hovered={isHovered || isKeyboardFocused}
            />
            <span className="mt-1.5 text-[11px] leading-[14px] text-center whitespace-nowrap">{label}</span>
          </Link>
        )
      })}
        <div className="mt-auto mb-2" />
      </nav>
    </div>
  )
}
