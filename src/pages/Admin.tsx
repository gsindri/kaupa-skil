
import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, Users, FileText, Settings, Zap, Eye, AlertTriangle, CheckSquare } from 'lucide-react'

import { TenantUserManagement } from '@/components/admin/TenantUserManagement'
import { CurrentUserRole } from '@/components/admin/CurrentUserRole'
import { ElevationBanner } from '@/components/admin/ElevationBanner'
import { ElevationDialog } from '@/components/admin/ElevationDialog'
import { SupportSessionDialog } from '@/components/admin/SupportSessionDialog'
import { PendingAdminActions } from '@/components/admin/PendingAdminActions'
import { JobManagement } from '@/components/admin/JobManagement'
import { AuditLogExport } from '@/components/admin/AuditLogExport'

import { useAdminElevation } from '@/hooks/useAdminElevation'
import { useSupportSessions } from '@/hooks/useSupportSessions'
import { useAuditLogs } from '@/hooks/useAuditLogs'
import { useJobs } from '@/hooks/useJobs'

export default function Admin() {
  const [elevationDialogOpen, setElevationDialogOpen] = useState(false)
  const [supportSessionDialogOpen, setSupportSessionDialogOpen] = useState(false)
  
  const { hasActiveElevation, elevations } = useAdminElevation()
  const { supportSessions } = useSupportSessions()
  const { auditLogs } = useAuditLogs()
  const { jobs } = useJobs()

  const activeElevations = elevations?.filter(e => 
    new Date(e.expires_at) > new Date() && !e.revoked_at
  ) || []

  const activeSupportSessions = supportSessions?.filter(s => 
    new Date(s.ends_at) > new Date() && !s.revoked_at
  ) || []

  const pendingJobs = jobs?.filter(j => j.status === 'pending') || []
  const runningJobs = jobs?.filter(j => j.status === 'running') || []

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground">
          Manage your organization's users, permissions, and security
        </p>
      </div>

      <ElevationBanner />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Elevations</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeElevations.length}</div>
            <p className="text-xs text-muted-foreground">
              Privilege escalations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Support Sessions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSupportSessions.length}</div>
            <p className="text-xs text-muted-foreground">
              Active impersonations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Jobs</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingJobs.length}</div>
            <p className="text-xs text-muted-foreground">
              Queued operations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running Jobs</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{runningJobs.length}</div>
            <p className="text-xs text-muted-foreground">
              Active operations
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        <Button 
          variant="outline" 
          onClick={() => setElevationDialogOpen(true)}
          disabled={hasActiveElevation}
        >
          <Shield className="h-4 w-4 mr-2" />
          {hasActiveElevation ? 'Elevated' : 'Request Elevation'}
        </Button>
        
        <Button variant="outline" onClick={() => setSupportSessionDialogOpen(true)}>
          <Eye className="h-4 w-4 mr-2" />
          Create Support Session
        </Button>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Users & Permissions
          </TabsTrigger>
          <TabsTrigger value="pending">
            <CheckSquare className="h-4 w-4 mr-2" />
            Pending Actions
          </TabsTrigger>
          <TabsTrigger value="elevations">
            <Shield className="h-4 w-4 mr-2" />
            Elevations
          </TabsTrigger>
          <TabsTrigger value="support">
            <Eye className="h-4 w-4 mr-2" />
            Support Sessions
          </TabsTrigger>
          <TabsTrigger value="jobs">
            <Settings className="h-4 w-4 mr-2" />
            Jobs
          </TabsTrigger>
          <TabsTrigger value="audit">
            <FileText className="h-4 w-4 mr-2" />
            Audit Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <CurrentUserRole />
            </div>
            
            <div className="lg:col-span-2">
              <TenantUserManagement />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <PendingAdminActions />
        </TabsContent>

        <TabsContent value="elevations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Privilege Elevations</CardTitle>
              <CardDescription>
                Recent privilege escalation history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {elevations?.map((elevation) => (
                  <div key={elevation.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">{elevation.reason}</p>
                      <p className="text-sm text-muted-foreground">
                        Created: {new Date(elevation.created_at).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Expires: {new Date(elevation.expires_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {elevation.revoked_at ? (
                        <Badge variant="secondary">Revoked</Badge>
                      ) : new Date(elevation.expires_at) < new Date() ? (
                        <Badge variant="secondary">Expired</Badge>
                      ) : (
                        <Badge variant="destructive">Active</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="support" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Support Sessions</CardTitle>
              <CardDescription>
                Consented impersonation sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {supportSessions?.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">{session.reason}</p>
                      <p className="text-sm text-muted-foreground">
                        Tenant: {session.tenant?.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Started: {new Date(session.starts_at).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Ends: {new Date(session.ends_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {session.revoked_at ? (
                        <Badge variant="secondary">Revoked</Badge>
                      ) : new Date(session.ends_at) < new Date() ? (
                        <Badge variant="secondary">Expired</Badge>
                      ) : (
                        <Badge variant="default">Active</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <JobManagement />
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <div className="space-y-6">
            <AuditLogExport />
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Audit Logs</CardTitle>
                <CardDescription>
                  Recent system activities and changes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {auditLogs?.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium">{log.action}</p>
                        {log.entity_type && (
                          <p className="text-sm text-muted-foreground">
                            Entity: {log.entity_type}
                          </p>
                        )}
                        {log.reason && (
                          <p className="text-sm text-muted-foreground">
                            Reason: {log.reason}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {log.tenant?.name && (
                          <Badge variant="outline">{log.tenant.name}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

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
