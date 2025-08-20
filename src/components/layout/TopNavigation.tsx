import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, HelpCircle, ChevronDown, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Separator } from '@/components/ui/separator'
import { TenantSwitcher } from './TenantSwitcher'
import { useAuth } from '@/contexts/useAuth'
import { useCart } from '@/contexts/useBasket'
import { LanguageSwitcher } from './LanguageSwitcher'
import { HeildaLogo } from '@/components/branding/HeildaLogo'

export function TopNavigation() {
  const { profile, user, signOut, loading, profileLoading } = useAuth()
  const { getTotalItems, items, setIsDrawerOpen } = useCart()

  const searchRef = useRef<HTMLInputElement>(null)
  const [helpOpen, setHelpOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
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
  const cartCount = getTotalItems()

  return (
    <header
      role="banner"
      className={`fixed top-0 inset-x-0 z-50 h-[var(--header-h)] border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75 transition-shadow ${scrolled ? 'shadow-sm' : ''}`}
    >
      <div className="flex h-full items-center px-4">
        <div className="flex items-center flex-1 space-x-4">
          <Link to="/" className="flex items-center" aria-label="Heilda home">
            <HeildaLogo className="h-6 w-auto" />
          </Link>
          <TenantSwitcher />
        </div>

        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchRef}
              placeholder="Search products, suppliers, orders..."
              className="pl-10"
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
          <HoverCard openDelay={0} closeDelay={100}>
            <HoverCardTrigger asChild>
              <Button variant="ghost" size="sm" className="relative" onClick={() => setIsDrawerOpen(true)}>
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span aria-live="polite" className="absolute -top-1 -right-1 h-4 min-w-4 rounded-full bg-brand-600 px-1 text-[10px] text-white flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
                <span className="hidden sm:inline ml-2">Cart</span>
              </Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-64" align="end" sideOffset={8}>
              {cartCount === 0 ? (
                <div className="text-sm text-muted-foreground">Cart is empty</div>
              ) : (
                <div className="space-y-1 text-sm">
                  {items.slice(0, 3).map(item => (
                    <div key={item.supplierItemId} className="flex justify-between">
                      <span>{item.itemName}</span>
                      <span>{item.quantity}x</span>
                    </div>
                  ))}
                  {items.length > 3 && (
                    <div className="text-xs text-muted-foreground">+ {items.length - 3} more</div>
                  )}
                </div>
              )}
            </HoverCardContent>
          </HoverCard>
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
