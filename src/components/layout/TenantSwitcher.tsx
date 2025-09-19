import React from 'react'
import { Check, ChevronDown, Home, LogIn, Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

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
  const [query, setQuery] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement | null>(null)

  React.useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus())
    } else {
      setQuery('')
    }
  }, [open])

  const { data: userMemberships = [] } = useQuery<Membership[]>({
    queryKey: ['user-memberships', user?.id],
    queryFn: async () => {
      if (!user?.id) return []

      const { data, error } = await supabase
        .from('memberships')
        .select(`id, base_role, tenant:tenants(id, name)`)
        .eq('user_id', user.id)

      if (error) throw error
      return data as Membership[]
    },
    enabled: !!user?.id,
  })

  const currentTenant = userMemberships.find(
    (m) => m.tenant && m.tenant.id === profile?.tenant_id,
  )?.tenant

  const displayName = currentTenant?.name || 'Personal workspace'
  const normalizedQuery = query.trim().toLowerCase()

  const matchingTenants = React.useMemo(() => {
    if (!normalizedQuery) {
      return userMemberships.filter((membership) => membership.tenant)
    }
    return userMemberships.filter((membership) => {
      const name = membership.tenant?.name?.toLowerCase() ?? ''
      return name.includes(normalizedQuery)
    })
  }, [normalizedQuery, userMemberships])

  const showPersonal =
    normalizedQuery.length === 0 ||
    'personal workspace'.includes(normalizedQuery)

  const hasResults = showPersonal || matchingTenants.length > 0

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
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-label="Switch workspace"
          className={cn(navTextButtonClass, 'w-56 justify-between text-left')}
        >
          <span className={navTextButtonPillClass} aria-hidden="true" />
          <span className="truncate text-left">{displayName}</span>
          <ChevronDown className={navTextCaretClass} aria-hidden="true" />
          <span className={navTextButtonFocusRingClass} aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>

      <PopCard className="w-[320px] space-y-2" sideOffset={12} align="start">
        <div className="px-2 pb-1">
          <input
            ref={inputRef}
            placeholder="Search workspaces..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-9 w-full rounded-lg border border-[color:var(--surface-ring)] bg-transparent px-3 text-[14px] text-[color:var(--text)] placeholder:text-[color:var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-accent)]"
            type="search"
          />
        </div>

        <div className="tw-label">WORKSPACES</div>
        <div className="flex flex-col gap-1 px-1">
          {showPersonal && (
            <DropdownMenuItem
              onSelect={async () => {
                await handleTenantSwitch(null)
                setOpen(false)
              }}
              asChild
            >
              <button
                type="button"
                aria-selected={!profile?.tenant_id}
                className="tw-row text-left"
              >
                <Home className="size-4 text-[color:var(--text-muted)]" />
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="truncate">Personal workspace</span>
                </div>
                <Check
                  className={cn(
                    'size-4 text-[color:var(--brand-accent)] transition-opacity',
                    !profile?.tenant_id ? 'opacity-100' : 'opacity-0',
                  )}
                />
              </button>
            </DropdownMenuItem>
          )}

          {matchingTenants.map((membership) => {
            const tenant = membership.tenant
            if (!tenant) return null
            const isCurrent = tenant.id === profile?.tenant_id
            return (
              <DropdownMenuItem
                key={membership.id}
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
                  <Avatar className="h-6 w-6 text-[12px] text-[color:var(--text-muted)]">
                    <AvatarFallback>{getInitials(tenant.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="truncate">{tenant.name}</span>
                    <span className="pop-accent px-2 py-0.5 capitalize">
                      {membership.base_role}
                    </span>
                  </div>
                  <Check
                    className={cn(
                      'size-4 text-[color:var(--brand-accent)] transition-opacity',
                      isCurrent ? 'opacity-100' : 'opacity-0',
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

        <div className="tw-label">ACTIONS</div>
        <div className="flex flex-col gap-1 px-1">
          <DropdownMenuItem
            onSelect={() => {
              navigate('/settings/organization/create')
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
            onSelect={() => {
              navigate('/settings/organization/join')
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
