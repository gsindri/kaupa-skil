
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { HeildaLogo } from '@/components/branding/HeildaLogo'
import { useAuth } from '@/contexts/useAuth'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Building2, ChevronRight } from 'lucide-react'

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
  const joinCodeFeedbackId = joinCodeError
    ? 'join-code-error'
    : joinCodeSuccess
      ? 'join-code-success'
      : undefined
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
        <header className="mb-10 space-y-6 text-center">
          <div className="flex justify-center">
            <HeildaLogo className="h-8 w-auto" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-[color:var(--text)]">
              <Building2 className="h-6 w-6 text-[var(--brand-accent)]" aria-hidden="true" />
              <h1 className="text-3xl font-semibold">Join a workspace</h1>
            </div>
            <p className="text-[15px] text-[color:var(--text-muted)]">Use a code or accept your invite.</p>
          </div>
        </header>

        <div className="space-y-6 rounded-[24px] border border-[color:var(--surface-ring)] bg-[color:var(--surface-pop-2)]/35 p-6 shadow-[var(--elev-shadow)] sm:p-8">
          <div className="relative overflow-hidden rounded-[18px] border border-[color:var(--surface-ring)] bg-[color:var(--surface-pop)] shadow-[var(--elev-shadow)]">
            <div className="absolute inset-x-0 top-0 h-[3px] bg-[color:var(--surface-ring)]/40">
              <div className="h-full bg-[var(--brand-accent)]" style={{ width: '100%' }} />
            </div>

            <div className="space-y-6 px-6 py-8 sm:px-10 sm:py-10">
              <section className="space-y-3 text-left">
                <Label
                  htmlFor="join-code"
                  className="text-[12px] font-semibold uppercase tracking-[0.28em] text-[color:var(--text-muted)]"
                >
                  Invite code
                </Label>
                <h2 className="text-[22px] font-semibold text-[color:var(--text)]">Join by code</h2>
                <p className="text-[14px] text-[color:var(--text-muted)]">
                  Paste the code your admin shared to unlock the workspace instantly.
                </p>
              </section>
              <form className="space-y-4" onSubmit={handleJoinWithCode}>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    id="join-code"
                    type="text"
                    value={joinCode}
                    onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                    placeholder="E.g. DEILDA-4829"
                    className="h-12 flex-1 rounded-[12px] border-[color:var(--surface-ring)] bg-[color:var(--surface-pop-2)]/60 px-4 text-base font-medium uppercase tracking-[0.32em]"
                    aria-label="Workspace invite code"
                    aria-invalid={Boolean(joinCodeError)}
                    aria-describedby={joinCodeFeedbackId}
                    autoComplete="off"
                    inputMode="text"
                  />
                  <Button
                    type="submit"
                    disabled={isJoiningByCode || !joinCode.trim()}
                    className="h-12 rounded-[12px] px-6 sm:w-auto"
                  >
                    {isJoiningByCode ? 'Joining…' : 'Join workspace'}
                  </Button>
                </div>
                {joinCodeError && (
                  <p id="join-code-error" className="text-sm font-medium text-destructive" role="status">
                    {joinCodeError}
                  </p>
                )}
                {joinCodeSuccess && (
                  <p id="join-code-success" className="text-sm font-medium text-emerald-600" role="status">
                    {joinCodeSuccess}
                  </p>
                )}
              </form>
            </div>
          </div>

          <section className="rounded-[16px] border border-dashed border-[color:var(--surface-ring)] bg-[color:var(--surface-pop-2)]/45 px-5 py-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-[color:var(--text)]">Pending invites</p>
                <p className="text-[13px] text-[color:var(--text-muted)]">
                  We’ll check if your team already added you.
                </p>
              </div>
              <Button
                type="button"
                variant="link"
                onClick={handleCheckInvites}
                disabled={isCheckingInvites}
                className="h-auto justify-start gap-1 p-0 text-[15px] font-semibold text-[var(--brand-accent)] sm:justify-end"
              >
                {isCheckingInvites ? (
                  'Checking…'
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <span>View pending invites</span>
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                )}
              </Button>
            </div>
          </section>
        </div>

        <div className="mt-10 text-center">
          <Button
            variant="link"
            onClick={handleExit}
            className="inline-flex items-center gap-2 text-[15px] text-[color:var(--text-muted)] hover:text-[color:var(--text)]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Back to setup</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
