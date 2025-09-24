
import React, { useEffect, useRef, useState, useLayoutEffect, useId, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { DropdownMenu, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import {
  Building2,
  CircleUserRound,
  Keyboard,
  LifeBuoy,
  ChevronDown,
  Check,
  BookOpen,
  Mail,
  LogOut,
  ArrowUpRight,
  ChevronRight,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { TenantSwitcher } from './TenantSwitcher'
import { useAuth } from '@/contexts/useAuth'
import { useCart } from '@/contexts/useBasket'
import { LanguageSwitcher } from './LanguageSwitcher'
import { cn } from '@/lib/utils'
import { HeaderSearch } from '@/components/search/HeaderSearch'
import { HeildaLogo } from '@/components/branding/HeildaLogo'
import { CartButton } from '@/components/cart/CartButton'
import { SearchSoft } from '@/components/icons-soft'
import { useLanguage } from '@/contexts/LanguageProvider'
import { PopCard } from './PopCard'
import {
  navTextButtonClass,
  navTextButtonFocusRingClass,
  navTextButtonPillClass,
  navTextCaretClass,
} from './navStyles'
import { supabase } from '@/integrations/supabase/client'

type Membership = {
  id: string
  base_role: string
  tenant: { id: string; name: string; kind: string } | null
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function stringToHslColor(value: string) {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue} 65% 45%)`
}

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

  const rawDisplayName = profile?.full_name ?? user?.email?.split('@')[0] ?? 'User'
  const displayName = useMemo(() => {
    const trimmed = rawDisplayName?.trim()
    if (!trimmed) return 'User'

    if (trimmed === trimmed.toLowerCase()) {
      return trimmed
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
    }

    return trimmed
  }, [rawDisplayName])
  const displayEmail = profile?.email || user?.email || ''
  const avatarSeed = displayEmail || displayName || 'User'
  const userInitials = useMemo(() => getInitials(displayName || 'User'), [displayName])
  const avatarColor = useMemo(() => stringToHslColor(avatarSeed), [avatarSeed])
  const userMetadata = user?.user_metadata as Record<string, unknown> | undefined
  const avatarUrl =
    typeof userMetadata?.avatar_url === 'string' ? (userMetadata.avatar_url as string) : undefined
  const accountMenuLabel = displayName
    ? `Open account menu for ${displayName}`
    : 'Open account menu'
  const isBusy = loading || profileLoading

  const { data: userMemberships = [], isLoading: membershipsLoading } = useQuery<Membership[]>({
    queryKey: ['user-memberships', user?.id],
    queryFn: async () => {
      if (!user?.id) return []

      const { data, error } = await supabase
        .from('memberships')
        .select(`id, base_role, tenant:tenants(id, name, kind)`)
        .eq('user_id', user.id)

      if (error) throw error

      const transformedData = (data || []).map((item) => ({
        ...item,
        tenant: Array.isArray(item.tenant)
          ? item.tenant.length > 0
            ? item.tenant[0]
            : null
          : item.tenant || null,
      })) as Membership[]

      return transformedData
    },
    enabled: !!user?.id,
  })

  const currentTenant = userMemberships.find((membership) => membership.tenant?.id === profile?.tenant_id)?.tenant
  const workspaceLabel = currentTenant
    ? currentTenant.kind === 'personal'
      ? 'Personal workspace (Private)'
      : currentTenant.name
    : 'Personal workspace (Private)'
  const workspacePillLabel = currentTenant?.kind === 'personal' ? 'Personal' : 'Workspace'
  
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

      <nav aria-label="Global actions" className="ml-auto flex items-center gap-[12px] lg:gap-[14px]">
        <span className="inline-flex h-9 items-center whitespace-nowrap text-[13px] font-medium text-white/80">
          Search here →
        </span>
        <button
          ref={searchTriggerRef}
          type="button"
          aria-haspopup="dialog"
          aria-keyshortcuts="/ meta+k control+k"
          aria-describedby={searchShortcutDescriptionId}
          aria-label="Open search dialog"
          onClick={() => setSearchOpen(true)}
          title="Search (Ctrl/⌘ + K)"
          className="group inline-flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-[background-color,border-color,transform] duration-fast ease-snap hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent motion-safe:hover:-translate-y-[0.5px] motion-reduce:transform-none motion-reduce:hover:translate-y-0"
        >
          <span className="sr-only">Open search dialog</span>
          <span
            aria-hidden="true"
            className="flex size-full items-center justify-center rounded-full bg-white/10 text-[color:var(--ink-dim,#cfd7e4)] transition-colors duration-fast ease-snap group-hover:bg-white/15 group-hover:text-[color:var(--ink,#eaf0f7)]"
          >
            <SearchSoft width={24} height={24} tone={0.18} />
          </span>
        </button>
        <span id={searchShortcutDescriptionId} className="sr-only">
          Open search dialog. Shortcut: press / or {platformShortcut}.
        </span>
        <LanguageSwitcher className="hidden xl:block" />
        <DropdownMenu open={userMenuOpen} onOpenChange={setUserMenuOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                navTextButtonClass,
                'min-w-0 max-w-[240px] text-left',
                'disabled:cursor-wait disabled:opacity-80'
              )}
              disabled={isBusy}
              aria-busy={isBusy || undefined}
              aria-label={accountMenuLabel}
              aria-haspopup="menu"
              title={displayName || undefined}
            >
              <span className={navTextButtonPillClass} aria-hidden="true" />
              {isBusy ? (
                <span
                  aria-hidden="true"
                  className="size-4 shrink-0 animate-spin rounded-full border-2 border-[color:var(--ink,#eaf0f7)] border-b-transparent"
                />
              ) : null}
              <span className="min-w-0 truncate">{displayName}</span>
              <ChevronDown className={navTextCaretClass} aria-hidden="true" />
              <span className={navTextButtonFocusRingClass} aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>

          <PopCard
            className="w-[320px] space-y-2"
            sideOffset={12}
            align="end"
            withOverlay
          >
            <div className="px-2.5 pt-2">
              <div className="flex items-center gap-3 rounded-[14px] bg-[color:var(--surface-pop)]/35 px-3 py-3">
                <Avatar className="h-11 w-11 border border-white/10 bg-white/10 shadow-[0_1px_4px_rgba(15,23,42,0.32)]">
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt={`${displayName} avatar`} className="object-cover" />
                  ) : null}
                  <AvatarFallback
                    style={{ background: avatarColor }}
                    className="text-sm font-semibold uppercase tracking-wide text-white"
                  >
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 space-y-1">
                  <div className="truncate text-[15px] font-semibold text-[color:var(--text)]">
                    {displayName}
                  </div>
                  {displayEmail ? (
                    <div className="truncate text-[13px] text-[color:var(--text-muted)]">
                      {displayEmail}
                    </div>
                  ) : null}
                  <div className="flex items-center gap-2 text-[12px] text-[color:var(--text-muted)]">
                    <span className="inline-flex items-center rounded-full bg-white/10 px-2 py-[2px] text-[10px] font-semibold uppercase tracking-[0.08em] text-white/80">
                      {workspacePillLabel}
                    </span>
                    <span className="truncate">
                      {membershipsLoading ? 'Loading workspace…' : workspaceLabel}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="tw-label normal-case opacity-60">Profile</div>
            <div className="flex flex-col gap-1 px-1">
              <DropdownMenuItem asChild onSelect={() => setUserMenuOpen(false)}>
                <button type="button" className="tw-row tw-row-loose text-left">
                  <CircleUserRound className="size-4 text-[color:var(--text-muted)]" />
                  <span className="truncate">Profile settings</span>
                  <span />
                </button>
              </DropdownMenuItem>
              <DropdownMenuItem asChild onSelect={() => setUserMenuOpen(false)}>
                <button type="button" className="tw-row tw-row-loose text-left">
                  <Building2 className="size-4 text-[color:var(--text-muted)]" />
                  <span className="truncate">Organization settings</span>
                  <ChevronRight className="size-4 text-[color:var(--text-muted)]" aria-hidden />
                </button>
              </DropdownMenuItem>
            </div>

            <div className="xl:hidden">
              <div className="pop-div my-2 opacity-70" />
              <div className="tw-label normal-case opacity-60">Language</div>
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
                      className="tw-row tw-row-loose text-left"
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

            <div className="pop-div my-2 opacity-70" />

            <div className="tw-label normal-case opacity-60">Help</div>
            <div className="flex flex-col gap-1 px-1">
              <DropdownMenuItem asChild onSelect={() => setUserMenuOpen(false)}>
                <button type="button" className="tw-row tw-row-loose text-left">
                  <Keyboard className="size-4 text-[color:var(--text-muted)]" />
                  <span className="truncate">Keyboard shortcuts</span>
                  <span className="tw-kbd">?</span>
                </button>
              </DropdownMenuItem>
              <DropdownMenuItem asChild onSelect={() => setUserMenuOpen(false)}>
                <a
                  href="https://help.heilda.app"
                  target="_blank"
                  rel="noreferrer"
                  className="tw-row tw-row-loose text-left"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <LifeBuoy className="size-4 text-[color:var(--text-muted)]" />
                  <span className="truncate">Help center</span>
                  <ArrowUpRight className="size-4 text-[color:var(--text-muted)]" aria-hidden />
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild onSelect={() => setUserMenuOpen(false)}>
                <a
                  href="mailto:support@heilda.app"
                  className="tw-row tw-row-loose text-left"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <Mail className="size-4 text-[color:var(--text-muted)]" />
                  <span className="truncate">Contact support</span>
                  <span />
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild onSelect={() => setUserMenuOpen(false)}>
                <a
                  href="https://docs.heilda.app"
                  target="_blank"
                  rel="noreferrer"
                  className="tw-row tw-row-loose text-left"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <BookOpen className="size-4 text-[color:var(--text-muted)]" />
                  <span className="truncate">Documentation</span>
                  <ArrowUpRight className="size-4 text-[color:var(--text-muted)]" aria-hidden />
                </a>
              </DropdownMenuItem>
            </div>

            <div className="pop-div my-2 opacity-70" />

            <DropdownMenuItem
              onSelect={() => {
                setUserMenuOpen(false)
                handleSignOut()
              }}
              asChild
            >
              <button
                type="button"
                className="tw-row tw-row-loose text-left text-[color:var(--text)]"
              >
                <LogOut className="size-4 text-[color:var(--text-muted)]" aria-hidden />
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
