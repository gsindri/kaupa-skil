
import React, { useEffect, useRef, useState } from 'react'
import { HelpCircle, ChevronDown, ShoppingCart } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { TenantSwitcher } from './TenantSwitcher'
import { useAuth } from '@/contexts/useAuth'
import { useCart } from '@/contexts/useBasket'
import { LanguageSwitcher } from './LanguageSwitcher'
import { cn } from '@/lib/utils'
import { HeaderSearch } from '@/components/search/HeaderSearch'

export function TopNavigation() {
  const { profile, user, signOut, loading, profileLoading } = useAuth()
  const { setIsDrawerOpen, getTotalItems, isDrawerOpen } = useCart()
  const cartCount = getTotalItems()

  const searchRef = useRef<HTMLInputElement>(null)
  const [helpOpen, setHelpOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const lastKey = useRef<string>('')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.key === '/' || (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey))) && document.activeElement !== searchRef.current) {
        e.preventDefault()
        searchRef.current?.focus()
      } else if (e.key === '?') {
        e.preventDefault()
        setHelpOpen(true)
      } else {
        if (lastKey.current === 'g' && e.key === 'c') {
          e.preventDefault()
          setIsDrawerOpen(true)
        }
        lastKey.current = e.key
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [setIsDrawerOpen])

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User'
  const displayEmail = profile?.email || user?.email || ''
  const userInitial = displayName[0]?.toUpperCase() || 'U'
  const isBusy = loading || profileLoading
  
  return (
    <div
      role="banner"
      data-app-header="true"
      className={cn(
        'z-[var(--z-header,50)] pt-[2px] px-3 sm:px-4 flex items-center gap-3 text-white',
        scrolled ? 'shadow-lg' : 'shadow-none',
        'transition-[box-shadow] duration-base ease-snap motion-reduce:transition-none'
      )}
      style={{
        height: 'clamp(40px, var(--chrome-h, 56px), 120px)'
      }}
    >
      <TenantSwitcher />

      <div className="flex-1 min-w-[200px] md:min-w-[520px] max-w-[1040px]">
        <HeaderSearch ref={searchRef} />
      </div>

      <nav aria-label="Global actions" className="flex items-center gap-2">
        <DropdownMenu open={helpOpen} onOpenChange={setHelpOpen} modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-3 rounded-2xl bg-white/8 hover:bg-white/12 ring-1 ring-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21D4D6]"
            >
              <HelpCircle className="icon-20" strokeWidth={1.75} />
              <span className="hidden xl:inline ml-2">Help</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="bottom"
            sideOffset={8}
            collisionPadding={8}
            sticky="partial"
            className="min-w-[200px]"
          >
            <DropdownMenuItem>Keyboard Shortcuts</DropdownMenuItem>
            <DropdownMenuItem>Support</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <LanguageSwitcher />
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className="relative inline-flex items-center gap-2 h-9 px-3 rounded-2xl bg-[var(--button-primary)] hover:bg-[var(--button-primary-hover)] text-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21D4D6] ui-numeric duration-fast ease-snap motion-reduce:transition-none"
          aria-haspopup="dialog"
          aria-expanded={isDrawerOpen}
          aria-controls="cart-drawer"
        >
          <ShoppingCart className="icon-20" strokeWidth={1.75} />
          <span className="font-semibold">Cart</span>
          {cartCount > 0 && (
            <span
              aria-live="polite"
              className="ml-1 rounded-pill bg-[var(--brand-accent)] text-slate-900 text-xs px-2 py-0.5 min-w-[1.25rem] text-center ui-numeric"
            >
              {cartCount}
            </span>
          )}
        </button>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-2 rounded-2xl bg-white/8 hover:bg-white/12 ring-1 ring-white/10 flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21D4D6]"
              disabled={isBusy}
            >
              <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
                {isBusy ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--brand-accent)]" />
                ) : (
                  <span className="text-sm font-medium text-[var(--text-on-dark)]">{userInitial}</span>
                )}
              </div>
              <span className="hidden sm:inline font-medium">{displayName}</span>
              <ChevronDown className="icon-20" strokeWidth={1.75} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="bottom"
            sideOffset={8}
            collisionPadding={8}
            sticky="partial"
            className="min-w-[200px]"
          >
            <DropdownMenuItem>
              <div className="flex flex-col">
                <span className="font-medium">{displayName}</span>
                <span className="text-sm text-muted-foreground">{displayEmail}</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile Settings</DropdownMenuItem>
            <DropdownMenuItem>Organization Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>Sign Out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    </div>
  )
}
