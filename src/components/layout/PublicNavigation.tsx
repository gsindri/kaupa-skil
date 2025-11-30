import React, { useEffect, useRef, useState, useLayoutEffect, useId } from 'react'
import { Link } from 'react-router-dom'
import {
  CircleUserRound,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { HeaderSearch } from '@/components/search/HeaderSearch'
import { HeildaLogo } from '@/components/branding/HeildaLogo'
import { CartButton } from '@/components/cart/CartButton'
import { SearchSoft } from '@/components/icons-soft'
import { useTranslation } from '@/lib/i18n'
import {
  navTextButtonClass,
  navTextButtonFocusRingClass,
  navTextButtonPillClass,
  navTextIconClass,
} from './navStyles'
import { ContentRail } from './ContentRail'
import { LanguageSwitcher } from './LanguageSwitcher'

interface PublicNavigationProps {
  catalogVisible?: boolean
  headerRef?: React.RefCallback<HTMLElement>
  staticPosition?: boolean
}

export function PublicNavigation({ headerRef, staticPosition }: PublicNavigationProps) {
  const { t } = useTranslation()
  const searchRef = useRef<HTMLInputElement>(null)
  const searchTriggerRef = useRef<HTMLButtonElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [platformShortcut, setPlatformShortcut] = useState<'⌘ + K' | 'Ctrl + K'>('Ctrl + K')
  const searchPromptDescriptionId = useId()
  const searchShortcutDescriptionId = useId()
  const searchAriaDescription = `${searchPromptDescriptionId} ${searchShortcutDescriptionId}`.trim()
  const searchOpenedByKeyboardRef = useRef(false)

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
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

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

    // Handle external ref
    if (typeof headerRef === 'function') {
      headerRef(el)
    } else if (headerRef) {
      (headerRef as React.MutableRefObject<HTMLElement | null>).current = el
    }

    const set = () => {
      const h = el.getBoundingClientRect().height || 56
      const clamped = Math.min(72, Math.max(44, h))
      document.documentElement.style.setProperty('--toolbar-h', `${clamped}px`)
      document.documentElement.style.setProperty('--header-h', `${clamped}px`)
    }
    set()
    const ro = new ResizeObserver(set)
    ro.observe(el)
    return () => ro.disconnect()
  }, [headerRef])

  return (
    <div
      ref={barRef}
      role="banner"
      className={cn(
        'flex items-center py-[2px] text-white top-nav-surface',
        !staticPosition && 'sticky top-0 z-[57]',
        scrolled ? 'shadow-lg' : 'shadow-none',
        'transition-[box-shadow] duration-base ease-snap motion-reduce:transition-none'
      )}
      style={{
        height: 'clamp(44px, var(--toolbar-h, 56px), 72px)',
        paddingInline: 0,
        paddingLeft: 'var(--layout-rail, 72px)',
        transform: staticPosition ? undefined : 'translate3d(0, calc(-100% * var(--header-hidden, 0)), 0)',
        transition: staticPosition ? undefined : 'transform 300ms var(--ease-snap)',
        willChange: staticPosition ? undefined : 'transform',
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
              'var(--topbar-overlay, radial-gradient(140% 120% at 48% -10%, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 65%))',
            opacity: 0.14,
          }}
        />
        <div
          className="absolute -left-[18%] top-[-120%] h-[260%] w-[150%]"
          style={{
            background:
              'radial-gradient(140% 120% at 48% -10%, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 65%)',
            opacity: 0.14,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(160deg, rgba(40, 215, 255, 0.1) 0%, rgba(40, 215, 255, 0.04) 28%, rgba(10, 27, 45, 0) 70%)',
          }}
        />

      </div>
      <div className="flex-1">
        <ContentRail includeRailPadding={false}>
          <div
            className="flex w-full flex-wrap items-center gap-y-3"
            style={{
              columnGap: 'var(--page-gutter)',
            }}
          >
            {/* Left Section: Logo */}
            <div className="flex flex-1 items-center justify-start gap-4 md:gap-5">
              <div className="flex min-w-0 flex-shrink-0 items-center gap-4">
                <Link
                  to="/"
                  aria-label={t('navigation.logo.aria')}
                  className="inline-flex shrink-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                >
                  <HeildaLogo className="h-8 w-auto shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]" />
                </Link>
              </div>
            </div>

            {/* Center Section: Search Bar */}
            <div className="flex flex-0 items-center justify-center mx-auto px-4">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={cn(
                    'relative hidden max-w-[220px] min-w-0 items-center truncate text-left text-[13px] font-medium text-white/80 md:inline-flex',
                    "before:pointer-events-none before:absolute before:-right-3 before:top-1/2 before:-translate-y-1/2 before:content-[''] before:border-y-[6px] before:border-l-[6px] before:border-y-transparent before:border-l-white/20"
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
                  className={cn(navTextButtonClass, '!px-0')}
                >
                  <span className={navTextButtonPillClass} aria-hidden="true" />
                  <SearchSoft
                    width={22}
                    height={22}
                    tone={0.25}
                    className={cn(navTextIconClass, 'size-5.5')}
                    aria-hidden="true"
                  />
                  <span className={navTextButtonFocusRingClass} aria-hidden="true" />
                </button>
                <span id={searchPromptDescriptionId} className="sr-only">
                  {t('navigation.search.button')}
                </span>
                <span id={searchShortcutDescriptionId} className="sr-only">
                  {t('navigation.search.shortcut', { shortcut: platformShortcut })}
                </span>
              </div>
            </div>

            {/* Right Section: Global Actions */}
            <nav
              aria-label="Global actions"
              className="flex flex-1 items-center justify-end gap-3"
            >
              <LanguageSwitcher
                className="flex-shrink-0"
                triggerClassName="!px-3"
                labelClassName="hidden md:inline"
                caretClassName="hidden md:inline-flex"
              />

              <Link
                to="/login"
                className={cn(
                  navTextButtonClass,
                  'flex-shrink-0 min-w-[120px] justify-center font-semibold'
                )}
              >
                <span className={navTextButtonPillClass} aria-hidden="true" />
                <CircleUserRound aria-hidden="true" className={navTextIconClass} />
                <span className="truncate">{t('navigation.account.signIn')}</span>
                <span className={navTextButtonFocusRingClass} aria-hidden="true" />
              </Link>

              <span aria-hidden="true" className="pointer-events-none flex h-11 items-center py-2">
                <span className="block h-full w-px rounded-full bg-white/12" />
              </span>
              <CartButton className="!px-3" labelClassName="hidden sm:inline" />
            </nav>
          </div>
        </ContentRail>
      </div>
      <HeaderSearch ref={searchRef} mode="dialog" open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  )
}
