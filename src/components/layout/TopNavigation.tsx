
import React, { useEffect, useRef, useState, useLayoutEffect } from 'react'
import { HelpCircle, ChevronDown, ShoppingCart, Search } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { TenantSwitcher } from './TenantSwitcher'
import { useAuth } from '@/contexts/useAuth'
import { useCart } from '@/contexts/useBasket'
import { LanguageSwitcher } from './LanguageSwitcher'
import { cn } from '@/lib/utils'
import { HeaderSearch } from '@/components/search/HeaderSearch'
import { HeildaLogo } from '@/components/branding/HeildaLogo'

export function TopNavigation() {
  const { profile, user, signOut, loading, profileLoading } = useAuth()
  const { setIsDrawerOpen, getTotalItems, isDrawerOpen } = useCart()
  const cartCount = getTotalItems()

  const searchRef = useRef<HTMLInputElement>(null)
  const searchTriggerRef = useRef<HTMLButtonElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState(false)
  const lastKey = useRef<string>('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const isEditableElement = (el: Element | null) => {
      if (!el) return false
      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        el instanceof HTMLSelectElement
      ) {
        return true
      }
      return (el as HTMLElement).isContentEditable
    }

    const handleKey = (e: KeyboardEvent) => {
      const activeElement = document.activeElement
      const editable = isEditableElement(activeElement)

      if (
        ((e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) ||
          (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey))) &&
        !editable
      ) {
        e.preventDefault()
        setSearchOpen(true)
        return
      }

      if (e.key === '?' && !editable) {
        e.preventDefault()
        setUserMenuOpen(true)
        return
      }

      if (lastKey.current === 'g' && e.key === 'c') {
        e.preventDefault()
        setIsDrawerOpen(true)
      }
      lastKey.current = e.key
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [setIsDrawerOpen])

  const previousSearchOpen = useRef(searchOpen)
  useEffect(() => {
    if (previousSearchOpen.current && !searchOpen) {
      searchTriggerRef.current?.focus()
    }
    previousSearchOpen.current = searchOpen
  }, [searchOpen])

  useLayoutEffect(() => {
    const el = barRef.current
    if (!el) return
    const set = () => {
      const h = Math.round(el.getBoundingClientRect().height || 56)
      const clamped = Math.min(72, Math.max(44, h))
      document.documentElement.style.setProperty('--toolbar-h', `${clamped}px`)
    }
    set()
    const ro = new ResizeObserver(set)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

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
      ref={barRef}
      role="banner"
      data-app-header="true"
      className={cn(
        'z-[var(--z-header,50)] pt-[2px] px-3 sm:px-4 flex items-center gap-3 text-white',
        scrolled ? 'shadow-lg' : 'shadow-none',
        'transition-[box-shadow] duration-base ease-snap motion-reduce:transition-none'
      )}
      style={{
        height: 'clamp(44px, var(--toolbar-h, 56px), 72px)'
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <HeildaLogo className="h-8 w-auto shrink-0" />
        <TenantSwitcher />
      </div>

      <nav aria-label="Global actions" className="ml-auto flex items-center gap-2">
        <Button
          ref={searchTriggerRef}
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full bg-white/8 hover:bg-white/12 ring-1 ring-white/10 p-0 text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21D4D6]"
          type="button"
          onClick={() => setSearchOpen(true)}
          aria-label="Open search"
          aria-haspopup="dialog"
        >
          <Search className="icon-20" strokeWidth={1.75} />
        </Button>
        <LanguageSwitcher />
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className="relative inline-flex items-center gap-2 h-10 px-3.5 rounded-2xl bg-[var(--button-primary)] hover:bg-[var(--button-primary-hover)] text-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21D4D6] ui-numeric duration-fast ease-snap motion-reduce:transition-none"
          aria-haspopup="dialog"
          aria-expanded={isDrawerOpen}
          aria-controls="cart-drawer"
        >
          <ShoppingCart className="icon-20" strokeWidth={1.75} />
          <span className="font-semibold leading-tight">Cart</span>
          {cartCount > 0 && (
            <span
              aria-live="polite"
              className="ml-1 rounded-pill bg-[var(--brand-accent)] text-slate-900 text-xs px-2 py-0.5 min-w-[1.25rem] text-center ui-numeric"
            >
              {cartCount}
            </span>
          )}
        </button>
        <DropdownMenu open={userMenuOpen} onOpenChange={setUserMenuOpen} modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-10 px-3 rounded-2xl bg-white/8 hover:bg-white/12 ring-1 ring-white/10 flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21D4D6]"
              disabled={isBusy}
            >
              <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center">
                {isBusy ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--brand-accent)]" />
                ) : (
                  <span className="text-sm font-medium text-[var(--text-on-dark)]">{userInitial}</span>
                )}
              </div>
              <span className="hidden sm:inline font-medium leading-tight">{displayName}</span>
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
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <HelpCircle className="mr-2 h-4 w-4" strokeWidth={1.75} />
                <span>Help</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="min-w-[200px]">
                <DropdownMenuItem>Keyboard Shortcuts</DropdownMenuItem>
                <DropdownMenuItem>Support</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>Sign Out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
      <HeaderSearch ref={searchRef} mode="dialog" open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  )
}
