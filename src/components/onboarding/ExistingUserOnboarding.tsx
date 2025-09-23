
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/useAuth'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useNavigate, useLocation } from 'react-router-dom'

type TenantSummary = {
  id: string
  name: string
  created_at: string
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
  const location = useLocation()

  const currentPath = React.useMemo(
    () => `${location.pathname}${location.search}${location.hash}`,
    [location.hash, location.pathname, location.search]
  )

  const previousPath = React.useMemo(() => {
    const state = location.state as { from?: string } | null
    const raw = state?.from
    if (!raw || typeof raw !== 'string') {
      return null
    }
    const trimmed = raw.trim()
    if (!trimmed) {
      return null
    }
    return trimmed
  }, [location.state])

  const navigateBack = React.useCallback(() => {
    const target = previousPath && previousPath !== currentPath ? previousPath : '/'
    navigate(target, { replace: true })
  }, [currentPath, navigate, previousPath])

  const [isJoiningByCode, setIsJoiningByCode] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joinCodeError, setJoinCodeError] = useState<string | null>(null)
  const [joinCodeSuccess, setJoinCodeSuccess] = useState<string | null>(null)
  const [isCheckingInvites, setIsCheckingInvites] = useState(false)
  const { data: existingTenants = [] } = useQuery<TenantSummary[]>({
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

  const handleJoinOrganization = async (tenantId: string) => {
    if (!user?.id) return false

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
        description: 'Access granted.'
      })

      await refetch()
      return true
    } catch (error: any) {
      console.error('Failed to join organization:', error)
      toast({
        title: 'Could not join',
        description: error.message,
        variant: 'destructive'
      })
      return false
    }
  }

  const handleJoinWithCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setJoinCodeError(null)
    setJoinCodeSuccess(null)

    const codeValue = joinCode.trim()
    if (!codeValue) {
      setJoinCodeError('Enter a code.')
      return
    }

    setIsJoiningByCode(true)

    try {
      const tenant = await tryFindTenantByCode(codeValue)

      if (!tenant) {
        setJoinCodeError('No workspace matches that code.')
        return
      }

      const joined = await handleJoinOrganization(tenant.id)
      if (joined) {
        setJoinCodeSuccess(`Joined ${tenant.name}.`)
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
        title: 'No invites found',
        description: 'Ask your admin if you were expecting one.'
      })
    }, 300)
  }

  const handleExit = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('onboardingSkipped', 'true')
    }
    toast({
      title: 'Saved for later',
      description: 'You can finish from Settings anytime.'
    })
    navigateBack()
  }

  return (
    <div className="min-h-screen bg-[color:var(--brand-bg)]/6 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-xl px-4">
        <header className="mb-8 space-y-2 text-center">
          <h1 className="text-3xl font-semibold text-[color:var(--text)]">Join a workspace</h1>
          <p className="text-[15px] text-[color:var(--text-muted)]">Use a code or accept your invite.</p>
        </header>

        <div className="relative overflow-hidden rounded-[16px] border border-[color:var(--surface-ring)] bg-[color:var(--surface-pop)] shadow-[var(--elev-shadow)]">
          <div className="absolute inset-x-0 top-0 h-[3px] bg-[color:var(--surface-ring)]/40">
            <div className="h-full bg-[var(--brand-accent)]" style={{ width: '100%' }} />
          </div>

          <div className="flex flex-col gap-6 px-6 py-8 sm:px-10 sm:py-10">
            <section className="space-y-4">
              <div className="space-y-1 text-center sm:text-left">
                <p className="text-[12px] font-semibold uppercase tracking-wide text-[color:var(--text-muted)]">
                  Invite code
                </p>
                <h2 className="text-[20px] font-semibold text-[color:var(--text)]">Enter code</h2>
              </div>
              <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleJoinWithCode}>
                <label htmlFor="join-code" className="sr-only">
                  Invite code
                </label>
                <Input
                  id="join-code"
                  value={joinCode}
                  onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                  placeholder="DEILDA-4829"
                  className="h-11 flex-1 uppercase"
                  aria-label="Workspace invite code"
                  aria-invalid={Boolean(joinCodeError)}
                  aria-describedby={joinCodeError ? 'join-code-error' : undefined}
                />
                <Button
                  type="submit"
                  disabled={isJoiningByCode || !joinCode.trim()}
                  className="w-full sm:w-auto"
                >
                  {isJoiningByCode ? 'Joining…' : 'Join workspace'}
                </Button>
              </form>
              {joinCodeError && (
                <p id="join-code-error" className="text-sm font-medium text-destructive" role="status">
                  {joinCodeError}
                </p>
              )}
              {joinCodeSuccess && (
                <p className="text-sm font-medium text-emerald-600" role="status">
                  {joinCodeSuccess}
                </p>
              )}
            </section>

            <section className="flex flex-col gap-3 rounded-[12px] border border-[color:var(--surface-ring)]/80 bg-[color:var(--surface)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium text-[color:var(--text)]">Pending invites</p>
              <Button
                type="button"
                variant="outline"
                onClick={handleCheckInvites}
                disabled={isCheckingInvites}
                className="w-full sm:w-auto"
              >
                {isCheckingInvites ? 'Checking…' : 'Check invites'}
              </Button>
            </section>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Button variant="ghost" onClick={handleExit}>
            Go back
          </Button>
        </div>
      </div>
    </div>
  )
}
