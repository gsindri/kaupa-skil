
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
import { useTranslation } from '@/lib/i18n'
import { PopCard } from './PopCard'
import {
  navTextButtonClass,
  navTextButtonFocusRingClass,
  navTextButtonPillClass,
  navTextCaretClass,
  navTextIconClass,
} from './navStyles'
import { ContentRail } from './ContentRail'
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

export function TopNavigation() {
  const { profile, user, signOut, loading, profileLoading } = useAuth()
  const { setIsDrawerOpen } = useCart()
  const { language, setLanguage } = useLanguage()
  const { t } = useTranslation()
  const languageOptions = useMemo(
    () => [
      { value: 'is', label: t('common.language.options.is'), code: 'IS' },
      { value: 'en', label: t('common.language.options.en'), code: 'EN' }
    ] as const,
    [t]
  )

  const searchRef = useRef<HTMLInputElement>(null)
  const searchTriggerRef = useRef<HTMLButtonElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState(false)
  const lastKey = useRef<string>('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [platformShortcut, setPlatformShortcut] = useState<'⌘ + K' | 'Ctrl + K'>('Ctrl + K')
  const searchPromptDescriptionId = useId()
  const searchShortcutDescriptionId = useId()
  const searchAriaDescription = `${searchPromptDescriptionId} ${searchShortcutDescriptionId}`.trim()
  const searchOpenedByKeyboardRef = useRef(false)
  const accountOpenedByKeyboardRef = useRef(false)
  const accountTriggerRef = useRef<HTMLButtonElement>(null)

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
        searchOpenedByKeyboardRef.current = true
        setSearchOpen(true)
        return
      }

      if (key === '?' && !editable) {
        e.preventDefault()
        accountOpenedByKeyboardRef.current = true
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
      const openedByKeyboard = searchOpenedByKeyboardRef.current
      if (openedByKeyboard) {
        searchTriggerRef.current?.focus()
      } else {
        searchTriggerRef.current?.blur()
      }
      searchOpenedByKeyboardRef.current = false
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

  const rawDisplayName = profile?.full_name ?? user?.email?.split('@')[0] ?? t('common.user.fallback')
  const displayName = useMemo(() => {
    const trimmed = rawDisplayName?.trim()
    if (!trimmed) return t('common.user.fallback')

    if (trimmed === trimmed.toLowerCase()) {
      return trimmed
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
    }

    return trimmed
  }, [rawDisplayName, t])
  const displayEmail = profile?.email || user?.email || ''
  const avatarSeed = displayEmail || displayName || t('common.user.fallback')
  const userInitials = useMemo(
    () => getInitials(displayName || t('common.user.fallback')),
    [displayName, t]
  )
  const avatarColor = useMemo(() => stringToHslColor(avatarSeed), [avatarSeed])
  const userMetadata = user?.user_metadata as Record<string, unknown> | undefined
  const avatarUrl =
    typeof userMetadata?.avatar_url === 'string' ? (userMetadata.avatar_url as string) : undefined
  const accountMenuLabel = displayName
    ? t('navigation.account.openWithName', { name: displayName })
    : t('navigation.account.open')
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
      ? t('navigation.workspace.personalFull')
      : currentTenant.name
    : t('navigation.workspace.personalFull')
  const workspacePillLabel =
    currentTenant?.kind === 'personal'
      ? t('navigation.workspace.personal')
      : t('navigation.workspace.workspace')
  
  return (
    <div
      ref={barRef}
      role="banner"
      className={cn(
        'relative z-[57] flex items-center py-[2px] text-white',
        scrolled ? 'shadow-lg' : 'shadow-none',
        'transition-[box-shadow] duration-base ease-snap motion-reduce:transition-none'
      )}
      style={{
        height: 'clamp(44px, var(--toolbar-h, 56px), 72px)',
        paddingInline: 0,
        ['--align-cap' as any]: 'var(--page-max)',
      } as React.CSSProperties}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden [-z-10]"
        style={{
          opacity: 'calc(1 - (0.05 * var(--header-hidden, 0)))',
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              'var(--topbar-bg, linear-gradient(128deg, #071021 0%, #0a1628 32%, #102642 66%, #153b63 100%))',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'var(--topbar-overlay, radial-gradient(110% 140% at 30% -40%, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.08) 35%, rgba(8,20,36,0) 70%))',
            mixBlendMode: 'screen',
          }}
        />
        <div
          className="absolute -left-[18%] top-[-120%] h-[260%] w-[150%]"
          style={{
            background:
              'radial-gradient(140% 120% at 12% -28%, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.12) 45%, rgba(8,20,36,0) 78%)',
            mixBlendMode: 'screen',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(160deg, rgba(40, 215, 255, 0.28) 0%, rgba(40, 215, 255, 0.08) 32%, rgba(40, 215, 255, 0) 68%)',
            mixBlendMode: 'screen',
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-px bg-white/8" />
      </div>
      <div className="flex-1">
        <ContentRail includeRailPadding={false}>
          <div
            className="flex w-full flex-wrap items-center gap-y-3"
            style={{
              columnGap: 'var(--page-gutter)',
            }}
          >
          <div className="flex min-w-0 flex-shrink-0 items-center gap-4">
            <Link
              to="/"
              aria-label={t('navigation.logo.aria')}
              title={t('navigation.logo.aria')}
              className="inline-flex shrink-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              <HeildaLogo className="h-8 w-auto shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]" />
            </Link>
            <TenantSwitcher />
          </div>

          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span
              className={cn(
                'relative hidden max-w-[220px] min-w-0 items-center truncate text-left text-[13px] font-medium text-white/80 md:inline-flex',
                'before:pointer-events-none before:absolute before:-right-3 before:top-1/2 before:-translate-y-1/2 before:border-y-[6px] before:border-l-[6px] before:border-y-transparent before:border-l-white/20'
              )}
            >
              <span className="truncate">{t('navigation.search.prompt')}</span>
            </span>
            <button
              ref={searchTriggerRef}
              type="button"
              aria-haspopup="dialog"
              aria-keyshortcuts="/ meta+k control+k"
              aria-describedby={searchAriaDescription}
              aria-label={t('navigation.search.open')}
              onPointerDown={() => {
                searchOpenedByKeyboardRef.current = false
              }}
              onKeyDown={(event) => {
                if (event.key === ' ' || event.key === 'Enter') {
                  searchOpenedByKeyboardRef.current = true
                }
              }}
              onClick={() => setSearchOpen(true)}
              title={t('navigation.search.title')}
              className={cn(
                'group inline-flex size-11 items-center justify-center rounded-full border border-white/10 bg-white/5',
                'text-white/80',
                'transition-[background-color,border-color] duration-fast ease-snap',
                'hover:border-white/20 hover:bg-white/10 hover:text-white/90',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent',
              )}
            >
              <span
                aria-hidden="true"
                className="flex size-7 items-center justify-center rounded-full bg-white/10 text-[color:var(--ink-dim,rgba(236,242,248,0.68))] transition-colors duration-fast ease-snap group-hover:bg-white/15 group-hover:text-[color:var(--ink,rgba(236,242,248,0.88))]"
              >
                <SearchSoft width={22} height={22} tone={0.18} />
              </span>
            </button>
            <span id={searchPromptDescriptionId} className="sr-only">
              {t('navigation.search.button')}
            </span>
            <span id={searchShortcutDescriptionId} className="sr-only">
              {t('navigation.search.shortcut', { shortcut: platformShortcut })}
            </span>
          </div>

          <nav
            aria-label="Global actions"
            className="ml-auto flex flex-shrink-0 items-center gap-3.5"
          >
            <LanguageSwitcher
              className="flex-shrink-0"
              triggerClassName="!px-2.5 md:!px-3.5"
              labelClassName="hidden md:inline"
              caretClassName="hidden md:inline-flex"
            />
            {user ? (
              <DropdownMenu
                open={userMenuOpen}
                onOpenChange={(open) => {
                  if (!open && !accountOpenedByKeyboardRef.current) {
                    accountTriggerRef.current?.blur()
                  }
                  if (!open) {
                    accountOpenedByKeyboardRef.current = false
                  }
                  setUserMenuOpen(open)
                }}
              >
                <DropdownMenuTrigger asChild>
                  <button
                    ref={accountTriggerRef}
                    type="button"
                    className={cn(
                      navTextButtonClass,
                      'min-w-0 max-w-[240px] text-left !px-3.5',
                      'disabled:cursor-wait disabled:opacity-80'
                    )}
                    disabled={isBusy}
                    aria-busy={isBusy || undefined}
                    aria-label={accountMenuLabel}
                    aria-haspopup="menu"
                    title={displayName || undefined}
                    onPointerDown={() => {
                      accountOpenedByKeyboardRef.current = false
                    }}
                    onKeyDown={(event) => {
                      if (event.key === ' ' || event.key === 'Enter' || event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                        accountOpenedByKeyboardRef.current = true
                      }
                    }}
                  >
                    <span className={navTextButtonPillClass} aria-hidden="true" />
                    <span
                      aria-hidden="true"
                      className="relative flex size-4 shrink-0 items-center justify-center"
                    >
                      <span
                        className={cn(
                          'size-4 shrink-0 rounded-full border-2 border-[color:var(--ink,rgba(236,242,248,0.88))] border-b-transparent transition-opacity',
                          isBusy ? 'animate-spin opacity-100' : 'opacity-0'
                        )}
                      />
                    </span>
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
                      <div className="min-w-0 text-[12px] text-[color:var(--text-muted)]">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="inline-flex shrink-0 items-center rounded-full bg-white/10 px-2 py-[2px] text-[10px] font-semibold uppercase tracking-[0.08em] text-white/80">
                            {workspacePillLabel}
                          </span>
                          <span className="flex-1 min-w-0 whitespace-normal text-left leading-tight">
                            {membershipsLoading
                              ? t('common.status.loadingWorkspace')
                              : workspaceLabel}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="tw-label normal-case opacity-60">{t('navigation.account.profileSection')}</div>
                <div className="flex flex-col gap-1 px-1">
                  <DropdownMenuItem asChild onSelect={() => setUserMenuOpen(false)}>
                    <button type="button" className="tw-row tw-row-loose w-full text-left">
                      <CircleUserRound className="size-4 text-[color:var(--text-muted)]" />
                      <span className="truncate">{t('navigation.account.profileSettings')}</span>
                      <span />
                    </button>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild onSelect={() => setUserMenuOpen(false)}>
                    <button type="button" className="tw-row tw-row-loose w-full text-left">
                      <Building2 className="size-4 text-[color:var(--text-muted)]" />
                      <span className="truncate">{t('navigation.account.organizationSettings')}</span>
                      <ChevronRight className="size-4 text-[color:var(--text-muted)]" aria-hidden />
                    </button>
                  </DropdownMenuItem>
                </div>

                <div className="xl:hidden">
                  <div className="pop-div my-2 opacity-70" />
                  <div className="tw-label normal-case opacity-60">{t('navigation.account.languageSection')}</div>
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
                          className="tw-row tw-row-loose w-full text-left"
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

                <div className="tw-label normal-case opacity-60">{t('navigation.account.helpSection')}</div>
                <div className="flex flex-col gap-1 px-1">
                  <DropdownMenuItem asChild onSelect={() => setUserMenuOpen(false)}>
                    <button type="button" className="tw-row tw-row-loose w-full text-left">
                      <Keyboard className="size-4 text-[color:var(--text-muted)]" />
                      <span className="truncate">{t('navigation.account.keyboardShortcuts')}</span>
                      <span className="tw-kbd">?</span>
                    </button>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild onSelect={() => setUserMenuOpen(false)}>
                    <a
                      href="https://help.heilda.app"
                      target="_blank"
                      rel="noreferrer"
                      className="tw-row tw-row-loose w-full text-left"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <LifeBuoy className="size-4 text-[color:var(--text-muted)]" />
                      <span className="truncate">{t('navigation.account.helpCenter')}</span>
                      <ArrowUpRight className="size-4 text-[color:var(--text-muted)]" aria-hidden />
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild onSelect={() => setUserMenuOpen(false)}>
                    <a
                      href="mailto:support@heilda.app"
                      className="tw-row tw-row-loose w-full text-left"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Mail className="size-4 text-[color:var(--text-muted)]" />
                      <span className="truncate">{t('navigation.account.contactSupport')}</span>
                      <span />
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild onSelect={() => setUserMenuOpen(false)}>
                    <a
                      href="https://docs.heilda.app"
                      target="_blank"
                      rel="noreferrer"
                      className="tw-row tw-row-loose w-full text-left"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <BookOpen className="size-4 text-[color:var(--text-muted)]" />
                      <span className="truncate">{t('navigation.account.documentation')}</span>
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
                    className="tw-row tw-row-loose w-full text-left text-[color:var(--text)]"
                  >
                    <LogOut className="size-4 text-[color:var(--text-muted)]" aria-hidden />
                    <span className="truncate">{t('navigation.account.signOut')}</span>
                    <span />
                  </button>
                </DropdownMenuItem>
              </PopCard>
            </DropdownMenu>
          ) : (
            <Link
              to="/login"
              className={cn(
                navTextButtonClass,
                'flex-shrink-0 min-w-[120px] justify-center font-semibold text-[color:var(--ink,rgba(236,242,248,0.88))]'
              )}
            >
              <span className={navTextButtonPillClass} aria-hidden="true" />
              <CircleUserRound aria-hidden="true" className={navTextIconClass} />
              <span className="truncate">{t('navigation.account.signIn')}</span>
              <span className={navTextButtonFocusRingClass} aria-hidden="true" />
            </Link>
          )}
          <span aria-hidden="true" className="pointer-events-none flex h-11 items-center py-2">
            <span className="block h-full w-px rounded-full bg-white/12" />
          </span>
          <CartButton labelClassName="hidden sm:inline" />
          </nav>
          </div>
        </ContentRail>
      </div>
      <HeaderSearch ref={searchRef} mode="dialog" open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  )
}
