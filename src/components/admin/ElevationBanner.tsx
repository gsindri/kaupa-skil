
import React, { useEffect, useState } from 'react'
import { AlertTriangle, Clock, X } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useAdminElevation } from '@/hooks/useAdminElevation'

export function ElevationBanner() {
  const { hasActiveElevation, elevations, revokeElevation } = useAdminElevation()
  const [timeLeft, setTimeLeft] = useState<string>('')

  const activeElevation = elevations?.find(e => 
    new Date(e.expires_at) > new Date() && !e.revoked_at
  )

  useEffect(() => {
    if (!activeElevation) return

    const updateTimeLeft = () => {
      const now = new Date()
      const expiresAt = new Date(activeElevation.expires_at)
      const diff = expiresAt.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeLeft('Expired')
        return
      }

      const minutes = Math.floor(diff / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`)
    }

    updateTimeLeft()
    const interval = setInterval(updateTimeLeft, 1000)

    return () => clearInterval(interval)
  }, [activeElevation])

  if (!hasActiveElevation || !activeElevation) {
    return null
  }

  return (
    <Alert className="mb-4 border-red-500 bg-red-50 text-red-900">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium">Elevated as SuperAdmin</span>
          <div className="flex items-center gap-1 text-sm">
            <Clock className="h-3 w-3" />
            <span>Expires in {timeLeft}</span>
          </div>
          <span className="text-sm opacity-75">
            Reason: {activeElevation.reason}
          </span>
        </div>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => revokeElevation.mutate(activeElevation.id)}
          disabled={revokeElevation.isPending}
        >
          <X className="h-3 w-3 mr-1" />
          Revoke Now
        </Button>
      </AlertDescription>
    </Alert>
  )
}
