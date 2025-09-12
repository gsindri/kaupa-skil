import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import clsx from 'clsx'

const items = [
  { to: '/', image: '/nav-dashboard.png', label: 'Dashboard' },
  { to: '/catalog', image: '/nav-catalog.png', label: 'Catalog' },
  { to: '/compare', image: '/nav-compare.png', label: 'Compare' },
  { to: '/suppliers', image: '/nav-suppliers.png', label: 'Suppliers' },
  { to: '/pantry', image: '/nav-pantry.png', label: 'Pantry' },
  { to: '/price-history', image: '/nav-price.png', label: 'Price' },
  { to: '/discovery', image: '/nav-discover.png', label: 'Discover' },
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
      {items.map(({ to, image, label }) => {
        const active = pathname === to || pathname.startsWith(to + '/')
        return (
          <Link
            key={to}
            to={to}
            aria-current={active ? 'page' : undefined}
            className={clsx(
              'group relative my-1 flex w-14 flex-col items-center rounded-2xl px-2 py-2 text-white/80',
              'hover:bg-white/10 hover:text-white',
              active && 'bg-white/15 ring-1 ring-white/10 text-white'
            )}
          >
            <img 
              src={image} 
              alt={label}
              className="h-8 w-8 opacity-100 drop-shadow-sm"
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
