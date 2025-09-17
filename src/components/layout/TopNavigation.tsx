
import React, { useEffect, useRef, useState, useLayoutEffect, useId } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { TenantSwitcher } from './TenantSwitcher'
import { useAuth } from '@/contexts/useAuth'
import { useCart } from '@/contexts/useBasket'
import { LanguageSwitcher } from './LanguageSwitcher'
import { cn } from '@/lib/utils'
import { HeaderSearch } from '@/components/search/HeaderSearch'
import { HeildaLogo } from '@/components/branding/HeildaLogo'
import { CartButton } from '@/components/cart/CartButton'
import { IconButton } from '@/components/ui/IconButton'
import { SearchSoft, ChevronSoft, GlobeSoft, QuestionSoft } from '@/components/icons-soft'
import { useLanguage } from '@/contexts/LanguageProvider'

export function TopNavigation() {
  const { profile, user, signOut, loading, profileLoading } = useAuth()
  const { setIsDrawerOpen } = useCart()
  const { language, setLanguage } = useLanguage()

  const searchRef = useRef<HTMLInputElement>(null)
  const searchTriggerRef = useRef<HTMLButtonElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState(false)
  const lastKey = useRef<string>('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [platformShortcut, setPlatformShortcut] = useState<'⌘ + K' | 'Ctrl + K'>('Ctrl + K')
  const searchShortcutDescriptionId = useId()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const nav = window.navigator
    const platform = `${nav.platform ?? ''} ${nav.userAgent ?? ''}`
    if (/mac/i.test(platform)) {
      setPlatformShortcut('⌘ + K')
    }
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

      const key = e.key.toLowerCase()

      if (
        ((key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) ||
          (key === 'k' && (e.metaKey || e.ctrlKey))) &&
        !editable
      ) {
        e.preventDefault()
        setSearchOpen(true)
        return
      }

      if (key === '?' && !editable) {
        e.preventDefault()
        setUserMenuOpen(true)
        return
      }

      if (key === 'c' && !e.metaKey && !e.ctrlKey && !e.altKey && !editable) {
        e.preventDefault()
        setIsDrawerOpen(true)
        lastKey.current = key
        return
      }

      if (lastKey.current === 'g' && key === 'c' && !editable) {
        e.preventDefault()
        setIsDrawerOpen(true)
        lastKey.current = key
        return
      }
      lastKey.current = key
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
  const accountMenuLabel = displayName
    ? `Open account menu for ${displayName}`
    : 'Open account menu'
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

      <nav aria-label="Global actions" className="ml-auto flex items-center gap-3">
        <IconButton
          ref={searchTriggerRef}
          label="Search"
          aria-label={`Search (${platformShortcut} or /)`}
          aria-haspopup="dialog"
          aria-keyshortcuts="/ meta+k control+k"
          aria-describedby={searchShortcutDescriptionId}
          onClick={() => setSearchOpen(true)}
          title="Search (Ctrl/⌘ + K)"
        >
          <SearchSoft width={24} height={24} tone={0.18} />
        </IconButton>
        <span id={searchShortcutDescriptionId} className="sr-only">
          Open search dialog. Shortcut: press / or {platformShortcut}.
        </span>
        <LanguageSwitcher className="hidden xl:block" />
        <DropdownMenu open={userMenuOpen} onOpenChange={setUserMenuOpen} modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-[var(--chip-h,2.5rem)] px-2 rounded-full bg-white/8 text-white/90 ring-1 ring-white/10',
                'inline-flex items-center gap-2 transition-[background-color,color,transform,box-shadow] duration-fast ease-snap motion-reduce:transition-none',
                'hover:bg-white/10 hover:ring-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-4 focus-visible:ring-offset-transparent motion-safe:hover:-translate-y-[0.5px] motion-reduce:hover:translate-y-0'
              )}
              disabled={isBusy}
              aria-label={accountMenuLabel}
              title={displayName || undefined}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/12 text-sm font-medium text-[var(--ink,#eaf0f7)]">
                {isBusy ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--brand-accent)]" />
                ) : (
                  <span className="text-sm font-medium text-[inherit]">{userInitial}</span>
                )}
              </div>
              <ChevronSoft width={16} height={16} className="ml-1 text-white opacity-70" />
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
            <div className="xl:hidden">
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <GlobeSoft width={18} height={18} tone={0.14} className="mr-2 text-[inherit]" />
                  <span>Language</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="min-w-[200px]">
                  <DropdownMenuRadioGroup value={language} onValueChange={(value) => setLanguage(value as any)}>
                    <DropdownMenuRadioItem value="is">Icelandic</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="en">English</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </div>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <QuestionSoft width={18} height={18} tone={0.14} className="mr-2 text-[inherit]" />
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
        <CartButton />
      </nav>
      <HeaderSearch ref={searchRef} mode="dialog" open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  )
}
