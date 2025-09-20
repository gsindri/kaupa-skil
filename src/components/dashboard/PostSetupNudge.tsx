import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, Bell, Puzzle, X, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useAuth } from '@/contexts/useAuth'
import { useUserInvitation } from '@/hooks/useUserInvitation'
import type { BaseRole } from '@/lib/types/permissions'
import { useToast } from '@/hooks/use-toast'

const DISMISS_STORAGE_KEY = 'dashboard_post_setup_dismissed'

export function PostSetupNudge() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { toast } = useToast()
  const { inviteUser } = useUserInvitation()

  const [email, setEmail] = useState('')
  const [role, setRole] = useState<BaseRole>('member')
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const dismissed = window.localStorage.getItem(DISMISS_STORAGE_KEY)
    setIsDismissed(dismissed === 'true')
  }, [])

  if (!profile?.tenant_id || isDismissed) {
    return null
  }

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(DISMISS_STORAGE_KEY, 'true')
    }
    setIsDismissed(true)
  }

  const handleInvite = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!email || !profile.tenant_id) return
    try {
      await inviteUser.mutateAsync({
        email,
        tenantId: profile.tenant_id,
        baseRole: role
      })
      setEmail('')
    } catch (error) {
      // handled in hook
    }
  }

  const navigateWithToast = (path: string, description: string) => {
    toast({ title: 'Opening settings', description })
    navigate(path)
  }

  return (
    <section className="rounded-[16px] border border-[color:var(--surface-ring)] bg-[color:var(--surface-pop)] p-6 shadow-[var(--elev-shadow)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[color:var(--text)]">Keep momentum going</h2>
          <p className="text-[14px] text-[color:var(--text-muted)]">
            You’re all set. A few quick touches will help your team get the most from ProcureWise.
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={handleDismiss} aria-label="Dismiss setup tips">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-4 rounded-[14px] border border-[color:var(--surface-ring)] bg-[color:var(--surface-pop-2)]/50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-accent)]/15 text-[var(--brand-accent)]">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-[color:var(--text)]">Invite colleagues</h3>
              <p className="text-[13px] text-[color:var(--text-muted)]">
                Share access so buyers, approvers, and finance stay in sync.
              </p>
            </div>
          </div>
          <form className="space-y-3" onSubmit={handleInvite}>
            <Input
              type="email"
              required
              value={email}
              onChange={event => setEmail(event.target.value)}
              placeholder="name@company.com"
              className="h-11 rounded-[12px] border-[color:var(--surface-ring)] bg-[color:var(--surface-pop)]"
            />
            <div className="flex items-center gap-3">
              <Select value={role} onValueChange={value => setRole(value as BaseRole)}>
                <SelectTrigger className="h-11 w-full rounded-[12px] border-[color:var(--surface-ring)] bg-[color:var(--surface-pop)] text-left text-[13px]">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent className="rounded-[12px] border-[color:var(--surface-ring)] bg-[color:var(--surface-pop)]">
                  <SelectItem value="owner" className="text-[13px]">Owner</SelectItem>
                  <SelectItem value="admin" className="text-[13px]">Admin</SelectItem>
                  <SelectItem value="member" className="text-[13px]">Member</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="submit"
                size="lg"
                className="whitespace-nowrap"
                disabled={!email || inviteUser.isPending}
              >
                {inviteUser.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Sending
                  </span>
                ) : (
                  'Invite'
                )}
              </Button>
            </div>
          </form>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-[14px] border border-[color:var(--surface-ring)] bg-[color:var(--surface-pop-2)]/50 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-accent)]/15 text-[var(--brand-accent)]">
              <Bell className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-[15px] font-semibold text-[color:var(--text)]">Set notification preferences</h3>
              <p className="text-[13px] text-[color:var(--text-muted)]">
                Choose who hears about price changes, approvals, and supplier updates.
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-3"
                onClick={() => navigateWithToast('/settings?panel=notifications', 'Tune alerts and delivery channels.')}
              >
                Configure alerts
              </Button>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-[14px] border border-[color:var(--surface-ring)] bg-[color:var(--surface-pop-2)]/50 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-accent)]/15 text-[var(--brand-accent)]">
              <Puzzle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-[15px] font-semibold text-[color:var(--text)]">Add integrations</h3>
              <p className="text-[13px] text-[color:var(--text-muted)]">
                Connect accounting, POS, or delivery systems to sync orders and invoices.
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-3"
                onClick={() => navigateWithToast('/settings?panel=integrations', 'Manage partner integrations and connectors.')}
              >
                Explore integrations
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
