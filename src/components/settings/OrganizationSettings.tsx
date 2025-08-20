import React from 'react'
import { Button } from '@/components/ui/button'

export function OrganizationSettings() {
  return (
    <div className="space-y-4">
      <Button>Create Organization</Button>
      <Button variant="outline">Join Organization</Button>
    </div>
  )
}
