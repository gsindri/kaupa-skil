# Topbar ChatPack 2025-09-11T03:04:17.963Z

_Contains 11 file(s)._

---

## src\components\cart\CartDrawer.tsx

```tsx
import * as React from "react"
import { Sheet, SheetContent, SheetClose } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Trash2, X } from "lucide-react"
import { useCart } from "@/contexts/useBasket"
import { useSettings } from "@/contexts/useSettings"
import { QuantityStepper } from "./QuantityStepper"

export function CartDrawer() {
  const {
    items,
    updateQuantity,
    removeItem,
    getTotalPrice,
    getMissingPriceCount,
    isDrawerOpen,
    setIsDrawerOpen,
  } = useCart()
  const { includeVat, setIncludeVat } = useSettings()

  const subtotal = getTotalPrice(includeVat)
  const missingPriceCount = getMissingPriceCount()
  const formatCurrency = (n: number) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "ISK",
      maximumFractionDigits: 0,
    }).format(n || 0)

  return (
    <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
      <SheetContent
        side="right"
        className="w-[380px] max-w-[92vw] p-0 flex flex-col [&>button:last-child]:hidden"
        aria-label="Shopping cart"
        id="cart-drawer"
      >
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="text-sm leading-tight">
              <span aria-live="polite" className="sr-only">
                Cart subtotal {formatCurrency(subtotal)}
              </span>
              <div className="text-muted-foreground">Subtotal</div>
              <div className="font-semibold text-base">{formatCurrency(subtotal)}</div>
            </div>
            <div className="flex items-center gap-2">
              {missingPriceCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  Some prices unavailable
                </Badge>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsDrawerOpen(false)
                  location.assign("/cart")
                }}
              >
                Go to Cart
              </Button>
              <SheetClose asChild>
                <Button variant="ghost" size="icon" aria-label="Close cart">
                  <X className="h-5 w-5" />
                </Button>
              </SheetClose>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="px-3 py-2 space-y-3">
            {items.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Your cart is empty.
              </div>
            )}

            {items.map(it => (
              <div key={it.supplierItemId} className="rounded-lg border p-3">
                <div className="flex gap-3">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                    {it.image ? (
                      <img src={it.image} alt="" className="h-full w-full object-contain" />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{it.displayName || it.itemName}</div>
                    {it.packSize ? (
                      <div className="text-xs text-muted-foreground">{it.packSize}</div>
                    ) : null}
                    {it.supplierName ? (
                      <div className="mt-0.5 text-xs text-muted-foreground">{it.supplierName}</div>
                    ) : null}

                    <div className="mt-2 text-sm font-semibold">
                      {formatCurrency(
                        includeVat
                          ? it.unitPriceIncVat ?? it.packPrice ?? 0
                          : it.unitPriceExVat ?? it.packPrice ?? 0,
                      )}
                    </div>

                    <div className="mt-2 inline-flex items-center gap-2">
                      <QuantityStepper
                        quantity={it.quantity}
                        onChange={qty =>
                          qty === 0
                            ? removeItem(it.supplierItemId)
                            : updateQuantity(it.supplierItemId, qty)
                        }
                        label={it.displayName || it.itemName}
                      />

                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove ${it.displayName || "item"}`}
                        className="ml-1 text-destructive hover:text-destructive"
                        onClick={() => removeItem(it.supplierItemId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="sticky bottom-0 z-10 border-t bg-background/95 backdrop-blur">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2 text-xs">
              <Button
                variant={!includeVat ? "default" : "outline"}
                size="sm"
                onClick={() => setIncludeVat(false)}
              >
                Ex VAT
              </Button>
              <Button
                variant={includeVat ? "default" : "outline"}
                size="sm"
                onClick={() => setIncludeVat(true)}
              >
                Inc VAT
              </Button>
            </div>
            <Button size="lg" className="min-w-[140px]" onClick={() => location.assign("/checkout")}>
              Checkout
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default CartDrawer


```


---

## src\components\layout\AppChrome.tsx

```tsx
import React from 'react'

export function AppChrome() {
  return (
    <>
      {/* Cyan stripe - positioned absolutely within the right column */}
      <div className="absolute inset-x-0 top-0 z-[60] h-[2px] bg-gradient-to-r from-cyan-300/70 via-cyan-400 to-cyan-300/70 pointer-events-none" />
      
      {/* Chrome gradient background - scoped to right column */}
      <div
        className="absolute top-0 left-0 right-0 z-[var(--z-chrome,20)] pointer-events-none overflow-hidden"
        style={{ height: 'clamp(40px, var(--chrome-h, 56px), 120px)' }}
        aria-hidden
      >
        {/* gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B1220] via-[#0E1B35] to-[#0E2A5E]" />
        {/* subtle separator at chrome bottom */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-white/8" />
      </div>
    </>
  )
}

export default AppChrome

```


---

## src\components\layout\AppLayout.tsx

```tsx
import React, {
  ReactNode,
  useCallback,
  useLayoutEffect,
  useRef,
  MutableRefObject
} from 'react'
import { Outlet } from 'react-router-dom'
import { TopNavigation } from './TopNavigation'
import { PrimaryNavRail } from './PrimaryNavRail'
import { AppChrome } from './AppChrome'
import { CartDrawer } from '@/components/cart/CartDrawer'

interface AppLayoutProps {
  header?: ReactNode
  secondary?: ReactNode
  panelOpen?: boolean
  children?: ReactNode
  headerRef?: React.Ref<HTMLDivElement>
  headerClassName?: string
}

export function AppLayout({
  header,
  children,
  headerRef,
  headerClassName
}: AppLayoutProps) {
  const internalHeaderRef = useRef<HTMLDivElement>(null)
  const combinedHeaderRef = useCallback(
    (node: HTMLDivElement | null) => {
      internalHeaderRef.current = node
      if (typeof headerRef === 'function') headerRef(node)
      else if (headerRef && 'current' in headerRef)
        (headerRef as MutableRefObject<HTMLDivElement | null>).current = node
    },
    [headerRef]
  )

  useLayoutEffect(() => {
    const el = internalHeaderRef.current
    if (!el) return
    const update = () => {
      const h = el.getBoundingClientRect().height || 56
      const clamped = Math.min(120, Math.max(40, Math.round(h)))
      document.documentElement.style.setProperty('--header-h', `${clamped}px`)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)

    const rail = document.querySelector('[data-rail]')
    if (rail instanceof HTMLElement) {
      document.documentElement.style.setProperty('--header-left', `${rail.offsetWidth}px`)
    }

    return () => ro.disconnect()
  }, [])

  return (
    <div
      className="relative min-h-dvh grid"
      style={{ gridTemplateColumns: 'var(--layout-rail,72px) 1fr' }}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only absolute left-2 top-2 z-[var(--z-header,50)] px-3 py-2 rounded bg-[var(--button-primary)] text-white"
      >
        Skip to content
      </a>
      <AppChrome />

      {/* Left rail */}
      <aside
        data-rail
        className="sticky top-0 h-dvh"
        style={{ zIndex: 'var(--z-rail,40)' }}
      >
        <PrimaryNavRail />
      </aside>

      {/* Right column: header + page */}
      <div className="relative">
        {/* Header is now scoped to the right column only */}
        <div
          id="catalogHeader"
          ref={combinedHeaderRef}
          className={headerClassName}
          style={{ position: 'sticky', top: 0, zIndex: 'var(--z-header,50)' }}
        >
          <TopNavigation />
          {header}
        </div>

        {/* Content; if header overlays, pad with the measured height */}
        <main
          id="main-content"
          style={{ paddingTop: 'var(--header-h, var(--layout-header-h,56px))' }}
        >
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
            {children ?? <Outlet />}
          </div>
        </main>
      </div>
      <CartDrawer />
    </div>
  )
}

export default AppLayout

```


---

## src\components\layout\FullWidthLayout.tsx

```tsx
import React, { useLayoutEffect, useRef } from 'react'
import { TopNavigation } from './TopNavigation'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { cn } from '@/lib/utils'
import { AppChrome } from './AppChrome'
import { PrimaryNavRail } from './PrimaryNavRail'

interface FullWidthLayoutProps {
  children: React.ReactNode
  header?: React.ReactNode
  headerClassName?: string
  headerRef?: React.Ref<HTMLDivElement>
  contentProps?: React.HTMLAttributes<HTMLDivElement>
}

export function FullWidthLayout({
  children,
  header,
  headerClassName,
  headerRef,
  contentProps,
}: FullWidthLayoutProps) {
  const { className: contentClassName, style: contentStyle, ...restContentProps } = contentProps || {}
  const internalHeaderRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const el = internalHeaderRef.current
    if (!el) return
    const update = () => {
      const h = el.getBoundingClientRect().height || 56
      const clamped = Math.min(120, Math.max(40, Math.round(h)))
      document.documentElement.style.setProperty('--header-h', `${clamped}px`)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const setHeaderRef = (node: HTMLDivElement | null) => {
    internalHeaderRef.current = node as HTMLDivElement
    if (typeof headerRef === 'function') headerRef(node as HTMLDivElement)
    else if (headerRef && 'current' in (headerRef as any)) (headerRef as any).current = node
  }

  return (
    <div
      className="min-h-dvh grid"
      style={{ gridTemplateColumns: 'var(--layout-rail,72px) 1fr' }}
    >
      {/* Left rail */}
      <aside
        className="sticky top-0 h-dvh"
        style={{ zIndex: 'var(--z-rail,40)' }}
      >
        <PrimaryNavRail />
      </aside>

      {/* Right column: header + page */}
      <div className="relative">
        <AppChrome />
        {/* Header is now scoped to the right column only */}
        <div
          id="catalogHeader"
          ref={setHeaderRef}
          className={cn(headerClassName)}
          style={{ position: 'sticky', top: 0, zIndex: 'var(--z-header,30)' }}
        >
          <TopNavigation />
          {header && (
            <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">{header}</div>
          )}
        </div>

        {/* Content; if header overlays, pad with the measured height */}
        <div
          id="catalogContent"
          className={cn(
            'flex-1 min-h-0 px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12',
            contentClassName,
          )}
          style={{ 
            paddingTop: 'var(--header-h, var(--layout-header-h,56px))',
            ...contentStyle 
          }}
          {...restContentProps}
        >
          {children}
        </div>
      </div>

      <CartDrawer />
    </div>
  )
}

```


---

## src\components\layout\LanguageSwitcher.tsx

```tsx
import React from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ChevronDown, Languages } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageProvider'

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 px-3 rounded-2xl bg-white/8 hover:bg-white/12 ring-1 ring-white/10 text-slate-100 flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21D4D6]"
          aria-label="Change language"
        >
          <Languages className="icon-20" strokeWidth={1.75} />
          <span className="hidden lg:inline ml-2">{language === 'is' ? 'Icelandic' : 'English'}</span>
          <ChevronDown className="hidden lg:inline ml-1 icon-20" strokeWidth={1.75} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="bottom"
        sideOffset={8}
        collisionPadding={8}
        sticky="partial"
        className="min-w-[200px]"
      >
        <DropdownMenuRadioGroup value={language} onValueChange={(v) => setLanguage(v as any)}>
          <DropdownMenuRadioItem value="is">Icelandic</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="en">English</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

```


---

## src\components\layout\TenantSwitcher.tsx

```tsx
import React from 'react'
import {
  Check,
  ChevronDown,
  House,
  LogIn,
  Plus
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useAuth } from '@/contexts/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { cn } from '@/lib/utils'

type Membership = {
  id: string
  base_role: string
  tenant: { id: string; name: string } | null
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function TenantSwitcher() {
  const { profile, user } = useAuth()
  const navigate = useNavigate()

  const [open, setOpen] = React.useState(false)

  // Load memberships
  const { data: userMemberships = [] } = useQuery<Membership[]>({
    queryKey: ['user-memberships', user?.id],
    queryFn: async () => {
      if (!user?.id) return []

      const { data, error } = await supabase
        .from('memberships')
        .select(
          `id, base_role, tenant:tenants(id, name)`
        )
        .eq('user_id', user.id)

      if (error) throw error
      return (data as any) as Membership[]
    },
    enabled: !!user?.id
  })

  // Derived tenant data
  const currentTenant = userMemberships.find(
    (m) => m.tenant && m.tenant.id === profile?.tenant_id
  )?.tenant

  const displayName = currentTenant?.name || 'Personal workspace'

  const handleTenantSwitch = async (tenantId: string | null) => {
    if (!user?.id) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ tenant_id: tenantId })
        .eq('id', user.id)

      if (error) throw error

      window.location.reload()
    } catch (error) {
      console.error('Failed to switch tenant:', error)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          aria-label="Switch workspace"
          className="flex w-52 items-center justify-between px-3 h-11 rounded-3 bg-white/5 hover:bg-white/10 ring-1 ring-white/10 text-slate-100 focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[0_0_0_2px_var(--brand-accent)]"
        >
          <span className="truncate display font-semibold" title={displayName}>
            {displayName}
          </span>
          <ChevronDown className="icon-20 shrink-0" strokeWidth={1.75} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-2">
        <Command>
          <CommandInput
            placeholder="Search workspaces..."
            className="h-9 text-sm pl-8 pr-2 rounded-md border"
          />
          <CommandSeparator className="my-2 h-px bg-border/50" />
          <CommandList>
            <CommandEmpty>No workspaces found.</CommandEmpty>
            <CommandGroup
              heading="Workspaces"
              className="px-0 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-foreground/60"
            >
              <CommandItem
                value="personal"
                onSelect={() => {
                  handleTenantSwitch(null)
                  setOpen(false)
                }}
                className={cn(
                  'group relative grid grid-cols-[24px,1fr,auto,16px] items-center gap-2 px-2 py-2 rounded-md border border-transparent transition',
                  !profile?.tenant_id
                    ? 'border-2 border-brand-600 bg-transparent before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:bg-brand-600'
                    : 'hover:border-border-subtle hover:bg-foreground/[0.02]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-1'
                )}
              >
                <House
                  className={cn(
                    'size-5',
                    !profile?.tenant_id
                      ? 'text-foreground'
                      : 'text-foreground/70 group-hover:text-foreground/90'
                  )}
                />
                <span
                  className="truncate text-sm text-foreground"
                  title="Personal workspace"
                >
                  Personal workspace
                </span>
                <span className="justify-self-end" />
                <Check
                  className={cn(
                    'size-4 justify-self-end text-brand-600 transition-opacity',
                    !profile?.tenant_id ? 'opacity-100' : 'opacity-0'
                  )}
                />
              </CommandItem>
              {userMemberships.map((membership) => {
                const tenant = membership.tenant
                if (!tenant) return null
                const isCurrent = tenant.id === profile?.tenant_id
                return (
                  <CommandItem
                    key={membership.id}
                    value={tenant.name}
                    onSelect={() => {
                      handleTenantSwitch(tenant.id)
                      setOpen(false)
                    }}
                    className={cn(
                      'group relative grid grid-cols-[24px,1fr,auto,16px] items-center gap-2 px-2 py-2 rounded-md border border-transparent transition',
                      isCurrent
                        ? 'border-2 border-brand-600 bg-transparent before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:bg-brand-600'
                        : 'hover:border-border-subtle hover:bg-foreground/[0.02]',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-1'
                    )}
                  >
                    <Avatar
                      className={cn(
                        'h-6 w-6',
                        isCurrent
                          ? 'text-foreground'
                          : 'text-foreground/70 group-hover:text-foreground/90'
                      )}
                    >
                      <AvatarFallback>{getInitials(tenant.name)}</AvatarFallback>
                    </Avatar>
                    <span
                      className="truncate text-left text-sm text-foreground"
                      title={tenant.name}
                    >
                      {tenant.name}
                    </span>
                    <span
                      className={cn(
                        'ml-2 justify-self-end whitespace-nowrap text-xs px-2 py-0.5 rounded-full',
                        isCurrent
                          ? 'bg-brand-50 text-brand-700'
                          : 'bg-muted text-foreground'
                      )}
                    >
                      {membership.base_role}
                    </span>
                    <Check
                      className={cn(
                        'size-4 justify-self-end text-brand-600 transition-opacity',
                        isCurrent ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                  </CommandItem>
                )
              })}
            </CommandGroup>
            <CommandSeparator className="my-2 h-px bg-border/50" />
            <CommandGroup
              heading="Actions"
              className="px-0 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-foreground/60"
            >
              <CommandItem
                onSelect={() => {
                  navigate('/settings/organization/create')
                  setOpen(false)
                }}
                className="group grid grid-cols-[24px,1fr] items-center gap-2 px-2 py-2 rounded-md border border-transparent text-sm transition hover:border-border-subtle hover:bg-foreground/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-1"
              >
                <Plus className="size-5 text-foreground/70 group-hover:text-foreground/90" />
                <span className="text-sm text-foreground">Create workspace</span>
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  navigate('/settings/organization/join')
                  setOpen(false)
                }}
                className="group grid grid-cols-[24px,1fr] items-center gap-2 px-2 py-2 rounded-md border border-transparent text-sm transition hover:border-border-subtle hover:bg-foreground/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-1"
              >
                <LogIn className="size-5 text-foreground/70 group-hover:text-foreground/90" />
                <span className="text-sm text-foreground">Join workspace</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}


```


---

## src\components\layout\TopNavigation.tsx

```tsx

import React, { useEffect, useRef, useState } from 'react'
import { HelpCircle, ChevronDown, ShoppingCart } from 'lucide-react'
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
import { LanguageSwitcher } from './LanguageSwitcher'
import { cn } from '@/lib/utils'
import { HeaderSearch } from '@/components/search/HeaderSearch'

export function TopNavigation() {
  const { profile, user, signOut, loading, profileLoading } = useAuth()
  const { setIsDrawerOpen, getTotalItems, isDrawerOpen } = useCart()
  const cartCount = getTotalItems()

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
      data-app-header="true"
      className={cn(
        'z-[var(--z-header,50)] pt-[2px] px-3 sm:px-4 flex items-center gap-3 text-white',
        scrolled ? 'shadow-lg' : 'shadow-none',
        'transition-[box-shadow] duration-base ease-snap motion-reduce:transition-none'
      )}
      style={{
        height: 'clamp(40px, var(--chrome-h, 56px), 120px)'
      }}
    >
      <TenantSwitcher />

      <div className="flex-1 min-w-[200px] md:min-w-[520px] max-w-[1040px]">
        <HeaderSearch ref={searchRef} />
      </div>

      <nav aria-label="Global actions" className="flex items-center gap-2">
        <DropdownMenu open={helpOpen} onOpenChange={setHelpOpen} modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-3 rounded-2xl bg-white/8 hover:bg-white/12 ring-1 ring-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21D4D6]"
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
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className="relative inline-flex items-center gap-2 h-9 px-3 rounded-2xl bg-[var(--button-primary)] hover:bg-[var(--button-primary-hover)] text-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21D4D6] ui-numeric duration-fast ease-snap motion-reduce:transition-none"
          aria-haspopup="dialog"
          aria-expanded={isDrawerOpen}
          aria-controls="cart-drawer"
        >
          <ShoppingCart className="icon-20" strokeWidth={1.75} />
          <span className="font-semibold">Cart</span>
          {cartCount > 0 && (
            <span
              aria-live="polite"
              className="ml-1 rounded-pill bg-[var(--brand-accent)] text-slate-900 text-xs px-2 py-0.5 min-w-[1.25rem] text-center ui-numeric"
            >
              {cartCount}
            </span>
          )}
        </button>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-2 rounded-2xl bg-white/8 hover:bg-white/12 ring-1 ring-white/10 flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21D4D6]"
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
  )
}

