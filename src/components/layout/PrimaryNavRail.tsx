import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Boxes, Shuffle, Building2, Refrigerator, LineChart, Compass } from 'lucide-react'
import clsx from 'clsx'

const items = [
  { to: '/', icon: Home, label: 'Dashboard' },
  { to: '/catalog', icon: Boxes, label: 'Catalog' },
  { to: '/compare', icon: Shuffle, label: 'Compare' },
  { to: '/suppliers', icon: Building2, label: 'Suppliers' },
  { to: '/pantry', icon: Refrigerator, label: 'Pantry' },
  { to: '/price-history', icon: LineChart, label: 'Price' },
  { to: '/discovery', icon: Compass, label: 'Discover' },
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
        style={{
          transform: 'translateY(calc(-1 * var(--hdr-p, 0) * var(--header-h, 56px)))'
        }}
      />

      <nav className="flex w-full flex-col items-center gap-1">
      {items.map(({ to, icon: Icon, label }) => {
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
            <Icon className="h-5 w-5 stroke-[1.75]" />
            <span className="mt-1 text-[10px] leading-3">{label}</span>
          </Link>
        )
      })}
        <div className="mt-auto mb-2" />
      </nav>
    </div>
  )
}
