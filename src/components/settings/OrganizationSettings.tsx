import React from 'react'
import { Button } from '@/components/ui/button'
import { useNavigate, useLocation } from 'react-router-dom'

export function OrganizationSettings() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className="space-y-4">
      <Button
        onClick={() => {
          const targetPath = '/settings/organization/create'
          const currentPath = `${location.pathname}${location.search}${location.hash}`
          const state =
            currentPath === targetPath
              ? undefined
              : { from: currentPath, allowExisting: true }
          navigate(targetPath, { state })
        }}
      >
        Create Organization
      </Button>
      <Button
        variant="outline"
        onClick={() => {
          const targetPath = '/settings/organization/join'
          const currentPath = `${location.pathname}${location.search}${location.hash}`
          navigate(targetPath, {
            state: currentPath === targetPath ? undefined : { from: currentPath }
          })
        }}
      >
        Join Organization
      </Button>
    </div>
  )
}
