import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, HelpCircle, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { TenantSwitcher } from './TenantSwitcher'
import { useAuth } from '@/contexts/useAuth'
import { useCart } from '@/contexts/useBasket'
import MiniCart from '@/components/cart/MiniCart'
import { LanguageSwitcher } from './LanguageSwitcher'
import { HeildaLogo } from '@/components/branding/HeildaLogo'
import { useSidebar } from '@/components/ui/use-sidebar'
import { cn } from '@/lib/utils'

export function TopNavigation() {
  const { profile, user, signOut, loading, profileLoading } = useAuth()
  const { setIsDrawerOpen } = useCart()
  const { open, openMobile, isMobile, toggleSidebar } = useSidebar()
  const sidebarOpen = isMobile ? openMobile : open

  const searchRef = useRef<HTMLInputElement>(null)
  const [helpOpen, setHelpOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [searchExpanded, setSearchExpanded] = useState(false)
  const lastKey = useRef<string>('')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0)
    onScroll()
    window.addEventListener('scroll', onScroll)
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

  const handleSearchFocus = () => setSearchExpanded(true)
  const handleSearchBlur = () => {
    if (!searchRef.current?.value) {
      setSearchExpanded(false)
    }
  }
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape' && !searchRef.current?.value) {
      setSearchExpanded(false)
      searchRef.current?.blur()
    }
  }

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
    <header
      role="banner"
      style={{
        '--sidebar-w': sidebarOpen ? 'var(--sidebar-width)' : '0px',
        marginLeft: 'var(--sidebar-w)',
        width: 'calc(100% - var(--sidebar-w))',
      } as React.CSSProperties}
      className={cn(
        'fixed top-0 right-0 left-0 z-50 h-[var(--header-h)] border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75 transition-shadow transition-[margin-left,width] duration-200 will-change-[margin-left,width] motion-reduce:transition-none',
        scrolled ? 'shadow-sm' : '',
        sidebarOpen ? 'ease-in-out' : 'ease-out'
      )}
    >
      <div className="flex h-full items-center px-4 gap-4">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle sidebar"
          aria-controls="app-sidebar"
          aria-expanded={sidebarOpen}
          onClick={toggleSidebar}
        >
          <span aria-hidden>☰</span>
        </Button>
        <div className="flex items-center flex-1 space-x-4">
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

        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchRef}
              aria-label="Search"
              placeholder="Search..."
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              onKeyDown={handleSearchKeyDown}
              onChange={() => setSearchExpanded(true)}
              className={`pl-10 transition-all duration-200 ease-in-out border ${searchExpanded ? 'w-full' : 'w-40'}`}
            />
          </div>
        </div>

        <nav aria-label="Global actions" className="flex items-center justify-end flex-1 pl-4">
          <LanguageSwitcher />
          <Separator orientation="vertical" className="mx-2 h-6" />
          <DropdownMenu open={helpOpen} onOpenChange={setHelpOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <HelpCircle className="h-5 w-5" />
                <span className="hidden sm:inline ml-2">Help</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Keyboard Shortcuts</DropdownMenuItem>
              <DropdownMenuItem>Support</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Separator orientation="vertical" className="mx-2 h-6" />
          <MiniCart />
          <Separator orientation="vertical" className="mx-2 h-6" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2" disabled={isBusy}>
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  {isBusy ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  ) : (
                    <span className="text-sm font-medium">{userInitial}</span>
                  )}
                </div>
                <span className="hidden sm:inline font-medium">{displayName}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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
    </header>
  )
}
