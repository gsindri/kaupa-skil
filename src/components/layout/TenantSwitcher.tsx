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
      <PopoverContent className="w-[270px] p-2">
        <Command>
          <CommandInput
            placeholder="Search workspaces..."
            className="h-9"
          />
          <CommandList>
            <CommandEmpty>No workspaces found.</CommandEmpty>
            <CommandGroup
              heading="Workspaces"
              className="px-0 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide"
            >
              <CommandItem
                value="personal"
                onSelect={() => {
                  handleTenantSwitch(null)
                  setOpen(false)
                }}
                className="group grid grid-cols-[24px,1fr,auto,16px] items-center gap-2 rounded-lg px-2 h-9 text-sm text-foreground/80 hover:bg-muted hover:text-foreground data-[selected=true]:bg-[hsl(var(--ws-item-bg-selected))] data-[selected=true]:text-[hsl(var(--ws-item-fg-selected))]"
              >
                <House className="h-5 w-5" />
                <span className="truncate" title="Personal workspace">
                  Personal workspace
                </span>
                <span className="justify-self-end" />
                <Check
                  className={cn(
                    'h-4 w-4 justify-self-end opacity-0 group-data-[selected=true]:opacity-100',
                    { 'opacity-100': !profile?.tenant_id }
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
                    className="group grid grid-cols-[24px,1fr,auto,16px] items-center gap-2 rounded-lg px-2 h-9 text-sm text-foreground/80 hover:bg-muted hover:text-foreground data-[selected=true]:bg-[hsl(var(--ws-item-bg-selected))] data-[selected=true]:text-[hsl(var(--ws-item-fg-selected))]"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarFallback>{getInitials(tenant.name)}</AvatarFallback>
                    </Avatar>
                    <span className="truncate text-left" title={tenant.name}>
                      {tenant.name}
                    </span>
                    <Badge
                      variant={roleBadgeVariant(membership.base_role)}
                      className="justify-self-end whitespace-nowrap capitalize"
                    >
                      {membership.base_role}
                    </Badge>
                    <Check
                      className={cn(
                        'h-4 w-4 justify-self-end opacity-0 group-data-[selected=true]:opacity-100',
                        { 'opacity-100': isCurrent }
                      )}
                    />
                  </CommandItem>
                )
              })}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup
              heading="Actions"
              className="px-0 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide"
            >
              <CommandItem
                onSelect={() => {
                  navigate('/settings/organization/create')
                  setOpen(false)
                }}
                className="group grid grid-cols-[24px,1fr] items-center gap-2 rounded-lg px-2 h-9 text-sm text-foreground/80 hover:bg-muted hover:text-foreground"
              >
                <Plus className="h-5 w-5" />
                <span>Create workspace</span>
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  navigate('/settings/organization/join')
                  setOpen(false)
                }}
                className="group grid grid-cols-[24px,1fr] items-center gap-2 rounded-lg px-2 h-9 text-sm text-foreground/80 hover:bg-muted hover:text-foreground"
              >
                <LogIn className="h-5 w-5" />
                <span>Join workspace</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

