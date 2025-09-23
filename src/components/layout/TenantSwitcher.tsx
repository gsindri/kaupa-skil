import React from 'react'
import { Check, ChevronDown, Home, LogIn, Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useLocation } from 'react-router-dom'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/contexts/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { cn } from '@/lib/utils'

import { PopCard } from './PopCard'
import {
  navTextButtonClass,
  navTextButtonFocusRingClass,
  navTextButtonPillClass,
  navTextCaretClass,
} from './navStyles'

type Membership = {
  id: string
  base_role: string
  tenant: { id: string; name: string; kind: string } | null
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
  const location = useLocation()

  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const contentRef = React.useRef<HTMLDivElement | null>(null)
  const isSearchFocusedRef = React.useRef(false)
  const allowSearchBlurRef = React.useRef(false)

  const restoreSearchFocus = React.useCallback(() => {
    requestAnimationFrame(() => {
      if (open && isSearchFocusedRef.current && !allowSearchBlurRef.current) {
        inputRef.current?.focus()
      }
    })
  }, [open])

  const handleContentPointerDownCapture = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (inputRef.current?.contains(event.target as Node)) {
        allowSearchBlurRef.current = false
        return
      }

      allowSearchBlurRef.current = true
    },
    [],
  )

  const handleMenuItemPointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (
        event.pointerType === 'mouse' &&
        event.buttons === 0 &&
        isSearchFocusedRef.current
      ) {
        event.preventDefault()
        event.stopPropagation()
        inputRef.current?.focus()
      }
    },
    [],
  )

  React.useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus())
    } else {
      setQuery('')
      isSearchFocusedRef.current = false
      allowSearchBlurRef.current = false
    }
  }, [open])

  const { data: userMemberships = [] } = useQuery<Membership[]>({
    queryKey: ['user-memberships', user?.id],
    queryFn: async () => {
      if (!user?.id) return []

      const { data, error } = await supabase
        .from('memberships')
        .select(`id, base_role, tenant:tenants(id, name, kind)`)
        .eq('user_id', user.id)

      if (error) throw error
      
      // Transform the data to match our expected type
      // Supabase can return tenant data as either object or array depending on the query
      const transformedData = (data || []).map(item => ({
        ...item,
        tenant: Array.isArray(item.tenant) 
          ? (item.tenant.length > 0 ? item.tenant[0] : null)
          : (item.tenant || null)
      })) as Membership[]
      
      // Debug logging
      console.log('TenantSwitcher: userMemberships raw data:', data)
      console.log('TenantSwitcher: userMemberships transformed:', transformedData)
      
      return transformedData
    },
    enabled: !!user?.id,
  })

  const currentTenant = userMemberships.find(
    (m) => m.tenant && m.tenant.id === profile?.tenant_id,
  )?.tenant

  // Display "Personal workspace" for personal tenants, otherwise show the tenant name
  const displayName = currentTenant 
    ? currentTenant.kind === 'personal' 
      ? 'Personal workspace (Private)' 
      : currentTenant.name
    : 'Personal workspace (Private)'
  
  const normalizedQuery = query.trim().toLowerCase()

  const matchingTenants = React.useMemo(() => {
    // Always show all valid memberships when no search query
    if (!normalizedQuery) {
      return userMemberships.filter((membership) => membership.tenant !== null)
    }
    
    // Filter based on search query
    return userMemberships.filter((membership) => {
      if (!membership.tenant) return false
      
      const name = membership.tenant.name?.toLowerCase() ?? ''
      const displayLabel = membership.tenant.kind === 'personal' ? 'personal workspace' : name
      return displayLabel.includes(normalizedQuery)
    })
  }, [normalizedQuery, userMemberships])

  const hasResults = matchingTenants.length > 0

  const handleTenantSwitch = async (tenantId: string) => {
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
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-label="Switch workspace"
          className={cn(navTextButtonClass, 'text-left')}
        >
          <span className={navTextButtonPillClass} aria-hidden="true" />
          <span className="min-w-0 truncate text-left">{displayName}</span>
          <ChevronDown className={navTextCaretClass} aria-hidden="true" />
          <span className={navTextButtonFocusRingClass} aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>

      <PopCard
        ref={contentRef}
        className="w-[320px] space-y-2"
        sideOffset={12}
        align="start"
        onPointerDownCapture={handleContentPointerDownCapture}
      >
        <div className="px-2 pb-1">
          <input
            ref={inputRef}
            placeholder="Search workspaces..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => {
              isSearchFocusedRef.current = true
              allowSearchBlurRef.current = false
            }}
            onBlur={(event) => {
              const nextFocused = event.relatedTarget as HTMLElement | null

              if (
                open &&
                !allowSearchBlurRef.current &&
                contentRef.current &&
                nextFocused === contentRef.current
              ) {
                restoreSearchFocus()
                return
              }

              isSearchFocusedRef.current = false
              allowSearchBlurRef.current = false
            }}
            className={cn(
              'h-12 w-full rounded-xl border border-[color:var(--surface-ring)] px-3 text-[14px] text-[color:var(--text)] placeholder:text-[color:var(--text-muted)]',
              'transition-colors focus:outline-none focus:border-transparent focus:ring-2 focus:ring-[color:var(--brand-accent)]',
              'bg-transparent hover:bg-[color:var(--surface-pop-2)]/35 focus:bg-[color:var(--surface-pop-2)]/50',
            )}
            type="search"
          />
        </div>

        <div className="tw-label normal-case">Workspaces</div>
        <div className="flex flex-col gap-1 px-1">
          {matchingTenants.map((membership) => {
            const tenant = membership.tenant
            if (!tenant) return null
            const isCurrent = tenant.id === profile?.tenant_id
            const isPersonal = tenant.kind === 'personal'
            return (
              <DropdownMenuItem
                key={membership.id}
                onPointerMove={handleMenuItemPointerMove}
                onSelect={async () => {
                  await handleTenantSwitch(tenant.id)
                  setOpen(false)
                }}
                asChild
              >
                <button
                  type="button"
                  aria-selected={isCurrent}
                  className="tw-row text-left"
                >
                  {isPersonal ? (
                    <Home className="size-4 text-[color:var(--text-muted)]" />
                  ) : (
                    <Avatar className="h-6 w-6 text-[12px] text-[color:var(--text-muted)]">
                      <AvatarFallback>{getInitials(tenant.name)}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="truncate">
                      {isPersonal ? 'Personal workspace (Private)' : tenant.name}
                    </span>
                    <span className="pop-accent px-2 py-0.5 capitalize">
                      {membership.base_role}
                    </span>
                  </div>
                  <Check
                    className={cn(
                      'size-3.5 self-baseline text-[color:var(--brand-accent)] transition-opacity',
                      isCurrent ? 'opacity-70' : 'opacity-0',
                    )}
                  />
                </button>
              </DropdownMenuItem>
            )
          })}

          {!hasResults && (
            <div className="px-3 py-3 text-sm text-[color:var(--text-muted)]">
              No workspaces found.
            </div>
          )}
        </div>

        <div className="pop-div my-2" />

        <div className="tw-label normal-case">Actions</div>
        <div className="flex flex-col gap-1 px-1">
          <DropdownMenuItem
            onPointerMove={handleMenuItemPointerMove}
            onSelect={() => {
              const targetPath = '/settings/organization/create'
              const currentPath = `${location.pathname}${location.search}${location.hash}`
              const state =
                currentPath === targetPath
                  ? undefined
                  : { from: currentPath, allowExisting: true }
              navigate(targetPath, { state })
              setOpen(false)
            }}
            asChild
          >
            <button type="button" className="tw-row tw-row-plain text-left">
              <Plus className="size-4 text-[color:var(--text-muted)]" />
              <span className="truncate">Create workspace</span>
              <span />
            </button>
          </DropdownMenuItem>
          <DropdownMenuItem
            onPointerMove={handleMenuItemPointerMove}
            onSelect={() => {
              const targetPath = '/settings/organization/join'
              const currentPath = `${location.pathname}${location.search}${location.hash}`
              navigate(targetPath, {
                state: currentPath === targetPath ? undefined : { from: currentPath }
              })
              setOpen(false)
            }}
            asChild
          >
            <button type="button" className="tw-row tw-row-plain text-left">
              <LogIn className="size-4 text-[color:var(--text-muted)]" />
              <span className="truncate">Join workspace</span>
              <span />
            </button>
          </DropdownMenuItem>
        </div>
      </PopCard>
    </DropdownMenu>
  )
}
