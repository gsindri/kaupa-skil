import React from 'react'
import {
  Check,
  ChevronDown,
  House,
  LogIn,
  Plus,
  Star,
  StarOff
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
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

  // Local state for popover and pinned orgs
  const [open, setOpen] = React.useState(false)
  const [pinned, setPinned] = React.useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('pinned-tenants') || '[]')
    } catch {
      return []
    }
  })

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

  const sortedMemberships = React.useMemo(() => {
    const items = [...userMemberships]
    items.sort((a, b) => {
      const aPinned = a.tenant && pinned.includes(a.tenant.id)
      const bPinned = b.tenant && pinned.includes(b.tenant.id)
      if (aPinned && !bPinned) return -1
      if (!aPinned && bPinned) return 1
      return 0
    })
    return items
  }, [userMemberships, pinned])

  const togglePin = (tenantId: string) => {
    setPinned((prev) => {
      const next = prev.includes(tenantId)
        ? prev.filter((id) => id !== tenantId)
        : [...prev, tenantId]
      localStorage.setItem('pinned-tenants', JSON.stringify(next))
      return next
    })
  }

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

  const roleBadgeVariant = (role: string) => {
    switch (role.toLowerCase()) {
      case 'owner':
        return 'default'
      case 'admin':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          className="flex w-52 items-center justify-between px-2"
        >
          <span className="truncate" title={displayName}>
            {displayName}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0">
        <Command>
          <CommandInput placeholder="Search organizations..." />
          <CommandList>
            <CommandEmpty>No organizations found.</CommandEmpty>
            <CommandGroup heading="Workspaces" className="px-1 py-2">
              <CommandItem
                value="personal"
                onSelect={() => {
                  handleTenantSwitch(null)
                  setOpen(false)
                }}
                className="group flex items-center gap-2 px-2 py-2"
              >
                <House className="h-4 w-4" />
                <span className="flex-1 truncate" title="Personal workspace">
                  Personal workspace
                </span>
                {!profile?.tenant_id && (
                  <Check className="h-4 w-4" />
                )}
              </CommandItem>
              {sortedMemberships.map((membership) => {
                const tenant = membership.tenant
                if (!tenant) return null
                const pinnedTenant = pinned.includes(tenant.id)
                return (
                  <CommandItem
                    key={membership.id}
                    value={tenant.name}
                    onSelect={() => {
                      handleTenantSwitch(tenant.id)
                      setOpen(false)
                    }}
                    className="group flex items-center gap-2 px-2 py-2"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarFallback>
                        {getInitials(tenant.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className="flex-1 truncate text-left"
                      title={tenant.name}
                    >
                      {tenant.name}
                    </span>
                    <Badge
                      variant={roleBadgeVariant(membership.base_role)}
                      className="capitalize"
                    >
                      {membership.base_role}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation()
                        togglePin(tenant.id)
                      }}
                    >
                      {pinnedTenant ? (
                        <Star className="h-4 w-4 fill-current" />
                      ) : (
                        <StarOff className="h-4 w-4" />
                      )}
                    </Button>
                    {tenant.id === profile?.tenant_id && (
                      <Check className="ml-1 h-4 w-4" />
                    )}
                  </CommandItem>
                )
              })}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Actions" className="px-1 py-2">
              <CommandItem
                onSelect={() => {
                  navigate('/settings/organization/create')
                  setOpen(false)
                }}
                className="flex items-center gap-2 px-2 py-2"
              >
                <Plus className="h-4 w-4" />
                Create organization
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  navigate('/settings/organization/join')
                  setOpen(false)
                }}
                className="flex items-center gap-2 px-2 py-2"
              >
                <LogIn className="h-4 w-4" />
                Join organization
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