```


---

## src\components\search\HeaderSearch.tsx

```tsx
import React, { useState, useEffect } from 'react'
import { SearchInput } from './SearchInput'
import { SearchResultsPopover } from './SearchResultsPopover'
import { useGlobalSearch, SearchScope } from '@/hooks/useGlobalSearch'

function useRecentSearches(orgId: string) {
  const key = `recent-searches:${orgId}`
  const [items, setItems] = useState<string[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key)
      if (stored) setItems(JSON.parse(stored))
    } catch (_e) {
      // ignore
    }
  }, [key])

  const add = (q: string) => {
    if (!q) return
    const next = [q, ...items.filter((i) => i !== q)].slice(0, 10)
    setItems(next)
    try {
      localStorage.setItem(key, JSON.stringify(next))
    } catch (_e) {
      // ignore
    }
  }

  return { items, add }
}

export const HeaderSearch = React.forwardRef<HTMLInputElement>((_props, ref) => {
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [scope, setScope] = useState<SearchScope>('all')
  const { sections, isLoading } = useGlobalSearch(query, scope)
  const { items: recent, add: addRecent } = useRecentSearches('default')
  const [activeIndex, setActiveIndex] = useState(0)

  const items = [
    ...sections.products.map((p) => ({ ...p, section: 'products' })),
    ...sections.suppliers.map((p) => ({ ...p, section: 'suppliers' })),
    ...sections.orders.map((p) => ({ ...p, section: 'orders' }))
  ]

  const open = expanded && (query.length > 0 || recent.length > 0)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, items.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      if (items[activeIndex]) {
        handleSelect(items[activeIndex])
      } else {
        addRecent(query)
        setExpanded(false)
      }
    } else if (e.key === 'Escape') {
      setQuery('')
      setExpanded(false)
    }
  }

  const handleSelect = (item: { id: string; name: string; section: string }) => {
    addRecent(query)
    setExpanded(false)
    setQuery('')
    // navigation is app-specific; omitted
  }

  const handleRecentSelect = (q: string) => {
    setQuery(q)
    setExpanded(true)
  }

  const handleBlur = () => {
    setTimeout(() => {
      setExpanded(false)
    }, 100)
  }

  return (
    <div className="relative">
      <SearchInput
        ref={ref}
        value={query}
        onChange={setQuery}
        onFocus={() => setExpanded(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        expanded={expanded}
        onClear={() => setQuery('')}
        isLoading={isLoading}
      />
      <SearchResultsPopover
        open={open}
        scope={scope}
        onScopeChange={setScope}
        sections={sections}
        query={query}
        activeIndex={activeIndex}
        onHoverIndex={setActiveIndex}
        onSelectItem={handleSelect}
        recentSearches={recent}
        onRecentSelect={handleRecentSelect}
      />
    </div>
  )
})

