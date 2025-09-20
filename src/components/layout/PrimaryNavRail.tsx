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

const focusRingClass =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff8a3d]/70'

export function PrimaryNavRail() {
  const { pathname } = useLocation()
  const [hoveredItem, setHoveredItem] = React.useState<string | null>(null)
  return (
    <div
      className={clsx(
        'nav-rail relative flex h-full w-[var(--layout-rail,72px)] flex-col border-r border-white/10',
        'bg-[#0c1524]'
      )}
      style={{
        zIndex: 'var(--z-rail, 60)',
      }}
    >
      <nav className="flex flex-1 flex-col gap-2 px-2 pt-[var(--sidebar-offset-rail)]">
        {items.map(({ to, Icon, label }) => {
          const active = pathname === to || pathname.startsWith(to + '/')
          const isHovered = hoveredItem === to
          return (
            <Link
              key={to}
              to={to}
              aria-current={active ? 'page' : undefined}
              className={clsx(
                'group relative flex h-[64px] w-full flex-col items-center justify-center rounded-xl',
                'px-2 text-center transition-colors duration-200',
                active
                  ? 'bg-white/10 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.12)]'
                  : 'text-white/60 hover:bg-white/10 hover:text-white',
                focusRingClass,
              )}
              onPointerEnter={() => setHoveredItem(to)}
              onPointerLeave={() =>
                setHoveredItem((current) => (current === to ? null : current))
              }
            >
              <span
                aria-hidden
                className={clsx(
                  'pointer-events-none absolute left-1 top-2 bottom-2 w-[4px] rounded-full transition-colors duration-200',
                  active ? 'bg-[#ff8a3d]' : 'bg-transparent'
                )}
              />
              <NavIcon
                Icon={Icon}
                active={active}
                label={label}
                hovered={isHovered}
                size={28}
                className={clsx(
                  'transition-colors duration-200',
                  active ? 'text-white' : 'text-white/60 group-hover:text-white'
                )}
              />
              <span
                className={clsx(
                  'mt-2 text-[12px] font-medium leading-[14px] tracking-wide transition-colors duration-200',
                  active ? 'text-white' : 'text-white/50 group-hover:text-white'
                )}
              >
                {label}
              </span>
            </Link>
          )
        })}
        <div className="mt-auto mb-2" />
      </nav>
    </div>
  )
}
