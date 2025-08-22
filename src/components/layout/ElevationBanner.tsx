
import React from 'react'
import { Shield, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSearchParams } from 'react-router-dom'

export function ElevationBanner() {
  const [searchParams, setSearchParams] = useSearchParams()
  const isElevated = searchParams.get('elevated') === 'true'

  if (!isElevated) return null

  const handleDismiss = () => {
    const newParams = new URLSearchParams(searchParams)
    newParams.delete('elevated')
    setSearchParams(newParams)
  }

  return (
    <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Shield className="h-5 w-5 text-orange-400 mr-3" />
          <div>
            <p className="text-sm font-medium text-orange-800">
              Elevated Session Active
            </p>
            <p className="text-sm text-orange-700">
              You are currently operating with elevated privileges. Use with caution.
            </p>
          </div>
        </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-orange-600 hover:text-orange-800"
            aria-label="Dismiss elevation banner"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
}
