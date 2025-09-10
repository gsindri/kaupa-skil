
import React, { useEffect, useRef, useState } from 'react'
import { HelpCircle, ChevronDown, Menu } from 'lucide-react'
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
import MiniCart from '@/components/cart/MiniCart'
import { LanguageSwitcher } from './LanguageSwitcher'
import { useSidebar } from '@/components/ui/use-sidebar'
import { cn } from '@/lib/utils'
import { HeaderSearch } from '@/components/search/HeaderSearch'

export function TopNavigation() {
  const { profile, user, signOut, loading, profileLoading } = useAuth()
  const { setIsDrawerOpen } = useCart()
  const { open, openMobile, isMobile, toggleSidebar } = useSidebar()
  const sidebarOpen = isMobile ? openMobile : open

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
      className={cn(
        'relative z-50 text-[var(--text-on-dark)] bg-gradient-to-r from-[var(--brand-from)] via-[var(--brand-via)] to-[var(--brand-to)]',
        scrolled ? 'shadow-lg' : 'shadow-none',
        'transition-[box-shadow,height] duration-base ease-snap motion-reduce:transition-none'
      )}
    >
      <div className="pointer-events-none memory-stripe absolute inset-x-0 top-0" />
      <div
        className="w-full"
        style={{
          paddingLeft: 'calc(var(--header-left) + 12px)',
          paddingRight: '16px',
          borderLeft: '1px solid rgba(255,255,255,0.06)'
        }}
      >
        <div
          className={cn(
            'flex items-center',
            scrolled ? 'h-[52px]' : 'h-14',
            'transition-[height] duration-base ease-snap motion-reduce:transition-none'
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="flex h-11 w-11 items-center justify-center rounded-3 bg-white/5 hover:bg-white/10 ring-1 ring-white/10 transition-colors duration-fast ease-snap focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[0_0_0_2px_var(--brand-accent)] motion-reduce:transition-none"
              aria-label="Toggle sidebar"
              aria-controls="app-sidebar"
              aria-expanded={sidebarOpen}
              onClick={toggleSidebar}
            >
              <Menu className="icon-20" strokeWidth={1.75} />
            </button>
            <TenantSwitcher />
          </div>

          <div className="flex-1 min-w-[200px] md:min-w-[520px] max-w-[1040px] ml-4">
            <HeaderSearch ref={searchRef} />
          </div>

          <nav aria-label="Global actions" className="flex items-center gap-3 ml-4">
            <DropdownMenu open={helpOpen} onOpenChange={setHelpOpen} modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-11 px-3 rounded-3 bg-white/5 hover:bg-white/10 ring-1 ring-white/10 focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[0_0_0_2px_var(--brand-accent)]"
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
            <MiniCart />
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-11 px-3 rounded-3 bg-white/5 hover:bg-white/10 ring-1 ring-white/10 flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[0_0_0_2px_var(--brand-accent)]"
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
      </div>
    </div>
  )
}
