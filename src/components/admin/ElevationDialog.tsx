
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
import { useAdminElevation } from '@/hooks/useAdminElevation'

interface ElevationDialogProps {
  open: boolean
  onClose: () => void
}

export function ElevationDialog({ open, onClose }: ElevationDialogProps) {
  const [reason, setReason] = useState('')
  const [duration, setDuration] = useState('30')
  const { createElevation } = useAdminElevation()

  const handleSubmit = async () => {
    if (!reason.trim()) return

    createElevation.mutate({
      reason: reason.trim(),
      duration: parseInt(duration)
    }, {
      onSuccess: () => {
        setReason('')
        setDuration('30')
        onClose()
      }
    })
  }

  const commonReasons = [
    'Emergency incident response',
    'Customer support escalation',
    'System maintenance',
    'Data recovery operation',
    'Security investigation'
  ]

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request Privilege Elevation</DialogTitle>
          <DialogDescription>
            Elevate your privileges for administrative tasks. This action is logged and time-limited.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="reason">Reason for elevation</Label>
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
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
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
            disabled={!reason.trim() || createElevation.isPending}
          >
            Request Elevation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
