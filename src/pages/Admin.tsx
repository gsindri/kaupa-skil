
import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Shield, Users, Activity, AlertTriangle, TestTube, BookOpen } from 'lucide-react'
import { ElevationBanner } from '@/components/admin/ElevationBanner'
import { SupportSessionBanner } from '@/components/admin/SupportSessionBanner'
import { ElevationDialog } from '@/components/admin/ElevationDialog'
import { SupportSessionDialog } from '@/components/admin/SupportSessionDialog'
import { TenantUserManagement } from '@/components/admin/TenantUserManagement'
import { UserPermissionsPanel } from '@/components/admin/UserPermissionsPanel'
import { InviteUserDialog } from '@/components/admin/InviteUserDialog'
import { CurrentUserRole } from '@/components/admin/CurrentUserRole'
import { PendingAdminActions } from '@/components/admin/PendingAdminActions'
import { JobManagement } from '@/components/admin/JobManagement'
import { AuditLogExport } from '@/components/admin/AuditLogExport'
import { SecurityMonitoring } from '@/components/admin/SecurityMonitoring'
import { SecurityTesting } from '@/components/admin/SecurityTesting'
import { SecurityDocumentation } from '@/components/admin/SecurityDocumentation'

export default function Admin() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Administration
          </h1>
          <p className="text-muted-foreground mt-1">
            Platform administration, security monitoring, and user management
          </p>
        </div>
        <CurrentUserRole />
      </div>

      {/* Security Banners */}
      <div className="space-y-4">
        <ElevationBanner />
        <SupportSessionBanner />
      </div>

      <Tabs defaultValue="monitoring" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Monitoring
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="actions" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Actions
          </TabsTrigger>
          <TabsTrigger value="jobs" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Jobs
          </TabsTrigger>
          <TabsTrigger value="testing" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Testing
          </TabsTrigger>
          <TabsTrigger value="docs" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Docs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monitoring" className="space-y-6">
          <SecurityMonitoring />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TenantUserManagement />
            <UserPermissionsPanel />
          </div>
          <InviteUserDialog />
        </TabsContent>

        <TabsContent value="actions" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ElevationDialog />
            <SupportSessionDialog />
          </div>
          <PendingAdminActions />
          <AuditLogExport />
        </TabsContent>

        <TabsContent value="jobs" className="space-y-6">
          <JobManagement />
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <SecurityTesting />
        </TabsContent>

        <TabsContent value="docs" className="space-y-6">
          <SecurityDocumentation />
        </TabsContent>
      </Tabs>
    </div>
  )
}
