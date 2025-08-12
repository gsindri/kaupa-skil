
import React from 'react'
import { TenantUserManagement } from '@/components/admin/TenantUserManagement'
import { CurrentUserRole } from '@/components/admin/CurrentUserRole'

export default function Admin() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground">
          Manage your organization's users and permissions
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <CurrentUserRole />
        </div>
        
        <div className="lg:col-span-2">
          <TenantUserManagement />
        </div>
      </div>
    </div>
  )
}
