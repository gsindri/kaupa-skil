import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Shield, Users, Activity, AlertTriangle, TestTube, BookOpen, PackageSearch, TrendingUp, ShieldCheck } from 'lucide-react'
import { ElevationBanner } from '@/components/layout/ElevationBanner'
import { SupportSessionBanner } from '@/components/admin/SupportSessionBanner'
import { ElevationDialog } from '@/components/admin/ElevationDialog'
import { SupportSessionDialog } from '@/components/admin/SupportSessionDialog'
import { TenantUserManagement } from '@/components/admin/TenantUserManagement'
import { InviteUserDialog } from '@/components/admin/InviteUserDialog'
import { CurrentUserRole } from '@/components/admin/CurrentUserRole'
import { PendingAdminActions } from '@/components/admin/PendingAdminActions'
import { JobManagement } from '@/components/admin/JobManagement'
import { AuditLogExport } from '@/components/admin/AuditLogExport'
import { SecurityMonitoring } from '@/components/admin/SecurityMonitoring'
import { SecurityTesting } from '@/components/admin/SecurityTesting'
import { SecurityDocumentation } from '@/components/admin/SecurityDocumentation'
import { Button } from '@/components/ui/button'
import { UnmatchedProductsTable } from '@/components/admin/UnmatchedProductsTable'
import { PlatformAdminSetup } from '@/components/admin/PlatformAdminSetup'
import { Link } from 'react-router-dom'

export default function Admin() {
  const [elevationDialogOpen, setElevationDialogOpen] = useState(false)
  const [supportSessionDialogOpen, setSupportSessionDialogOpen] = useState(false)

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
        <TabsList className="grid w-full grid-cols-10">
          <TabsTrigger value="setup" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Setup
          </TabsTrigger>
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
          <TabsTrigger value="benchmarks" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Benchmarks
          </TabsTrigger>
          <TabsTrigger value="consent" className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Consent
          </TabsTrigger>
          <TabsTrigger value="unmatched" className="flex items-center gap-2">
            <PackageSearch className="h-4 w-4" />
            Unmatched
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

        <TabsContent value="setup" className="space-y-6">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Security Setup</h2>
              <p className="text-muted-foreground">
                Complete the initial security configuration for your platform.
              </p>
            </div>
            <PlatformAdminSetup />
          </div>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <SecurityMonitoring />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <TenantUserManagement />
          <InviteUserDialog />
        </TabsContent>

        <TabsContent value="actions" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Privilege Elevation</h3>
              <p className="text-sm text-muted-foreground">
                Request temporary elevated privileges for administrative tasks.
              </p>
              <Button onClick={() => setElevationDialogOpen(true)}>
                Request Elevation
              </Button>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Support Sessions</h3>
              <p className="text-sm text-muted-foreground">
                Create consented impersonation sessions for customer support.
              </p>
              <Button onClick={() => setSupportSessionDialogOpen(true)}>
                Create Support Session
              </Button>
            </div>
          </div>
          <PendingAdminActions />
          <AuditLogExport />
        </TabsContent>

        <TabsContent value="jobs" className="space-y-6">
          <JobManagement />
        </TabsContent>

        <TabsContent value="benchmarks" className="space-y-6">
          <div className="space-y-4">
            <p className="text-muted-foreground">
              The Benchmark Management feature allows you to configure privacy thresholds,
              run monthly price aggregations, and view benchmark data.
            </p>
            <Link to="/admin/benchmarks">
              <Button>
                <TrendingUp className="mr-2 h-4 w-4" />
                Open Benchmark Management
              </Button>
            </Link>
          </div>
        </TabsContent>

        <TabsContent value="consent" className="space-y-6">
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Manage which suppliers participate in price aggregation. Suppliers can opt out
              to exclude their data from benchmark calculations.
            </p>
            <Link to="/admin/supplier-consent">
              <Button>
                <ShieldCheck className="mr-2 h-4 w-4" />
                Open Supplier Consent Management
              </Button>
            </Link>
          </div>
        </TabsContent>

        <TabsContent value="unmatched" className="space-y-6">
          <UnmatchedProductsTable />
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <SecurityTesting />
        </TabsContent>

        <TabsContent value="docs" className="space-y-6">
          <SecurityDocumentation />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ElevationDialog 
        open={elevationDialogOpen} 
        onClose={() => setElevationDialogOpen(false)} 
      />
      <SupportSessionDialog 
        open={supportSessionDialogOpen} 
        onClose={() => setSupportSessionDialogOpen(false)} 
      />
    </div>
  )
}
