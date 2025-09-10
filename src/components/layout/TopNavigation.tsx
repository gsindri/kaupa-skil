
import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { HelpCircle, ChevronDown } from 'lucide-react'
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
import { HeildaLogo } from '@/components/branding/HeildaLogo'
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
        'relative z-50 bg-gradient-to-r from-[#0B1220] via-[#0E1B35] to-[#0E2A5E]',
        scrolled ? 'shadow-lg' : 'shadow-none',
        'transition-[box-shadow,height] duration-200'
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-cyan-400 to-teal-400/90" />
      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className={cn('flex items-center gap-3', scrolled ? 'h-[52px]' : 'h-14', 'transition-[height] duration-200')}>
          <div className="flex items-center gap-2 min-w-0 text-slate-100">
            <button
              className="rounded-xl bg-white/5 hover:bg-white/10 ring-1 ring-white/10 p-2"
              aria-label="Toggle sidebar"
              aria-controls="app-sidebar"
              aria-expanded={sidebarOpen}
              onClick={toggleSidebar}
            >
              <span aria-hidden>☰</span>
            </button>
            <Link
              to="/"
              className={cn(
                'flex items-center transition-[opacity,transform] duration-150 will-change-[transform,opacity] motion-reduce:transition-none motion-reduce:transform-none',
                sidebarOpen
                  ? 'opacity-0 translate-y-1 scale-95 pointer-events-none ease-out'
                  : 'opacity-100 translate-y-0 scale-100 delay-[40ms] ease-in-out'
              )}
              aria-label="Deilda home"
              aria-hidden={sidebarOpen}
              tabIndex={sidebarOpen ? -1 : 0}
            >
              <HeildaLogo className="h-6 w-auto" />
            </Link>
            <TenantSwitcher />
          </div>

          <div className="flex-1 min-w-[280px]">
            <HeaderSearch ref={searchRef} />
          </div>

          <nav aria-label="Global actions" className="flex items-center gap-2">
            <DropdownMenu open={helpOpen} onOpenChange={setHelpOpen} modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 px-3 rounded-xl bg-white/6 hover:bg-white/10 ring-1 ring-white/10 text-slate-100 focus-visible:ring-2 focus-visible:ring-cyan-400/70"
                >
                  <HelpCircle className="h-5 w-5" />
                  <span className="hidden sm:inline ml-2">Help</span>
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
                  className="h-10 px-2 rounded-xl bg-white/6 hover:bg-white/10 ring-1 ring-white/10 text-slate-100 flex items-center space-x-2"
                  disabled={isBusy}
                >
                  <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
                    {isBusy ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-400" />
                    ) : (
                      <span className="text-sm font-medium text-slate-100">{userInitial}</span>
                    )}
                  </div>
                  <span className="hidden sm:inline font-medium">{displayName}</span>
                  <ChevronDown className="h-4 w-4" />
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
