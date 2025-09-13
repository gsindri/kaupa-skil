import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import clsx from 'clsx'
import { NavIcon } from '@/components/ui/NavIcon'

// Import SVG icons as React components
import DashboardHoloIcon from '@/icons/dashboard-holo.svg?react'
import CatalogIcon from '@/icons/catalog.svg?react'
import CompareIcon from '@/icons/compare.svg?react'
import SuppliersIcon from '@/icons/suppliers.svg?react'
import PantryIcon from '@/icons/pantry.svg?react'
import PriceIcon from '@/icons/price.svg?react'
import DiscoverIcon from '@/icons/discover.svg?react'

const items = [
  { to: '/', Icon: DashboardHoloIcon, label: 'Dashboard' },
  { to: '/catalog', Icon: CatalogIcon, label: 'Catalog' },
  { to: '/compare', Icon: CompareIcon, label: 'Compare' },
  { to: '/suppliers', Icon: SuppliersIcon, label: 'Suppliers' },
  { to: '/pantry', Icon: PantryIcon, label: 'Pantry' },
  { to: '/price-history', Icon: PriceIcon, label: 'Price' },
  { to: '/discovery', Icon: DiscoverIcon, label: 'Discover' },
]

export function PrimaryNavRail() {
  const { pathname } = useLocation()
  return (
    <div
      className="h-full w-[var(--layout-rail,72px)] bg-gradient-to-b from-[#0B1220] via-[#0E1B35] to-[#0E2A5E] relative"
      style={{
        zIndex: 'var(--z-rail, 60)'
      }}
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[2px] pointer-events-none bg-gradient-to-r from-cyan-300/70 via-cyan-400 to-cyan-300/70"
      />

      <nav className="flex w-full flex-col items-center gap-1 pt-[var(--sidebar-offset-rail)]">
      {items.map(({ to, Icon, label }) => {
        const active = pathname === to || pathname.startsWith(to + '/')
        return (
          <Link
            key={to}
            to={to}
            aria-current={active ? 'page' : undefined}
            className={clsx(
              'group relative my-1 flex w-14 flex-col items-center rounded-2xl px-2 py-2 text-white/80',
              'hover:text-white transition-colors duration-200',
              active && 'ring-1 ring-white/10 text-white'
            )}
          >
            <NavIcon 
              Icon={Icon}
              active={active}
              label={label}
            />
            <span className="mt-1 text-[10px] leading-3">{label}</span>
          </Link>
        )
      })}
        <div className="mt-auto mb-2" />
      </nav>
    </div>
  )
}
