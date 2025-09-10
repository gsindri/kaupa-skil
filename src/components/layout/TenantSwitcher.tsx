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
          className="flex w-52 items-center justify-between px-2 h-10 rounded-xl bg-white/6 hover:bg-white/10 ring-1 ring-white/10 text-slate-100 focus-visible:ring-2 focus-visible:ring-cyan-400/70"
        >
          <span className="truncate display font-semibold" title={displayName}>
            {displayName}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0" />
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