HeaderSearch.displayName = 'HeaderSearch'


```


---

## src\index.css

```css

@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';

@import './styles/globals.css';
@import './styles/design-system.css';
@import './styles/layout-vars.css';

@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&display=swap');

:root{
  --font-ui: "Red Hat Text", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
  --font-display: "Red Hat Display", var(--font-ui);

  /* type scale (tweak if needed) */
  --fs-h1: 28px; --fs-h2: 22px; --fs-h3: 18px; --fs-body: 15px; --fs-meta: 13px;
}

/* Defaults */
html { font-family: var(--font-ui); font-size: 15px; }
body { font-variant-numeric: normal; }

/* Headings / nav “brand voice” */
h1,h2,h3,.display { font-family: var(--font-display); font-weight: 600; letter-spacing: -0.005em; }
h1{ font-size: var(--fs-h1); } h2{ font-size: var(--fs-h2); } h3{ font-size: var(--fs-h3); }

/* UI text */
p,li,button,input,select,textarea,table { font-size: var(--fs-body); }
.meta, small { font-size: var(--fs-meta); opacity:.9; }

/* Import our comprehensive design system */

/* Ensure no default margins/padding for clean layout */
html, body, #root {
  margin: 0;
  padding: 0;
  height: 100%;
}

/* Set a fallback header height so content can offset correctly */
:root {
  --header-h: 56px;
  --chrome-h: clamp(40px, var(--header-h, 56px), 120px);
  --sidebar-w: 256px; /* expanded width */
  --sidebar-rail-w: 48px; /* collapsed rail width */
  --header-left: var(--sidebar-w); /* computed from sidebar width */
  --header-right: 0px; /* reserved for symmetry */
}

