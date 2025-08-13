
import React from 'react'
import { useSecurityMonitoring } from '@/hooks/useSecurityMonitoring'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, Shield, Clock, Database, TrendingUp, CheckCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export function SecurityMonitoring() {
  const {
    suspiciousElevations,
    failedJobs,
    prolongedElevations,
    securityEvents,
    securityPolicies,
    securityDefinerFunctions,
    isLoading
  } = useSecurityMonitoring()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent className="animate-pulse">
                <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const getPolicyStatusColor = (status: string) => {
    switch (status) {
      case 'OK': return 'default'
      case 'WARNING: Few Policies': return 'secondary'
      case 'RISK: No Policies': return 'destructive'
      case 'RISK: RLS Disabled': return 'destructive'
      default: return 'default'
    }
  }

  const getPolicyStatusIcon = (status: string) => {
    switch (status) {
      case 'OK': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'WARNING: Few Policies': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'RISK: No Policies': 
      case 'RISK: RLS Disabled': return <AlertTriangle className="h-4 w-4 text-red-600" />
      default: return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Security Monitoring Dashboard</h2>
      </div>

      {/* Alerts Section */}
      {(suspiciousElevations && suspiciousElevations.length > 0) || 
       (prolongedElevations && prolongedElevations.length > 0) ? (
        <div className="space-y-4">
          {suspiciousElevations && suspiciousElevations.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Suspicious Elevation Activity Detected</AlertTitle>
              <AlertDescription>
                {suspiciousElevations.length} user(s) with unusual elevation patterns in the last 24 hours.
                Review the details below immediately.
              </AlertDescription>
            </Alert>
          )}
          
          {prolongedElevations && prolongedElevations.length > 0 && (
            <Alert variant="destructive">
              <Clock className="h-4 w-4" />
              <AlertTitle>Prolonged Elevations Active</AlertTitle>
              <AlertDescription>
                {prolongedElevations.length} elevation(s) lasting longer than 1 hour currently active.
                Consider revoking if no longer needed.
              </AlertDescription>
            </Alert>
          )}
        </div>
      ) : null}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Suspicious Elevations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Suspicious Elevations</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {suspiciousElevations?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
            {suspiciousElevations && suspiciousElevations.length > 0 && (
              <div className="mt-3 space-y-2">
                {suspiciousElevations.slice(0, 3).map((elevation, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="font-mono">{elevation.user_id.slice(0, 8)}...</span>
                    <span>{elevation.elevation_count} elevations</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Failed Jobs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Failed Jobs</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {failedJobs?.reduce((sum, job) => sum + Number(job.failed_count), 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
            {failedJobs && failedJobs.length > 0 && (
              <div className="mt-3 space-y-2">
                {failedJobs.slice(0, 3).map((job, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span>{job.job_type}</span>
                    <span>{job.failed_count} failures</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Prolonged Elevations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Prolonged Elevations</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {prolongedElevations?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Currently active</p>
            {prolongedElevations && prolongedElevations.length > 0 && (
              <div className="mt-3 space-y-2">
                {prolongedElevations.slice(0, 3).map((elevation, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="font-mono">{elevation.user_id.slice(0, 8)}...</span>
                    <span>{elevation.duration_minutes}m</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Security Events</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {securityEvents?.reduce((sum, event) => sum + Number(event.event_count), 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
            {securityEvents && securityEvents.length > 0 && (
              <div className="mt-3 space-y-2">
                {securityEvents.slice(0, 3).map((event, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span>{event.event_type.replace('_', ' ')}</span>
                    <span>{event.event_count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* RLS Policy Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">RLS Policy Status</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {securityPolicies?.filter(p => p.status === 'OK').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              of {securityPolicies?.length || 0} tables secure
            </p>
            {securityPolicies && (
              <div className="mt-3 space-y-1">
                {securityPolicies
                  .filter(p => p.status !== 'OK')
                  .slice(0, 3)
                  .map((policy, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span>{policy.table_name}</span>
                      <Badge variant={getPolicyStatusColor(policy.status)} className="text-xs">
                        {policy.status.includes('RISK') ? 'RISK' : 'WARN'}
                      </Badge>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Definer Functions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Security Functions</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {securityDefinerFunctions?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">SECURITY DEFINER functions</p>
            {securityDefinerFunctions && securityDefinerFunctions.length > 0 && (
              <div className="mt-3 space-y-1">
                {securityDefinerFunctions.slice(0, 3).map((func, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span>{func.function_name}</span>
                    <span className="text-muted-foreground">{func.language}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RLS Policy Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Row Level Security Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {securityPolicies?.map((policy, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getPolicyStatusIcon(policy.status)}
                    <div>
                      <div className="font-medium">{policy.table_name}</div>
                      <div className="text-sm text-muted-foreground">
                        RLS: {policy.has_rls ? 'Enabled' : 'Disabled'} • 
                        {policy.policy_count} policies
                      </div>
                    </div>
                  </div>
                  <Badge variant={getPolicyStatusColor(policy.status)}>
                    {policy.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Security Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Events (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {securityEvents?.map((event, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium capitalize">
                      {event.event_type.replace(/_/g, ' ')}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {event.unique_actors} unique actors • 
                      Last: {formatDistanceToNow(new Date(event.last_occurrence), { addSuffix: true })}
                    </div>
                  </div>
                  <Badge variant="outline">
                    {event.event_count}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
