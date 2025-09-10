import React from 'react'
import { NavLink } from 'react-router-dom'
import { Home, Search, TrendingUp, Package, Heart, History } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const items = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/catalog', label: 'Catalog', icon: Search },
  { to: '/compare', label: 'Compare', icon: TrendingUp },
  { to: '/suppliers', label: 'Suppliers', icon: Package },
  { to: '/pantry', label: 'Pantry', icon: Heart },
  { to: '/price-history', label: 'Price History', icon: History },
  { to: '/discovery', label: 'Discovery', icon: Search },
]

export function CompactNavRail() {
  return (
    <TooltipProvider>
      <nav className="flex flex-col items-center gap-2 py-4">
        {items.map(item => (
          <Tooltip key={item.label}>
            <TooltipTrigger asChild>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex h-12 w-12 items-center justify-center rounded-lg text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]',
                    isActive && 'bg-white/10'
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                <span className="sr-only">{item.label}</span>
              </NavLink>
            </TooltipTrigger>
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        ))}
      </nav>
    </TooltipProvider>
  )
}

export default CompactNavRail