@media (max-width: 1024px) {
  :root {
    --header-left: 0px;
  }
}

/* Header should start to the right of the sidebar */
[data-app-header="true"] {
  position: sticky;
  top: 0;
  left: var(--header-left);
  width: calc(100% - var(--header-left));
}

body {
  @apply m-0 p-0;
  scroll-padding-top: var(--chrome-h);
}

#root {
  max-width: none !important;
  margin: 0 !important;
  padding: 0 !important;
}

/* If no overlay is actively locking scroll, ensure no ghost gutter on body */
body:not([data-scroll-locked]) {
  padding-right: 0 !important;
  margin-right: 0 !important;
}

main > *:first-child {
  margin-top: 0;
}

html { scrollbar-gutter: stable; }

#catalogHeader::before {
  /* Remove pseudo-element overlay that obscured the page */
  content: none !important;
}

@media (prefers-reduced-motion: reduce){
  #catalogHeader{ transition:none; }
}

```


---

## src\styles\globals.css

```css
:root{
  /* Brand gradient */
  --brand-from:#0B1220;
  --brand-via:#0E1B35;
  --brand-to:#0E2A5E;

  /* Signature accent ("memory stripe", focus, progress) */
  --brand-accent:#21D4D6;

  /* Text on dark */
  --text-on-dark:#E6EDF6;
  --text-subtle:#B9C2D0;

  /* Radius scale (non-default) */
  --radius-1:6px;   /* small buttons, inputs */
  --radius-2:12px;  /* chips, pills */
  --radius-3:18px;  /* big buttons, nav items */
  --radius-4:24px;  /* cards, search shell */
  --radius-pill:9999px;

  /* Motion */
  --dur-fast:120ms;
  --dur-base:200ms;
  --ease-snap:cubic-bezier(.22,1,.36,1);

  /* Header layout */
  --header-left:var(--sidebar-w);  /* set from sidebar width */

  /* Action colors */
  --button-primary:#0B5BD3;
  --button-primary-hover:#0A53C1;

  /* Availability badges */
  --badge-in-bg:#D6FBEF;
  --badge-in-text:#046C4E;
  --badge-out-bg:#FCE2E6;
  --badge-out-text:#8C1D2E;
  --badge-unknown-bg:#E8EEF7;
  --badge-unknown-text:#2B3A55;

  /* Memory stripe */
  --stripe-from:#22E0E0;
  --stripe-to:#12B6C5;
}

