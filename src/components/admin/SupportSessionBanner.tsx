
import React, { useEffect, useState } from 'react'
import { AlertTriangle, Clock, X, Eye } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useSupportSessions } from '@/hooks/useSupportSessions'

export function SupportSessionBanner() {
  const { supportSessions, revokeSupportSession } = useSupportSessions()
  const [timeLeft, setTimeLeft] = useState<string>('')

  const activeSession = supportSessions?.find(s => 
    new Date(s.ends_at) > new Date() && !s.revoked_at
  )

  useEffect(() => {
    if (!activeSession) return

    const updateTimeLeft = () => {
      const now = new Date()
      const endsAt = new Date(activeSession.ends_at)
      const diff = endsAt.getTime() - now.getTime()

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
  }, [activeSession])

  if (!activeSession) {
    return null
  }

  return (
    <Alert className="mb-4 border-yellow-500 bg-yellow-50 text-yellow-900">
      <Eye className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium">Viewing as {activeSession.tenant?.name}</span>
          <div className="flex items-center gap-1 text-sm">
            <Clock className="h-3 w-3" />
            <span>Expires in {timeLeft}</span>
          </div>
          <span className="text-sm opacity-75">
            Reason: {activeSession.reason}
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => revokeSupportSession.mutate(activeSession.id)}
          disabled={revokeSupportSession.isPending}
        >
          <X className="h-3 w-3 mr-1" />
          End Session
        </Button>
      </AlertDescription>
    </Alert>
  )
}
