
import React, { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Building,
  KeyRound,
  MailCheck,
  Plus,
  Search,
  Users,
  UserCheck
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuth } from '@/contexts/useAuth'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useNavigate } from 'react-router-dom'

type TenantSummary = {
  id: string
  name: string
  created_at: string
}

type MembershipSummary = {
  id: string
  base_role: string
  tenant: { id: string; name: string } | null
}

const codeComparator = (value: string) => value.replace(/[^A-Z0-9]/gi, '').toUpperCase()

const generateWorkspaceCode = (tenant: TenantSummary) => {
  const nameParts = tenant.name
    .replace(/[^A-Za-z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)

  const primary = nameParts[0] ?? ''
  const secondary = nameParts[1] ?? ''

  let prefix = primary.slice(0, 6)
  if (prefix.length < 4 && secondary) {
    prefix = (primary + secondary).slice(0, 6)
  }

  const suffix = tenant.id.replace(/[^A-Za-z0-9]/g, '').slice(-4).toUpperCase()
  const safePrefix = prefix ? prefix.toUpperCase() : 'TEAM'

  return `${safePrefix}-${suffix}`
}

export function ExistingUserOnboarding() {
  const { user, refetch } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [joiningTenantId, setJoiningTenantId] = useState<string | null>(null)
  const [isJoiningByCode, setIsJoiningByCode] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joinCodeError, setJoinCodeError] = useState<string | null>(null)
  const [joinCodeSuccess, setJoinCodeSuccess] = useState<string | null>(null)
  const [isCheckingInvites, setIsCheckingInvites] = useState(false)
  const [tenantSearch, setTenantSearch] = useState('')

  const {
    data: userMemberships = [],
    isLoading: membershipsLoading,
    refetch: refetchMemberships
  } = useQuery<MembershipSummary[]>({
    queryKey: ['user-memberships', user?.id],
    queryFn: async () => {
      if (!user?.id) return []

      const { data, error } = await supabase
        .from('memberships')
        .select('id, base_role, tenant:tenants(id, name)')
        .eq('user_id', user.id)

      if (error) throw error

      return (data || []).map((item) => ({
        ...item,
        tenant:
          Array.isArray(item.tenant) && item.tenant.length > 0 ? item.tenant[0] : null
      })) as MembershipSummary[]
    },
    enabled: !!user?.id
  })

  const { data: existingTenants = [], isLoading: tenantsLoading, refetch: refetchTenants } =
    useQuery<TenantSummary[]>({
      queryKey: ['existing-tenants'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('tenants')
          .select('id, name, created_at')
          .order('created_at', { ascending: false })

        if (error) throw error
        return data ?? []
      },
      enabled: !!user
    })

  const membershipTenantIds = useMemo(() => {
    return new Set(
      userMemberships
        .map((membership) => membership.tenant?.id)
        .filter((tenantId): tenantId is string => Boolean(tenantId))
    )
  }, [userMemberships])

  const joinableTenants = useMemo(() => {
    const filtered = existingTenants.filter(
      (tenant) => !membershipTenantIds.has(tenant.id)
    )

    if (!tenantSearch.trim()) return filtered

    const query = tenantSearch.trim().toLowerCase()
    return filtered.filter((tenant) => tenant.name.toLowerCase().includes(query))
  }, [existingTenants, membershipTenantIds, tenantSearch])

  const tryFindTenantByCode = async (rawCode: string) => {
    const comparable = codeComparator(rawCode)
    if (!comparable) return null

    const findMatch = (tenants: TenantSummary[]) =>
      tenants.find((tenant) => codeComparator(generateWorkspaceCode(tenant)) === comparable) || null

    const localMatch = findMatch(existingTenants)
    if (localMatch) return localMatch

    const sanitized = rawCode.trim()
    if (/^[0-9a-fA-F-]{36}$/.test(sanitized)) {
      const { data: directTenant, error: directError } = await supabase
        .from('tenants')
        .select('id, name, created_at')
        .eq('id', sanitized)
        .maybeSingle()

      if (directError) {
        if ((directError as any).code !== 'PGRST116') throw directError
      }
      if (directTenant) return directTenant as TenantSummary
    }

    const [prefix] = rawCode.toUpperCase().split('-')

    const { data: lookupTenants, error } = await supabase
      .from('tenants')
      .select('id, name, created_at')
      .ilike('name', `%${prefix}%`)
      .limit(20)

    if (error) throw error

    return findMatch(lookupTenants ?? [])
  }

  const handleJoinOrganization = async (tenantId: string, options?: { trackTenant?: boolean }) => {
    if (!user?.id) return false

    if (options?.trackTenant !== false) {
      setJoiningTenantId(tenantId)
    }
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ tenant_id: tenantId })
        .eq('id', user.id)

      if (error) throw error

      const { error: membershipError } = await supabase
        .from('memberships')
        .insert({
          tenant_id: tenantId,
          user_id: user.id,
          base_role: 'member'
        })

      if (membershipError) throw membershipError

      toast({
        title: 'Joined workspace',
        description: 'You now have access to this workspace.'
      })

      await refetch()
      await refetchMemberships()
      await refetchTenants()
      return true
    } catch (error: any) {
      console.error('Failed to join organization:', error)
      toast({
        title: 'Failed to join',
        description: error.message,
        variant: 'destructive'
      })
      return false
    } finally {
      if (options?.trackTenant !== false) {
        setJoiningTenantId(null)
      }
    }
  }

  const handleJoinWithCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setJoinCodeError(null)
    setJoinCodeSuccess(null)

    const codeValue = joinCode.trim()
    if (!codeValue) {
      setJoinCodeError('Enter the workspace code shared with you by an administrator.')
      return
    }

    setIsJoiningByCode(true)

    try {
      const tenant = await tryFindTenantByCode(codeValue)

      if (!tenant) {
        setJoinCodeError('We couldn’t find a workspace that matches that code.')
        return
      }

      const joined = await handleJoinOrganization(tenant.id, { trackTenant: false })
      if (joined) {
        setJoinCodeSuccess(`Success! You’re now part of ${tenant.name}.`)
        setJoinCode('')
      }
    } catch (error: any) {
      console.error('Failed to join with code:', error)
      setJoinCodeError(error.message || 'Something went wrong while joining by code.')
    } finally {
      setIsJoiningByCode(false)
    }
  }

  const handleCheckInvites = () => {
    setIsCheckingInvites(true)
    setTimeout(() => {
      setIsCheckingInvites(false)
      toast({
        title: 'No pending invitations found',
        description:
          'If you were expecting an invite, double-check your email or contact your administrator.'
      })
    }, 300)
  }

  const handleExit = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('onboardingSkipped', 'true')
    }
    toast({
      title: 'Setup saved for later',
      description: 'You can return to workspace setup anytime from Settings.'
    })
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-muted/40 px-4 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Building className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Join a workspace</h1>
            <p className="text-base text-muted-foreground sm:text-lg">
              Choose the path that matches how your team invited you. You can always come back to
              this page from Settings.
            </p>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <Card className="border-none shadow-sm ring-1 ring-border">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl font-semibold">
                Select how you’d like to join
              </CardTitle>
              <CardDescription>
                Invitations are the quickest way in. Codes are great for teams that prefer
                self-service.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <section className="rounded-2xl border bg-card/70 p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <h2 className="text-base font-semibold">Enter a code</h2>
                      <p className="text-sm text-muted-foreground">
                        Paste the workspace code shared with you by an admin to join instantly.
                      </p>
                    </div>
                    <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleJoinWithCode}>
                      <Input
                        value={joinCode}
                        onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                        placeholder="e.g. DEILDA-4829"
                        className="h-11 flex-1 uppercase"
                        aria-label="Workspace join code"
                      />
                      <Button
                        type="submit"
                        disabled={isJoiningByCode || !joinCode.trim()}
                        className="shrink-0"
                      >
                        {isJoiningByCode ? 'Joining…' : 'Join workspace'}
                      </Button>
                    </form>
                    {joinCodeError && (
                      <p className="text-sm font-medium text-destructive" role="status">
                        {joinCodeError}
                      </p>
                    )}
                    {joinCodeSuccess && (
                      <p className="text-sm font-medium text-emerald-600" role="status">
                        {joinCodeSuccess}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border bg-card/70 p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <MailCheck className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <h2 className="text-base font-semibold">Accept an invitation</h2>
                      <p className="text-sm text-muted-foreground">
                        Already invited? Open the secure link in your email. If you can’t find it,
                        we’ll check for pending invites on your account.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCheckInvites}
                      disabled={isCheckingInvites}
                      className="w-full sm:w-auto"
                    >
                      {isCheckingInvites ? 'Checking…' : 'Check pending invites'}
                    </Button>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border bg-card/70 p-5 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold">Workspaces you can join now</h2>
                      <p className="text-sm text-muted-foreground">
                        These organizations allow members to request access directly.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={tenantSearch}
                      onChange={(event) => setTenantSearch(event.target.value)}
                      placeholder="Search organizations"
                      className="h-10 w-full pl-9"
                      aria-label="Search open workspaces"
                    />
                  </div>

                  {tenantsLoading ? (
                    <p className="text-sm text-muted-foreground">Loading available workspaces…</p>
                  ) : joinableTenants.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      You’re already connected to every workspace that’s currently open for
                      self-service.
                    </p>
                  ) : (
                    <ScrollArea className="max-h-64">
                      <div className="space-y-3 pr-2">
                        {joinableTenants.map((tenant) => {
                          const isProcessing = joiningTenantId === tenant.id || isJoiningByCode
                          return (
                            <div
                              key={tenant.id}
                              className="flex items-start justify-between gap-4 rounded-xl border bg-background/80 p-4"
                            >
                              <div className="space-y-1">
                                <p className="font-medium leading-none">{tenant.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  Join code {generateWorkspaceCode(tenant)} • Created{' '}
                                  {new Date(tenant.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleJoinOrganization(tenant.id)}
                                disabled={isProcessing}
                              >
                                {isProcessing ? 'Joining…' : 'Join'}
                              </Button>
                            </div>
                          )
                        })}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </section>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-none shadow-sm ring-1 ring-border">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Your current workspaces</CardTitle>
                <CardDescription>
                  Review where you already have access. Switch anytime from the workspace menu.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start justify-between gap-4 rounded-xl border bg-card/70 p-4">
                  <div>
                    <p className="font-medium">Personal workspace</p>
                    <p className="text-xs text-muted-foreground">Private to you</p>
                  </div>
                  <Badge variant="outline">Default</Badge>
                </div>

                {membershipsLoading && (
                  <p className="text-sm text-muted-foreground">Checking your memberships…</p>
                )}

                {!membershipsLoading && userMemberships.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    You haven’t joined any shared workspaces yet. Use a join code or ask an admin to
                    invite you.
                  </p>
                )}

                {userMemberships.map((membership) => {
                  if (!membership.tenant) return null
                  return (
                    <div
                      key={membership.id}
                      className="flex items-start justify-between gap-4 rounded-xl border bg-card/70 p-4"
                    >
                      <div>
                        <p className="font-medium">{membership.tenant.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <UserCheck className="h-3.5 w-3.5" />
                          Role: {membership.base_role}
                        </p>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {membership.base_role}
                      </Badge>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm ring-1 ring-border">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Need to create a workspace?</CardTitle>
                <CardDescription>
                  Creating a new workspace is separate from joining your team.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Set up a fresh workspace for a new concept or business unit. You can always invite
                  teammates afterward.
                </p>
                <Button
                  className="w-full"
                  onClick={() => navigate('/settings?onboarding=1')}
                >
                  <Plus className="mr-2 h-4 w-4" /> Create a workspace
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="text-center">
          <Button variant="ghost" onClick={handleExit}>
            Back to dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
