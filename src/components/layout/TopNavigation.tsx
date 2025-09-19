
import React, { useEffect, useRef, useState, useLayoutEffect, useId } from 'react'
import { Link } from 'react-router-dom'
import { DropdownMenu, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Building2, CircleUserRound, Keyboard, LifeBuoy, LogOut, ChevronDown, Check } from 'lucide-react'
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
import { SearchSoft } from '@/components/icons-soft'
import { useLanguage } from '@/contexts/LanguageProvider'
import { PopCard } from './PopCard'

const languageOptions = [
  { value: 'is', label: 'Icelandic', code: 'IS' },
  { value: 'en', label: 'English', code: 'EN' },
] as const

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
        <Link
          to="/"
          aria-label="Go to dashboard"
          title="Go to dashboard"
          className="inline-flex shrink-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        >
          <HeildaLogo className="h-8 w-auto shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]" />
        </Link>
        <TenantSwitcher />
      </div>

      <nav aria-label="Global actions" className="ml-auto flex items-center gap-3">
        <span className="inline-flex items-center gap-1 text-[13px] font-medium text-white/80">
          <span>Search here</span>
          <span aria-hidden="true">→</span>
        </span>
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
              className={cn(
                'inline-flex h-9 items-center gap-2 rounded-full border border-[color:var(--surface-ring)] bg-[color:var(--surface-pop)] px-2',
                'text-[14px] font-medium text-[color:var(--text)] shadow-sm transition-colors hover:bg-[color:var(--surface-pop-2)]/80'
              )}
              disabled={isBusy}
              aria-label={accountMenuLabel}
              title={displayName || undefined}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--surface-pop-2)]/70 text-[14px] font-semibold text-[color:var(--text)]">
                {isBusy ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-[var(--brand-accent)]" />
                ) : (
                  <span className="text-sm font-semibold">{userInitial}</span>
                )}
              </div>
              <ChevronDown className="size-4 text-[color:var(--text-muted)]" />
            </Button>
          </DropdownMenuTrigger>

          <PopCard className="w-[320px] space-y-2" sideOffset={12} align="end">
            <div className="px-2 pb-1">
              <div className="flex items-center gap-3 rounded-lg border border-[color:var(--surface-ring)] bg-[color:var(--surface-pop-2)]/70 px-3 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--surface-pop)] text-[16px] font-semibold text-[color:var(--text)]">
                  {userInitial}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[15px] font-semibold text-[color:var(--text)]">
                    {displayName}
                  </div>
                  {displayEmail ? (
                    <div className="truncate text-[13px] text-[color:var(--text-muted)]">
                      {displayEmail}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="tw-label">PROFILE</div>
            <div className="flex flex-col gap-1 px-1">
              <DropdownMenuItem asChild onSelect={() => setUserMenuOpen(false)}>
                <button type="button" className="tw-row text-left">
                  <CircleUserRound className="size-4 text-[color:var(--text-muted)]" />
                  <span className="truncate">Profile settings</span>
                  <span />
                </button>
              </DropdownMenuItem>
              <DropdownMenuItem asChild onSelect={() => setUserMenuOpen(false)}>
                <button type="button" className="tw-row text-left">
                  <Building2 className="size-4 text-[color:var(--text-muted)]" />
                  <span className="truncate">Organization settings</span>
                  <span />
                </button>
              </DropdownMenuItem>
            </div>

            <div className="xl:hidden">
              <div className="pop-div my-2" />
              <div className="tw-label normal-case">Language</div>
              <div className="flex flex-col gap-1 px-1">
                {languageOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onSelect={() => {
                      setLanguage(option.value as any)
                      setUserMenuOpen(false)
                    }}
                    asChild
                  >
                    <button
                      type="button"
                      role="menuitemradio"
                      aria-checked={language === option.value}
                      className="tw-row text-left"
                    >
                      <span className="flex size-8 items-center justify-center rounded-full border border-[color:var(--surface-ring)] text-[13px] font-semibold text-[color:var(--text-muted)]" aria-hidden="true">
                        {option.code}
                      </span>
                      <span className="truncate">{option.label}</span>
                      <Check
                        aria-hidden="true"
                        className={cn(
                          'h-3.5 w-3.5 justify-self-end text-[color:var(--brand-accent)] transition-opacity',
                          language === option.value ? 'opacity-80' : 'opacity-0',
                        )}
                      />
                    </button>
                  </DropdownMenuItem>
                ))}
              </div>
            </div>

            <div className="pop-div my-2" />

            <div className="tw-label">HELP</div>
            <div className="flex flex-col gap-1 px-1">
              <DropdownMenuItem asChild onSelect={() => setUserMenuOpen(false)}>
                <button type="button" className="tw-row text-left">
                  <Keyboard className="size-4 text-[color:var(--text-muted)]" />
                  <span className="truncate">Keyboard shortcuts</span>
                  <span className="tw-kbd">?</span>
                </button>
              </DropdownMenuItem>
              <DropdownMenuItem asChild onSelect={() => setUserMenuOpen(false)}>
                <button type="button" className="tw-row text-left">
                  <LifeBuoy className="size-4 text-[color:var(--text-muted)]" />
                  <span className="truncate">Support</span>
                  <span />
                </button>
              </DropdownMenuItem>
            </div>

            <div className="pop-div my-2" />

            <DropdownMenuItem
              onSelect={() => {
                setUserMenuOpen(false)
                handleSignOut()
              }}
              asChild
            >
              <button type="button" className="tw-row text-left text-red-300 hover:text-red-200">
                <LogOut className="size-4" />
                <span className="truncate">Sign out</span>
                <span />
              </button>
            </DropdownMenuItem>
          </PopCard>
        </DropdownMenu>
        <CartButton />
      </nav>
      <HeaderSearch ref={searchRef} mode="dialog" open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  )
}
