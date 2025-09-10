import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Home,
  Boxes,
  Shuffle,
  Building2,
  Refrigerator,
  LineChart,
  Compass,
  Menu,
  Sun,
  HelpCircle
} from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useLayout } from './LayoutContext'

const items = [
  { to: '/', icon: Home, label: 'Dashboard' },
  { to: '/catalog', icon: Boxes, label: 'Catalog' },
  { to: '/compare', icon: Shuffle, label: 'Compare' },
  { to: '/suppliers', icon: Building2, label: 'Suppliers' },
  { to: '/pantry', icon: Refrigerator, label: 'Pantry' },
  { to: '/price-history', icon: LineChart, label: 'Price' },
  { to: '/discovery', icon: Compass, label: 'Discover' }
]

export function PrimaryNavRail() {
  const { pathname } = useLocation()
  const { railExpanded, setRailExpanded } = useLayout()
  const navRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const links: HTMLElement[] = Array.from(nav.querySelectorAll('[data-rail-item]'))
    let index = 0
    links.forEach((l, i) => (l.tabIndex = i === 0 ? 0 : -1))
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        links[index].tabIndex = -1
        index = e.key === 'ArrowDown' ? (index + 1) % links.length : (index - 1 + links.length) % links.length
        links[index].tabIndex = 0
        links[index].focus()
      }
    }
    nav.addEventListener('keydown', handleKey)
    return () => nav.removeEventListener('keydown', handleKey)
  }, [])

  return (
    <nav ref={navRef} className="mt-2 flex w-full flex-col items-center gap-1">
      <button
        className="mb-2 flex h-11 w-11 items-center justify-center rounded-3 bg-white/5 hover:bg-white/10 ring-1 ring-white/10 focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[0_0_0_2px_var(--brand-accent)]"
        aria-label="Toggle navigation"
        data-rail-item
        onClick={() => setRailExpanded(!railExpanded)}
      >
        <Menu className="h-5 w-5" strokeWidth={1.75} />
      </button>
      {items.map(({ to, icon: Icon, label }) => {
        const active = pathname === to || pathname.startsWith(to + '/')
        return (
          <Tooltip key={to}>
            <TooltipTrigger asChild>
              <NavLink
                to={to}
                data-rail-item
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'group relative my-1 flex w-14 flex-col items-center rounded-2xl px-2 py-2 text-white/80 focus:outline-none',
                  'transition-colors motion-reduce:transition-none',
                  active
                    ? 'bg-white/16 ring-1 ring-white/10 text-white'
                    : 'hover:bg-white/10 hover:text-white'
                )}
              >
                <Icon className="h-5 w-5 stroke-[1.75]" />
                <span className="mt-1 text-[10px] leading-3">{label}</span>
              </NavLink>
            </TooltipTrigger>
            <TooltipContent side="right">{label}</TooltipContent>
          </Tooltip>
        )
      })}
      <div className="mt-auto mb-2 flex flex-col items-center gap-2">
        <button
          data-rail-item
          className="flex h-9 w-9 items-center justify-center rounded-3 bg-white/5 hover:bg-white/10 ring-1 ring-white/10 focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[0_0_0_2px_var(--brand-accent)]"
        >
          <Sun className="h-4 w-4" strokeWidth={1.75} />
        </button>
        <button
          data-rail-item
          className="flex h-9 w-9 items-center justify-center rounded-3 bg-white/5 hover:bg-white/10 ring-1 ring-white/10 focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[0_0_0_2px_var(--brand-accent)]"
        >
          <HelpCircle className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>
    </nav>
  )
}

