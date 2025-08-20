import React from 'react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

export function OrganizationSettings() {
  const navigate = useNavigate()

  return (
    <div className="space-y-4">
      <Button onClick={() => navigate('/settings/organization/create')}>Create Organization</Button>
      <Button variant="outline" onClick={() => navigate('/settings/organization/join')}>Join Organization</Button>
    </div>
  )
}
