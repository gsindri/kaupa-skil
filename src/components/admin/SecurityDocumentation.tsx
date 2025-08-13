
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  BookOpen, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users, 
  Database,
  Key,
  Activity
} from 'lucide-react'

export function SecurityDocumentation() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BookOpen className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Security Documentation</h2>
      </div>

      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Architecture Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <p>
            This system implements a comprehensive multi-tenant security model with role-based access control,
            audit logging, and administrative oversight capabilities.
          </p>
          
          <h4 className="font-semibold mt-4 mb-2">Key Security Features:</h4>
          <ul className="space-y-1">
            <li>• Row Level Security (RLS) on all data tables</li>
            <li>• Platform admin elevation system with time-limited access</li>
            <li>• Support session impersonation with audit trails</li>
            <li>• Comprehensive audit logging for all sensitive operations</li>
            <li>• Automated security monitoring and alerting</li>
            <li>• Job queue system with proper authorization</li>
          </ul>
        </CardContent>
      </Card>

      {/* Incident Response */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Incident Response Runbook
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Security Incident Detected</AlertTitle>
            <AlertDescription>
              Follow these steps immediately when a security alert is triggered:
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="flex gap-3">
              <Badge variant="destructive" className="min-w-[60px] justify-center">
                STEP 1
              </Badge>
              <div>
                <h4 className="font-semibold">Assess the Threat</h4>
                <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                  <li>• Check Security Monitoring dashboard for active alerts</li>
                  <li>• Review suspicious elevation patterns and prolonged sessions</li>
                  <li>• Identify affected users and tenants</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <Badge variant="destructive" className="min-w-[60px] justify-center">
                STEP 2
              </Badge>
              <div>
                <h4 className="font-semibold">Immediate Containment</h4>
                <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                  <li>• Revoke active elevations if suspicious</li>
                  <li>• Terminate active support sessions if necessary</li>
                  <li>• Disable affected user accounts if needed</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <Badge variant="secondary" className="min-w-[60px] justify-center">
                STEP 3
              </Badge>
              <div>
                <h4 className="font-semibold">Investigation</h4>
                <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                  <li>• Export audit logs for the affected timeframe</li>
                  <li>• Review all actions taken by suspicious accounts</li>
                  <li>• Check for data access patterns or unusual activities</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <Badge variant="outline" className="min-w-[60px] justify-center">
                STEP 4
              </Badge>
              <div>
                <h4 className="font-semibold">Recovery & Communication</h4>
                <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                  <li>• Document findings and actions taken</li>
                  <li>• Notify affected tenants if data was compromised</li>
                  <li>• Implement additional controls if vulnerabilities found</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Break Glass Procedures */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Break Glass Emergency Procedures
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertTitle>Emergency Access Required</AlertTitle>
            <AlertDescription>
              Use these procedures only in critical situations where normal access paths are unavailable.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                Platform Admin Elevation
              </h4>
              <div className="text-sm space-y-2">
                <p><strong>When to use:</strong> Critical system issues requiring elevated privileges</p>
                <p><strong>Process:</strong></p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Navigate to Admin → Elevation</li>
                  <li>Provide detailed business justification</li>
                  <li>Set minimum required duration</li>
                  <li>Create elevation and perform necessary actions</li>
                  <li>Manually revoke when complete</li>
                </ol>
                <p className="text-yellow-600"><strong>Note:</strong> All elevated actions are logged</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Support Session Access
              </h4>
              <div className="text-sm space-y-2">
                <p><strong>When to use:</strong> Customer support requiring tenant impersonation</p>
                <p><strong>Process:</strong></p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Navigate to Admin → Support Sessions</li>
                  <li>Select target tenant</li>
                  <li>Provide support ticket or justification</li>
                  <li>Set session duration (max 2 hours)</li>
                  <li>Perform support actions as needed</li>
                  <li>End session when complete</li>
                </ol>
                <p className="text-yellow-600"><strong>Note:</strong> Customer should be notified</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Security QA Checklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Database Security</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>All tables have RLS enabled</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Proper policies for tenant isolation</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Security definer functions properly scoped</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Performance indexes on security queries</span>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold mb-2">Access Control</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Platform admin privileges properly restricted</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Elevation system with time limits</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Support sessions with audit trails</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Role-based capability system</span>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold mb-2">Monitoring & Logging</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>All security events logged to audit_events</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Automated detection of suspicious patterns</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Monitoring dashboard for real-time alerts</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Security testing suite implemented</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technical Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Technical Reference
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Key Functions</h4>
              <div className="space-y-2 text-sm font-mono">
                <div>create_elevation(reason, duration)</div>
                <div>revoke_elevation(elevation_id)</div>
                <div>create_support_session(tenant, reason)</div>
                <div>has_capability(cap, scope, id)</div>
                <div>log_audit_event(action, type, id)</div>
                <div>detect_suspicious_elevations()</div>
                <div>validate_security_policies()</div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Security Tables</h4>
              <div className="space-y-2 text-sm font-mono">
                <div>platform_admins</div>
                <div>admin_elevations</div>
                <div>support_sessions</div>
                <div>audit_events</div>
                <div>pending_admin_actions</div>
                <div>jobs / job_logs</div>
                <div>memberships / grants</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