/* Reusable motif */
.memory-stripe{ height:2px; background:linear-gradient(90deg,var(--stripe-from),var(--stripe-to)); }

/* Numbers align perfectly in tables/badges */
.ui-numeric{ font-variant-numeric: tabular-nums; }

/* Lucide icons */
svg.lucide{ stroke-width:1.75; }
.icon-16{ width:16px; height:16px; }
.icon-18{ width:18px; height:18px; }
.icon-20{ width:20px; height:20px; }

/* Availability badges */
.badge{ display:inline-flex; align-items:center; gap:6px;
  height:24px; padding:0 10px; border-radius:var(--radius-pill);
  font-size:12.5px; line-height:1; font-weight:500;
}
.badge--in{ background:var(--badge-in-bg); color:var(--badge-in-text); }
.badge--out{ background:var(--badge-out-bg); color:var(--badge-out-text); }
.badge--unknown{ background:var(--badge-unknown-bg); color:var(--badge-unknown-text); }

```


---

## src\styles\layout-vars.css

```css
:root {
  --layout-rail: 72px;     /* nav rail width */
  --layout-header-h: 56px; /* fallback; JS already updates --header-h */
  --chrome-h: clamp(40px, var(--header-h, var(--layout-header-h,56px)), 120px);
  --header-left: var(--sidebar-w);

  --z-rail: 40;
  --z-header: 45;  /* header above chrome */
  --z-chrome: 20;  /* gradient below header */
}

```
