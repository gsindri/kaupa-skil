
import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSupportSessions } from '@/hooks/useSupportSessions'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

interface SupportSessionDialogProps {
  open: boolean
  onClose: () => void
}

export function SupportSessionDialog({ open, onClose }: SupportSessionDialogProps) {
  const [selectedTenant, setSelectedTenant] = useState('')
  const [reason, setReason] = useState('')
  const [duration, setDuration] = useState('60')
  const { createSupportSession } = useSupportSessions()

  // Get all tenants for selection
  const { data: tenants } = useQuery({
    queryKey: ['all-tenants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select('id, name')
        .order('name')

      if (error) throw error
      return data
    }
  })

  const handleSubmit = async () => {
    if (!selectedTenant || !reason.trim()) return

    createSupportSession.mutate({
      tenantId: selectedTenant,
      reason: reason.trim(),
      duration: parseInt(duration)
    }, {
      onSuccess: () => {
        setSelectedTenant('')
        setReason('')
        setDuration('60')
        onClose()
      }
    })
  }

  const commonReasons = [
    'Customer support request',
    'Technical troubleshooting',
    'Data investigation',
    'Account recovery',
    'Configuration assistance'
  ]

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Support Session</DialogTitle>
          <DialogDescription>
            Create a consented impersonation session for customer support.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="tenant">Target Tenant</Label>
            <Select value={selectedTenant} onValueChange={setSelectedTenant}>
              <SelectTrigger>
                <SelectValue placeholder="Select tenant..." />
              </SelectTrigger>
              <SelectContent>
                {tenants?.map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="reason">Reason for support session</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent>
                {commonReasons.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {reason && (
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Or enter custom reason..."
                className="mt-2"
              />
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
                <SelectItem value="240">4 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedTenant || !reason.trim() || createSupportSession.isPending}
          >
            Create Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
